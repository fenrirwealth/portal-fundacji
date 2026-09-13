import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// ------------------------------------------------------------
//  Zapytania publiczne
//
//  Dwie zasady, obie wymuszone tutaj, nie w widokach:
//
//  1. Zwracamy WYLACZNIE pola jawne. Powiazanie z placowka, skan zgody
//     i notatki wewnetrzne nigdy nie opuszczaja serwera.
//
//  2. Bialą lista statusow, nie czarna. Wczesniej bylo
//     "status: { not: SZKIC }", co przepuszczalo WYCOFANY i DO_POPRAWY —
//     czyli list wycofany przez placowke nadal otwieral sie pod znanym
//     adresem. Przy danych dzieci to niedopuszczalne. Od teraz wszystko
//     spoza listy ponizej daje 404.
// ------------------------------------------------------------

export const STATUSY_JAWNE = [
  "OPUBLIKOWANY",
  "ZAREZERWOWANY",
  "OPLACONY",
  "PRZEKAZANY",
];

const POLA_PUBLICZNE = {
  id: true, numer: true, imie: true, wiek: true, wojewodztwo: true,
  kategoria: true, marzenie: true, rozmiar: true, skanUrl: true,
  trescOdczytana: true, status: true,
};

export async function listyPubliczne({ kategoria, wiekOd, wiekDo, tylkoWolne } = {}) {
  return db.list.findMany({
    where: {
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
  return db.list.findFirst({
    where: { id, status: { in: STATUSY_JAWNE } },
    select: POLA_PUBLICZNE,
  });
}

export async function licznik() {
  const [wszystkie, wolne] = await Promise.all([
    db.list.count({ where: { status: { in: STATUSY_JAWNE } } }),
    db.list.count({ where: { status: "OPUBLIKOWANY" } }),
  ]);
  return { wszystkie, wolne };
}
