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
