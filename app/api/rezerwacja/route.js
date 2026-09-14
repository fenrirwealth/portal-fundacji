import { auth } from "../../../auth";
import { db, WARUNKI_PUBLIKACJI, WERSJA_REGULAMINU } from "../../../lib/db";

const DNI_NA_POTWIERDZENIE = 3;

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
  const teraz = new Date();

  const kandydaci = await db.rezerwacja.findMany({
    where: { status: "OCZEKUJE", wygasa: { lt: teraz } },
    select: { id: true, listId: true },
  });
  if (!kandydaci.length) return 0;

  const doZwolnienia = [];
  for (const r of kandydaci) {
    const wynik = await db.rezerwacja.updateMany({
      where: { id: r.id, status: "OCZEKUJE", wygasa: { lt: teraz } },
      data: { status: "WYGASLA" },
    });
    if (wynik.count === 1) doZwolnienia.push(r.listId);
  }

  if (doZwolnienia.length) {
    await db.list.updateMany({
      where: { id: { in: doZwolnienia }, status: "ZAREZERWOWANY" },
      data: { status: "OPUBLIKOWANY" },
    });
  }
  return doZwolnienia.length;
}

export async function POST(request) {
  // Uzytkownik pochodzi WYLACZNIE z sesji po stronie serwera.
  // Przyjmowanie identyfikatora z przegladarki pozwalaloby rezerwowac
  // listy jako ktos inny.
  const sesja = await auth();
  if (!sesja?.user?.id) {
    return Response.json({ blad: "Zaloguj sie, zeby zarezerwowac list." }, { status: 401 });
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
          ? "Regulamin akcji sie zmienil. Zapoznaj sie z nowa wersja i zaakceptuj ja."
          : "Zaakceptuj regulamin akcji, zanim zarezerwujesz list.",
        wymagaZgody: true,
      },
      { status: 403 }
    );
  }

  const { listId } = await request.json();
  if (!listId) {
    return Response.json({ blad: "Brak identyfikatora listu." }, { status: 400 });
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

  const wygasa = new Date();
  wygasa.setDate(wygasa.getDate() + DNI_NA_POTWIERDZENIE);

  try {
    // Zajecie listu warunkiem na statusie zamiast blokady jawnej:
    // gdy zmieniony wiersz to zero, ktos byl pierwszy.
    //
    // Limitu "jeden aktywny list na konto" NIE sprawdzamy licznikiem
    // przed transakcja — dwa rownolegle zadania zobaczylyby zero
    // aktywnych rezerwacji i oba przeszlyby dalej. Pilnuje tego
    // czesciowy indeks unikalny w bazie, a my lapiemy P2002.
    const rezerwacja = await db.$transaction(async (tx) => {
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
        data: { listId, userId: sesja.user.id, wygasa, status: "OCZEKUJE" },
      });
    });

    return Response.json({
      ok: true,
      rezerwacjaId: rezerwacja.id,
      wygasa,
      terminDostarczenia: edycja.terminDostarczenia,
    });
  } catch (e) {
    if (e.message === "NIEDOSTEPNY") {
      return Response.json(
        { blad: "Ten list jest juz niedostepny." },
        { status: 409 }
      );
    }
    if (e.code === "P2002") {
      return Response.json(
        { blad: "Masz juz zarezerwowany jeden list. Dokoncz go albo zrezygnuj, zanim wybierzesz kolejny." },
        { status: 429 }
      );
    }
    throw e;
  }
}
