"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "../../lib/db";
import { wymagajRedakcji } from "../../lib/admin";
import { KATEGORIE, WOJEWODZTWA } from "../../lib/slowniki";
import { KLUCZ_LICZNIKA, usunCache } from "../../lib/cache";
import { kolejkujEmail } from "../../lib/kolejka-email";
import { nowyTokenPrzesylania } from "../../lib/skany";

const POLA_WERYFIKACJI = [
  "zgodaDolaczona",
  "brakNazwiska",
  "brakPlacowki",
  "brakMiejscowosci",
  "brakInnychOsob",
  "brakDanychWrazliwych",
  "brakWizerunku",
  "metadaneUsuniete",
  "nazwaPlikuPoprawna",
  "opisPoprawny",
];

function tekst(formData, nazwa, limit = 500) {
  return String(formData.get(nazwa) || "").trim().slice(0, limit);
}

function doDaty(wartosc) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wartosc)) return null;
  const data = new Date(wartosc + "T12:00:00Z");
  return Number.isNaN(data.getTime()) ? null : data;
}

function wrocZBledem(sciezka, komunikat) {
  redirect(sciezka + (sciezka.includes("?") ? "&" : "?") + "blad=" + encodeURIComponent(komunikat));
}

// Bledy walidacji ZWRACAMY zamiast przekierowywac z komunikatem w adresie.
//
// Poprzednio kazdy blad konczyl sie przeladowaniem strony i utrata
// wszystkiego, co redaktor wpisal — przy formularzu listu to kilkanascie
// pol. Teraz formularz dostaje bledy przypisane do konkretnych pol oraz
// wartosci, ktore przyszly, i odtwarza je bez przeladowania.
//
// Przekierowanie zostaje wylacznie przy POWODZENIU oraz przy bledach
// nie-walidacyjnych (brak uprawnien, konflikt wersji, nieistniejacy rekord),
// bo tam nie ma czego odtwarzac.
function bledy(mapa, wartosci) {
  return { ok: false, bledy: mapa, wartosci };
}

// Wartosci formularza odsylane z powrotem, zeby nic nie przepadlo.
function wartosciListu(formData) {
  return {
    imie: tekst(formData, "imie", 80),
    wiek: tekst(formData, "wiek", 3),
    wojewodztwo: tekst(formData, "wojewodztwo", 40).toLowerCase(),
    kategoria: tekst(formData, "kategoria", 20),
    marzenie: tekst(formData, "marzenie", 300),
    rozmiar: tekst(formData, "rozmiar", 80),
    opis: tekst(formData, "opis", 1200),
    zdjecieUrl: tekst(formData, "zdjecieUrl", 1000),
    skanId: tekst(formData, "skanId", 80),
    udzialId: tekst(formData, "udzialId", 80),
  };
}

// Wspolna walidacja pol publicznych listu. Te same reguly dla tworzenia
// i edycji — wczesniej byly powielone i mogly sie rozjechac.
function sprawdzPolaListu(w) {
  const mapa = {};
  if (!w.imie) mapa.imie = "Podaj imię dziecka.";
  else if (w.imie.length > 80) mapa.imie = "Imię jest za długie.";

  const wiek = Number(w.wiek);
  if (!Number.isInteger(wiek) || wiek < 1 || wiek > 25) {
    mapa.wiek = "Wiek musi być liczbą od 1 do 25.";
  }
  if (!WOJEWODZTWA.includes(w.wojewodztwo)) mapa.wojewodztwo = "Wybierz województwo z listy.";
  if (!KATEGORIE.includes(w.kategoria)) mapa.kategoria = "Wybierz kategorię z listy.";
  if (w.marzenie.length < 3) mapa.marzenie = "Opisz marzenie — co najmniej 3 znaki.";
  if (w.zdjecieUrl && !/^https:\/\//i.test(w.zdjecieUrl)) {
    mapa.zdjecieUrl = "Adres zdjęcia musi zaczynać się od https://";
  }
  return mapa;
}

