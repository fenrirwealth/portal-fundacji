import { PrismaClient } from "@prisma/client";
import { KLUCZ_LICZNIKA, pobierzCacheJson, zapiszCacheJson } from "./cache";

const globalForPrisma = globalThis;

export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// ------------------------------------------------------------
//  Zapytania publiczne
//
//  Trzy zasady, wszystkie wymuszone tutaj, nie w widokach:
//
//  1. Zwracamy WYLACZNIE pola jawne. Powiazanie z placowka, data
//     zgody i notatki wewnetrzne nie opuszczaja serwera.
//
//  2. Biala lista statusow, nie czarna. Wczesniej bylo
//     "status: { not: SZKIC }", co przepuszczalo WYCOFANY i DO_POPRAWY
//     — list wycofany przez placowke nadal otwieral sie pod znanym
//     adresem.
//
//  3. Wylacznie aktywna edycja. Bez tego listy z poprzednich lat
//     wrocilyby do puli razem z mozliwoscia rezerwacji.
// ------------------------------------------------------------

// ------------------------------------------------------------
//  WARUNKI PUBLIKACJI
//
//  List moze byc widoczny publicznie i rezerwowalny WYLACZNIE gdy:
//   - zgoda dyrektora wplynela (zgodaData) i nie zostala cofnieta,
//   - karta weryfikacji jest zakonczona.
//
//  Te warunki sa w zapytaniu, nie w panelu administratora. Panel
//  dopiero powstanie, a nawet gdy powstanie — pomylka jednej osoby
//  nie moze wystawic danych dziecka. Statusu nie da sie przestawic
//  na OPUBLIKOWANY "przez przypadek" tak, zeby to wystarczylo.
// ------------------------------------------------------------
export const WARUNKI_PUBLIKACJI = {
  zgodaData: { not: null },
  zgodaCofnieta: null,
  weryfikacja: {
    is: {
      zakonczona: { not: null },
      // Sama data zakonczenia nie wystarcza. Karte mozna zamknac
      // z niezaznaczonymi pozycjami — wtedy "zweryfikowany" znaczy
      // tylko tyle, ze ktos kliknal przycisk. Wymagamy KOMPLETU flag,
      // bo kazda z nich odpowiada innemu sposobowi ujawnienia dziecka.
      zgodaDolaczona: true,
      brakNazwiska: true,
      brakPlacowki: true,
      brakMiejscowosci: true,
      brakInnychOsob: true,
      brakDanychWrazliwych: true,
      brakWizerunku: true,
      metadaneUsuniete: true,
      nazwaPlikuPoprawna: true,
      opisPoprawny: true,
    },
  },
};

export const STATUSY_JAWNE = [
  "OPUBLIKOWANY",
  "ZAREZERWOWANY",
  "OPLACONY",
  "PRZEKAZANY",
];

const POLA_PUBLICZNE = {
  id: true,
  numer: true,
  imie: true,
  wiek: true,
  wojewodztwo: true,
  kategoria: true,
  marzenie: true,
  rozmiar: true,
  opis: true,
  zdjecieUrl: true,
  status: true,
};

export async function aktywnaEdycja() {
  return db.edycjaAkcji.findFirst({ where: { aktywna: true } });
}

// Termin dostarczenia prezentu nalezy do edycji, nie do kodu.
// Wpisany na sztywno rozjechalby sie w kolejnym roku i trzeba by
// go scigac po wszystkich widokach.
// Wersja regulaminu akcji. Zmiana tresci = zmiana tej stalej, dzieki
// czemu widac, kto na co sie zgodzil, i mozna poprosic o ponowna zgode.
export const WERSJA_REGULAMINU = "2026-11-01";

// Sciezka powrotu przychodzi z adresu, wiec jest danymi od uzytkownika.
// Bez tego filtra "/zaloguj?wroc=https://zly.przyklad" przekierowalby
// po zalogowaniu na obca strone — klasyczne otwarte przekierowanie,
// wygodne do wyludzania danych, bo link zaczyna sie od naszej domeny.
//
// Przepuszczamy wylacznie sciezki lokalne. Odrzucamy adresy pelne,
// protokolo-wzgledne ("//obca.strona") i odwrotne ukosniki, ktore
// czesc przegladarek traktuje jak ukosniki zwykle.
export function bezpiecznaSciezka(wartosc, domyslna = "/listy") {
  const w = typeof wartosc === "string" ? wartosc.trim() : "";
  if (!w.startsWith("/")) return domyslna;
  if (w.startsWith("//")) return domyslna;
  if (w.includes("\\")) return domyslna;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(w)) return domyslna;
  return w;
}

export function formatujTermin(data) {
  if (!data) return null;
  return new Date(data).toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

/**
 * @param {{kategoria?: string, wiekOd?: number, wiekDo?: number, tylkoWolne?: boolean}} [filtry]
 */
export async function listyPubliczne({ kategoria, wiekOd, wiekDo, tylkoWolne } = {}) {
  const edycja = await aktywnaEdycja();
  if (!edycja) return [];

  return db.list.findMany({
    where: {
      edycjaId: edycja.id,
      ...WARUNKI_PUBLIKACJI,
      status: tylkoWolne ? "OPUBLIKOWANY" : { in: STATUSY_JAWNE },
      ...(kategoria ? { kategoria } : {}),
      ...(wiekOd || wiekDo
        ? { wiek: { ...(wiekOd ? { gte: wiekOd } : {}), ...(wiekDo ? { lte: wiekDo } : {}) } }
        : {}),
    },
    select: POLA_PUBLICZNE,
    orderBy: [{ status: "asc" }, { numer: "asc" }],
  });
}

export async function listPubliczny(id) {
  const edycja = await aktywnaEdycja();
  if (!edycja) return null;

  return db.list.findFirst({
    where: { id, edycjaId: edycja.id, ...WARUNKI_PUBLIKACJI, status: { in: STATUSY_JAWNE } },
    select: POLA_PUBLICZNE,
  });
}

export async function licznik() {
  const zapisany = await pobierzCacheJson(KLUCZ_LICZNIKA);
  if (zapisany) return zapisany;

  const edycja = await aktywnaEdycja();
  if (!edycja) return { wszystkie: 0, wolne: 0, majaMikolaja: 0, procent: 0 };

  const [wszystkie, wolne] = await Promise.all([
    db.list.count({ where: { edycjaId: edycja.id, ...WARUNKI_PUBLIKACJI, status: { in: STATUSY_JAWNE } } }),
    db.list.count({ where: { edycjaId: edycja.id, ...WARUNKI_PUBLIKACJI, status: "OPUBLIKOWANY" } }),
  ]);
  const majaMikolaja = Math.max(wszystkie - wolne, 0);
  const dane = {
    wszystkie,
    wolne,
    majaMikolaja,
    procent: wszystkie ? Math.round((majaMikolaja / wszystkie) * 100) : 0,
  };
  await zapiszCacheJson(KLUCZ_LICZNIKA, dane, 15);
  return dane;
}
