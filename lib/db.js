import { PrismaClient } from "@prisma/client";

// W trybie deweloperskim Next.js przeladowuje moduly przy kazdej zmianie.
// Bez tego powstawaloby kilkanascie polaczen do bazy naraz.
const globalForPrisma = globalThis;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// ------------------------------------------------------------
//  Zapytania publiczne — zwracaja WYLACZNIE pola jawne.
//  Powiazanie z placowka i skan zgody nigdy nie opuszczaja serwera.
// ------------------------------------------------------------

const POLA_PUBLICZNE = {
  id: true, numer: true, imie: true, wiek: true, wojewodztwo: true,
  kategoria: true, marzenie: true, rozmiar: true, skanUrl: true,
  trescOdczytana: true, status: true,
};

export async function listyPubliczne({ kategoria, wiekOd, wiekDo, tylkoWolne } = {}) {
  return db.list.findMany({
    where: {
      status: tylkoWolne
        ? "OPUBLIKOWANY"
        : { in: ["OPUBLIKOWANY", "ZAREZERWOWANY", "OPLACONY", "PRZEKAZANY"] },
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
    where: { id, status: { not: "SZKIC" } },
    select: POLA_PUBLICZNE,
  });
}

export async function licznik() {
  const [wszystkie, wolne] = await Promise.all([
    db.list.count({ where: { status: { not: "SZKIC" } } }),
    db.list.count({ where: { status: "OPUBLIKOWANY" } }),
  ]);
  return { wszystkie, wolne };
}