export async function utworzEdycje(formData) {
  await wymagajRedakcji();

  const rok = Number(tekst(formData, "rok", 4));
  const nazwa = tekst(formData, "nazwa", 120);
  const dataStart = doDaty(tekst(formData, "dataStart", 10));
  const dataKoniec = doDaty(tekst(formData, "dataKoniec", 10));
  const terminDostarczenia = doDaty(tekst(formData, "terminDostarczenia", 10));
  const aktywna = formData.get("aktywna") === "on";

  if (!Number.isInteger(rok) || rok < 2022 || rok > 2100 || nazwa.length < 3) {
    wrocZBledem("/admin", "Podaj poprawny rok i nazwę edycji.");
  }
  if (
    !dataStart ||
    !dataKoniec ||
    !terminDostarczenia ||
    dataStart > terminDostarczenia ||
    terminDostarczenia > dataKoniec
  ) {
    wrocZBledem("/admin", "Daty muszą mieć kolejność: start, termin dostarczenia, koniec.");
  }

  try {
    await db.$transaction(async (tx) => {
      if (aktywna) await tx.edycjaAkcji.updateMany({ data: { aktywna: false } });
      await tx.edycjaAkcji.create({
        data: { rok, nazwa, dataStart, dataKoniec, terminDostarczenia, aktywna },
      });
    });
  } catch (e) {
    if (e?.code === "P2002") wrocZBledem("/admin", "Edycja dla tego roku już istnieje.");
    throw e;
  }

  revalidatePath("/");
  revalidatePath("/listy");
  revalidatePath("/admin");
  redirect("/admin?sukces=edycja");
}

export async function rozpatrzZgloszenie(formData) {
  await wymagajRedakcji();
  const id = tekst(formData, "id", 80);
  const decyzja = tekst(formData, "decyzja", 20);
  if (!id || !["zatwierdz", "odrzuc"].includes(decyzja)) {
    wrocZBledem("/admin", "Nieprawidłowe zgłoszenie.");
  }

  const udzial = await db.udzialPlacowki.findUnique({
    where: { id },
    include: { placowka: { select: { id: true, nazwa: true } }, edycja: { select: { dataKoniec: true } } },
  });
  if (!udzial || udzial.status !== "ZGLOSZONA") {
    wrocZBledem("/admin", "Zgłoszenie zostało już rozpatrzone albo nie istnieje.");
  }

  const dostep = decyzja === "zatwierdz" ? nowyTokenPrzesylania() : null;
  try {
    await db.$transaction(async (tx) => {
      const wynik = await tx.udzialPlacowki.updateMany({
        where: { id, status: "ZGLOSZONA" },
        data: {
          status: decyzja === "odrzuc" ? "ODMOWILA" : "POTWIERDZILA",
          ...(dostep ? { tokenPrzesylaniaHash: dostep.hash, tokenPrzesylaniaWygasa: udzial.edycja.dataKoniec } : {}),
        },
      });
      if (wynik.count !== 1) throw new Error("ROZPATRZONE");

      if (decyzja === "zatwierdz") {
        await tx.placowka.update({
          where: { id: udzial.placowka.id },
          data: {
            osobaKontaktowa: udzial.zgloszonaOsoba,
            telefon: udzial.zgloszonyTelefon,
            email: udzial.zgloszonyEmail,
          },
        });
      }
    });
  } catch (e) {
    if (e?.message === "ROZPATRZONE") {
      wrocZBledem("/admin", "Zgłoszenie zostało właśnie rozpatrzone przez inną osobę.");
    }
    throw e;
  }

  if (dostep && udzial.zgloszonyEmail) {
    const baza = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.AUTH_URL || "https://portal.fundacjalepszydomlepszejutro.pl";
    await kolejkujEmail("LINK_PLACOWKI", {
      email: udzial.zgloszonyEmail,
      nazwa: udzial.placowka.nazwa,
      link: `${baza}/placowka/przeslij/${dostep.token}`,
    }, `link-placowki-${udzial.id}`).catch((blad) => console.error("[placowka] E-mail:", blad.message));
  }

  revalidatePath("/admin");
  redirect("/admin?sukces=zgloszenie");
}

