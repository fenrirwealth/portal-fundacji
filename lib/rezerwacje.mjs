import { LIMIT_AKTYWNYCH_LISTOW } from './zasady-akcji.mjs';

export async function wolneMiejsceNaKoncie(tx, userId) {
  // Blokada konta serializuje równoczesne rezerwacje różnych listów tej osoby.
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
  const aktywne = await tx.rezerwacja.findMany({
    where: { userId, status: { in: ['OCZEKUJE', 'POTWIERDZONA'] } },
    select: { miejsceNaKoncie: true },
  });
  const zajete = new Set(aktywne.map((r) => r.miejsceNaKoncie));
  for (let miejsce = 1; miejsce <= LIMIT_AKTYWNYCH_LISTOW; miejsce++) {
    if (!zajete.has(miejsce)) return miejsce;
  }
  throw new Error('LIMIT_REZERWACJI');
}

// Operacje są warunkowe na tym samym statusie i terminie. Potwierdzenie
// rozmowy oraz wygaśnięcie nie mogą jednocześnie wygrać dla jednej rezerwacji.
export async function wygasRezerwacje(db, teraz = new Date()) {
  const kandydaci = await db.rezerwacja.findMany({
    where: { status: 'OCZEKUJE', wygasa: { lte: teraz } },
    select: { id: true, listId: true },
  });
  const zwolnione = [];
  for (const r of kandydaci) {
    const zmieniona = await db.$transaction(async (tx) => {
      const wynik = await tx.rezerwacja.updateMany({
        where: { id: r.id, status: 'OCZEKUJE', wygasa: { lte: teraz } },
        data: { status: 'WYGASLA' },
      });
      if (wynik.count !== 1) return false;
      await tx.list.updateMany({
        where: { id: r.listId, status: 'ZAREZERWOWANY' },
        data: { status: 'OPUBLIKOWANY' },
      });
      return true;
    });
    if (zmieniona) zwolnione.push(r.id);
  }
  return zwolnione;
}

export async function potwierdzRozmowe(db, id, administratorId, teraz = new Date()) {
  return db.rezerwacja.updateMany({
    where: {
      id, status: 'OCZEKUJE', wygasa: { gt: teraz },
      list: { status: 'ZAREZERWOWANY', edycja: { aktywna: true } },
    },
    data: { status: 'POTWIERDZONA', potwierdzona: teraz, kontaktTelefoniczny: teraz, kontaktPotwierdzilId: administratorId },
  });
}
