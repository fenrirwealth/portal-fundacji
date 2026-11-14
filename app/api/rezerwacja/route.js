import { auth } from "../../../auth";
import { db, WARUNKI_PUBLIKACJI, WERSJA_REGULAMINU } from "../../../lib/db";
import { jsonZLimitem, odpowiedzBleduHttp } from "../../../lib/http.mjs";
import { KLUCZ_LICZNIKA, usunCache } from "../../../lib/cache";
import { kolejkujPowiadomienieRezerwacji } from "../../../lib/kolejka-email";

import { normalizujTelefonRezerwacji } from "../../../lib/telefon-rezerwacji.mjs";
import { terminKontaktu, LIMIT_AKTYWNYCH_LISTOW } from "../../../lib/zasady-akcji.mjs";
import { wygasRezerwacje, wolneMiejsceNaKoncie } from "../../../lib/rezerwacje.mjs";

// ------------------------------------------------------------
//  Zwalnianie wygaslych rezerwacji
//
//  Kazdy rekord zmieniamy warunkowo, nie hurtem. Dzieki temu
//  rownolegle potwierdzenie i wygaszanie nie moga sie nadpisac:
//  potwierdzenie wymaga "wygasa > teraz", wygaszanie "wygasa < teraz".
//  Te warunki wykluczaja sie wzajemnie, wiec zawsze wygrywa dokladnie
//  jedna operacja, a list zwalniamy tylko wtedy, gdy jego rezerwacja
//  faktycznie zmienila status.
// ------------------------------------------------------------
export async function zwolnijWygasle() {
  const zwolnione = await wygasRezerwacje(db);
  if (zwolnione.length) await usunCache(KLUCZ_LICZNIKA);
  return zwolnione.length;
}

export async function POST(request) {
  // Uzytkownik pochodzi WYLACZNIE z sesji po stronie serwera.
  // Przyjmowanie identyfikatora z przegladarki pozwalaloby rezerwowac
  // listy jako ktos inny.
  const sesja = await auth();
  if (!sesja?.user?.id) {
    return Response.json({ blad: "Zaloguj się, żeby zarezerwować list." }, { status: 401 });
  }

  // Rezerwowac moze wylacznie osoba, ktora swiadomie zaakceptowala
  // regulamin akcji. Zgoda nie jest domyslna i nie zapisuje sie
  // "przy okazji" logowania.
  // Sprawdzamy date ORAZ wersje. Sama data oznaczalaby, ze zgoda
  // sprzed dwoch lat na inna tresc nadal wystarcza — a regulamin
  // zmienia sie miedzy edycjami razem z terminami i zasadami.
  const konto = await db.user.findUnique({
    where: { id: sesja.user.id },
    select: { zgodaRegulamin: true, wersjaRegulaminu: true },
  });
  if (!konto?.zgodaRegulamin || konto.wersjaRegulaminu !== WERSJA_REGULAMINU) {
    return Response.json(
      {
        blad: konto?.zgodaRegulamin
          ? "Regulamin akcji się zmienił. Zapoznaj się z nową wersją i zaakceptuj ją."
          : "Zaakceptuj regulamin akcji, zanim zarezerwujesz list.",
        wymagaZgody: true,
      },
      { status: 403 }
    );
  }

  let dane;
  try {
    dane = await jsonZLimitem(request, 2 * 1024);
  } catch (e) {
    const odpowiedz = odpowiedzBleduHttp(e);
    if (odpowiedz) return odpowiedz;
    throw e;
  }
  const { listId } = dane;
  if (typeof listId !== "string" || !listId) {
    return Response.json({ blad: "Brak identyfikatora listu." }, { status: 400 });
  }

  const telefonKontaktowy = normalizujTelefonRezerwacji(dane.telefon);
  if (!telefonKontaktowy) {
    return Response.json(
      { blad: "Podaj poprawny numer telefonu. Przy numerze zagranicznym dodaj kierunkowy kraju, np. +49." },
      { status: 400 }
    );
  }

  await zwolnijWygasle();

  // Rezerwowac mozna wylacznie listy z AKTYWNEJ edycji. Sam warunek
  // "id + status OPUBLIKOWANY" nie wystarcza: znajac identyfikator listu
  // z zeszlorocznej akcji dalo sie ominac interfejs i zarezerwowac go
  // wprost przez API.
  const edycja = await db.edycjaAkcji.findFirst({
    where: { aktywna: true },
    select: { id: true, terminDostarczenia: true },
  });
  if (!edycja) {
    return Response.json({ blad: "Akcja nie jest teraz prowadzona." }, { status: 409 });
  }

  const wygasa = terminKontaktu();

  try {
    // Zajecie listu warunkiem na statusie zamiast blokady jawnej:
    // gdy zmieniony wiersz to zero, ktos byl pierwszy.
    // Każda aktywna rezerwacja zajmuje jedno z 20 miejsc na koncie.
    // Blokada konta i ograniczenia bazy chronią także równoległe żądania.
    const rezerwacja = await db.$transaction(async (tx) => {
      const miejsceNaKoncie = await wolneMiejsceNaKoncie(tx, sesja.user.id);
      // Te same warunki publikacji co w widokach: zgoda dyrektora
      // wplynela, nie zostala cofnieta, karta weryfikacji zamknieta.
      // Gdyby administrator przestawil status na OPUBLIKOWANY bez
      // kompletu formalnosci, list i tak nie da sie zarezerwowac.
      const zajety = await tx.list.updateMany({
        where: {
          id: listId,
          edycjaId: edycja.id,
          ...WARUNKI_PUBLIKACJI,
          status: "OPUBLIKOWANY",
        },
        data: { status: "ZAREZERWOWANY" },
      });
      if (zajety.count === 0) throw new Error("NIEDOSTEPNY");

      return tx.rezerwacja.create({
        data: { listId, userId: sesja.user.id, miejsceNaKoncie, telefonKontaktowy, wygasa, status: "OCZEKUJE" },
        select: { id: true },
      });
    });

    await usunCache(KLUCZ_LICZNIKA);
    await kolejkujPowiadomienieRezerwacji(db, "REZERWACJA", rezerwacja.id)
      .catch((blad) => console.error("[rezerwacja] E-mail:", blad.message));
    return Response.json({
      ok: true,
      rezerwacjaId: rezerwacja.id,
      wygasa,
      terminDostarczenia: edycja.terminDostarczenia,
    });
  } catch (e) {
    if (e.message === "NIEDOSTEPNY") {
      return Response.json(
        { blad: "Ten list jest już niedostępny." },
        { status: 409 }
      );
    }
    if (e.message === "LIMIT_REZERWACJI") {
      return Response.json(
        { blad: `Masz już ${LIMIT_AKTYWNYCH_LISTOW} aktywnych rezerwacji. Dokończ jedną z nich albo zrezygnuj, zanim wybierzesz kolejny list.` },
        { status: 429 }
      );
    }
    if (e.code === "P2002") {
      return Response.json({ blad: "Rezerwacje zmieniły się w trakcie zapisu. Odśwież stronę i spróbuj ponownie." }, { status: 409 });
    }
    throw e;
  }
}