export async function odnowLinkPlacowki(formData) {
  await wymagajRedakcji();
  const id = tekst(formData, "id", 80);
  const udzial = await db.udzialPlacowki.findFirst({
    where: { id, status: "POTWIERDZILA", edycja: { aktywna: true } },
    include: { placowka: { select: { nazwa: true } }, edycja: { select: { dataKoniec: true } } },
  });
  if (!udzial?.zgloszonyEmail) wrocZBledem("/admin", "Brak aktywnej placówki lub adresu e-mail.");
  const dostep = nowyTokenPrzesylania();
  await db.udzialPlacowki.update({
    where: { id },
    data: { tokenPrzesylaniaHash: dostep.hash, tokenPrzesylaniaWygasa: udzial.edycja.dataKoniec },
  });
  const baza = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.AUTH_URL || "https://portal.fundacjalepszydomlepszejutro.pl";
  try {
    const zakolejkowany = await kolejkujEmail("LINK_PLACOWKI", {
      email: udzial.zgloszonyEmail, nazwa: udzial.placowka.nazwa,
      link: `${baza}/placowka/przeslij/${dostep.token}`,
    }, `link-placowki-${udzial.id}-${Date.now()}`);
    if (!zakolejkowany) throw new Error("KOLEJKA_NIEDOSTEPNA");
  } catch {
    wrocZBledem("/admin", "Nie udało się zakolejkować wiadomości. Spróbuj ponownie.");
  }
  redirect("/admin?sukces=link-placowki");
}

export async function moderujSkan(formData) {
  await wymagajRedakcji();
  const id = tekst(formData, "id", 80);
  const decyzja = tekst(formData, "decyzja", 20);
  if (!id || !["odrzuc", "przywroc"].includes(decyzja)) wrocZBledem("/admin", "Nieprawidłowa decyzja dla skanu.");
  const wynik = await db.skanListu.updateMany({
    where: { id, list: null, status: decyzja === "odrzuc" ? { in: ["NOWY", "W_MODERACJI"] } : "ODRZUCONY" },
    data: { status: decyzja === "odrzuc" ? "ODRZUCONY" : "NOWY" },
  });
  if (wynik.count !== 1) wrocZBledem("/admin", "Skan został już przypięty do listu albo zmienił status.");
  revalidatePath("/admin");
  redirect("/admin?sukces=skan");
}

// Sygnatura (poprzedniStan, formData) — wymagana przez useActionState.
export async function utworzList(_poprzedni, formData) {
  const redaktor = await wymagajRedakcji("/admin/listy/nowy");
  const w = wartosciListu(formData);

  const mapa = sprawdzPolaListu(w);
  if (!w.udzialId) mapa.udzialId = "Wybierz placówkę.";
  if (Object.keys(mapa).length) return bledy(mapa, w);

  const udzial = await db.udzialPlacowki.findFirst({
    where: { id: w.udzialId, status: "POTWIERDZILA", edycja: { aktywna: true } },
    select: { placowkaId: true, edycjaId: true },
  });
  if (!udzial) {
    return bledy({ udzialId: "Ta placówka nie jest zatwierdzona w aktywnej edycji." }, w);
  }

  if (w.skanId) {
    const skan = await db.skanListu.findFirst({
      where: { id: w.skanId, udzialId: w.udzialId, status: { in: ["NOWY", "W_MODERACJI"] }, list: null },
      select: { id: true },
    });
    if (!skan) return bledy({ skanId: "Wybierz dostępny skan tej placówki." }, w);
  }

  const list = await db.list.create({
    data: {
      edycjaId: udzial.edycjaId,
      placowkaId: udzial.placowkaId,
      imie: w.imie,
      wiek: Number(w.wiek),
      wojewodztwo: w.wojewodztwo,
      kategoria: w.kategoria,
      marzenie: w.marzenie,
      rozmiar: w.rozmiar || null,
      opis: w.opis || null,
      zdjecieUrl: w.zdjecieUrl || null,
      skanId: w.skanId || null,
      status: "SZKIC",
      weryfikacja: { create: { osobaId: redaktor.id } },
    },
    select: { id: true },
  });

  if (w.skanId) await db.skanListu.update({ where: { id: w.skanId }, data: { status: "W_MODERACJI" } });

  revalidatePath("/admin");
  redirect("/admin/listy/" + list.id + "?sukces=utworzony");
}

export async function zapiszList(_poprzedni, formData) {
  const redaktor = await wymagajRedakcji();
  const id = tekst(formData, "id", 80);
  const operacja = tekst(formData, "operacja", 20) || "zapisz";
  const wersja = tekst(formData, "wersja", 40);

  const obecny = await db.list.findUnique({
    where: { id },
    select: {
      id: true, status: true, zgodaData: true, zgodaPrzyjalId: true,
      zgodaCofnieta: true, zaktualizowany: true, skanId: true,
    },
  });
  // Braki rekordu i konflikty wersji nadal przekierowuja: nie ma tu
  // czego odtwarzac, a uzytkownik musi zobaczyc aktualny stan.
  if (!obecny) wrocZBledem("/admin", "List nie istnieje.");
  if (wersja !== obecny.zaktualizowany.toISOString()) {
    wrocZBledem("/admin/listy/" + id, "List został zmieniony przez inną osobę. Odśwież stronę.");
  }

  const wRealizacji = ["ZAREZERWOWANY", "OPLACONY", "PRZEKAZANY"].includes(obecny.status);

  if (operacja === "wycofaj") {
    if (wRealizacji) {
      wrocZBledem("/admin/listy/" + id, "Nie można wycofać listu z aktywną realizacją.");
    }
    const wynik = await db.list.updateMany({
      where: { id, zaktualizowany: obecny.zaktualizowany },
      data: { status: "WYCOFANY" },
    });
    if (wynik.count !== 1) {
      wrocZBledem("/admin/listy/" + id, "List został zmieniony przez inną osobę. Odśwież stronę.");
    }
    revalidatePath("/listy");
    revalidatePath("/admin");
    redirect("/admin/listy/" + id + "?sukces=wycofany");
  }

  // Przywrocenie wycofanego listu.
  //
  // WYLACZNIE do szkicu i wylacznie z WYCOFANY. List nie wraca na strone
  // automatycznie: publikacja wymaga ponownego, swiadomego dzialania
  // z kompletem listy kontrolnej. Warunek na statusie jest w zapytaniu,
  // wiec dwie rownoczesne proby nie moga sie nalozyc.
  if (operacja === "przywroc") {
    if (obecny.status !== "WYCOFANY") {
      wrocZBledem("/admin/listy/" + id, "Przywrócić można wyłącznie list wycofany.");
    }
    const wynik = await db.list.updateMany({
      where: { id, status: "WYCOFANY", zaktualizowany: obecny.zaktualizowany },
      data: { status: "SZKIC" },
    });
    if (wynik.count !== 1) {
      wrocZBledem("/admin/listy/" + id, "List został zmieniony przez inną osobę. Odśwież stronę.");
    }
    revalidatePath("/admin");
    redirect("/admin/listy/" + id + "?sukces=przywrocony");
  }

  if (wRealizacji) {
    wrocZBledem("/admin/listy/" + id, "List w realizacji jest zablokowany do edycji.");
  }

  const w = wartosciListu(formData);
  const zgoda = formData.get("zgoda") === "on";
  const weryfikacja = Object.fromEntries(
    POLA_WERYFIKACJI.map((pole) => [pole, formData.get(pole) === "on"])
  );
  const kompletna = POLA_WERYFIKACJI.every((pole) => weryfikacja[pole]);
  const publikuj = operacja === "publikuj";

  const mapa = sprawdzPolaListu(w);
  if (publikuj && !zgoda) {
    mapa.zgoda = "Publikacja wymaga przyjętej zgody dyrektora.";
  }
  if (publikuj && !kompletna) {
    const brakuje = POLA_WERYFIKACJI.filter((pole) => !weryfikacja[pole]).length;
    mapa.weryfikacja = `Do publikacji brakuje jeszcze ${brakuje} z ${POLA_WERYFIKACJI.length} pozycji listy kontrolnej.`;
  }
  if (Object.keys(mapa).length) {
    return bledy(mapa, { ...w, zgoda, ...weryfikacja });
  }

  const teraz = new Date();
  try {
    await db.$transaction(async (tx) => {
      const wynik = await tx.list.updateMany({
        where: { id, zaktualizowany: obecny.zaktualizowany },
        data: {
          imie: w.imie,
          wiek: Number(w.wiek),
          wojewodztwo: w.wojewodztwo,
          kategoria: w.kategoria,
          marzenie: w.marzenie,
          rozmiar: w.rozmiar || null,
          opis: w.opis || null,
          zdjecieUrl: w.zdjecieUrl || null,
          // Historii zgody nie kasujemy po jej cofnieciu. Data przyjecia
          // zostaje, a osobne pole zapisuje wycofanie.
          zgodaData: zgoda ? (obecny.zgodaData || teraz) : obecny.zgodaData,
          zgodaPrzyjalId: zgoda ? (obecny.zgodaPrzyjalId || redaktor.id) : obecny.zgodaPrzyjalId,
          zgodaCofnieta: zgoda ? null : obecny.zgodaData ? (obecny.zgodaCofnieta || teraz) : null,
          status: publikuj ? "OPUBLIKOWANY" : "SZKIC",
        },
      });
      if (wynik.count !== 1) throw new Error("STARA_WERSJA");

      await tx.weryfikacja.upsert({
        where: { listId: id },
        update: { ...weryfikacja, osobaId: redaktor.id, zakonczona: kompletna ? teraz : null },
        create: { listId: id, osobaId: redaktor.id, ...weryfikacja, zakonczona: kompletna ? teraz : null },
      });
      if (publikuj && obecny.skanId) {
        await tx.skanListu.update({ where: { id: obecny.skanId }, data: { status: "ZATWIERDZONY" } });
      }
    });
  } catch (e) {
    if (e?.message === "STARA_WERSJA") {
      wrocZBledem("/admin/listy/" + id, "List został zmieniony przez inną osobę. Odśwież stronę.");
    }
    throw e;
  }

  revalidatePath("/");
  revalidatePath("/listy");
  revalidatePath("/listy/" + id);
  revalidatePath("/admin");
  revalidatePath("/admin/listy/" + id);
  redirect("/admin/listy/" + id + "?sukces=" + (publikuj ? "opublikowany" : "zapisany"));
}

export async function zwolnijRezerwacjeListu(formData) {
  await wymagajRedakcji();
  const id = tekst(formData, "id", 80);
  const list = await db.list.findUnique({
    where: { id }, select: { status: true, edycja: { select: { aktywna: true } } },
  });
  if (!list || list.status !== "ZAREZERWOWANY") {
    wrocZBledem("/admin/listy/" + id, "List nie ma aktywnej rezerwacji do zwolnienia.");
  }
  await db.$transaction(async (tx) => {
    await tx.rezerwacja.updateMany({
      where: { listId: id, status: { in: ["OCZEKUJE", "POTWIERDZONA"] } },
      data: { status: "ANULOWANA", anulowana: new Date() },
    });
    await tx.list.updateMany({
      where: { id, status: "ZAREZERWOWANY" },
      data: { status: list.edycja.aktywna ? "OPUBLIKOWANY" : "WYCOFANY" },
    });
  });
  await usunCache(KLUCZ_LICZNIKA);
  revalidatePath("/");
  revalidatePath("/listy");
  revalidatePath("/admin");
  redirect("/admin/listy/" + id + "?sukces=zwolniony");
}

export async function aktualizujPrezent(formData) {
  const redaktor = await wymagajRedakcji();
  const id = tekst(formData, "id", 80);
  const operacja = tekst(formData, "operacja", 20);
  if (!id || !["przyjmij", "sprawdz", "zapakuj", "wydaj"].includes(operacja)) {
    wrocZBledem("/admin", "Nieprawidłowa operacja na prezencie.");
  }

  const list = await db.list.findUnique({
    where: { id },
    select: {
      status: true,
      rezerwacje: {
        where: { status: { in: ["POTWIERDZONA", "DOSTARCZONA"] } },
        orderBy: { utworzona: "desc" },
        take: 1,
        select: { id: true, status: true, prezent: { select: { id: true, stan: true } } },
      },
    },
  });
  const rezerwacja = list?.rezerwacje?.[0];
  if (!list || !rezerwacja) {
    wrocZBledem("/admin/listy/" + id, "Brak potwierdzonej rezerwacji dla tego listu.");
  }

  try {
    if (operacja === "przyjmij") {
      await db.$transaction(async (tx) => {
        const r = await tx.rezerwacja.updateMany({
          where: { id: rezerwacja.id, status: "POTWIERDZONA" },
          data: { status: "DOSTARCZONA" },
        });
        const l = await tx.list.updateMany({
          where: { id, status: "ZAREZERWOWANY" },
          data: { status: "OPLACONY" },
        });
        if (r.count !== 1 || l.count !== 1) throw new Error("ZMIENIONY_STAN");
        await tx.prezent.upsert({
          where: { rezerwacjaId: rezerwacja.id },
          update: { stan: "PRZYJETY", dataPrzyjecia: new Date(), przyjetyPrzez: redaktor.id },
          create: {
            rezerwacjaId: rezerwacja.id,
            stan: "PRZYJETY",
            dataPrzyjecia: new Date(),
            przyjetyPrzez: redaktor.id,
          },
        });
      });
    } else if (operacja === "sprawdz") {
      const wynik = await db.prezent.updateMany({
        where: { rezerwacjaId: rezerwacja.id, stan: "PRZYJETY" },
        data: { stan: "SPRAWDZONY" },
      });
      if (wynik.count !== 1) throw new Error("ZMIENIONY_STAN");
    } else if (operacja === "zapakuj") {
      const wynik = await db.prezent.updateMany({
        where: { rezerwacjaId: rezerwacja.id, stan: "SPRAWDZONY" },
        data: { stan: "ZAPAKOWANY" },
      });
      if (wynik.count !== 1) throw new Error("ZMIENIONY_STAN");
    } else {
      await db.$transaction(async (tx) => {
        const p = await tx.prezent.updateMany({
          where: { rezerwacjaId: rezerwacja.id, stan: "ZAPAKOWANY" },
          data: { stan: "WYDANY" },
        });
        const l = await tx.list.updateMany({
          where: { id, status: "OPLACONY" },
          data: { status: "PRZEKAZANY" },
        });
        if (p.count !== 1 || l.count !== 1) throw new Error("ZMIENIONY_STAN");
      });
    }
  } catch (e) {
    if (e?.message === "ZMIENIONY_STAN") {
      wrocZBledem("/admin/listy/" + id, "Stan został zmieniony przez inną osobę. Odśwież stronę.");
    }
    throw e;
  }

  revalidatePath("/");
  revalidatePath("/listy");
  revalidatePath("/listy/" + id);
  revalidatePath("/moje-rezerwacje");
  revalidatePath("/admin");
  revalidatePath("/admin/listy/" + id);
  if (operacja === "wydaj") {
    await kolejkujEmail("PODZIEKOWANIE", { rezerwacjaId: rezerwacja.id }, `podziekowanie-${rezerwacja.id}`)
      .catch((blad) => console.error("[prezent] E-mail:", blad.message));
  }
  redirect("/admin/listy/" + id + "?sukces=prezent");
}
