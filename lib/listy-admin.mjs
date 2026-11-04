// Warunki na wersji i statusie chronią rezerwację darczyńcy przed
// równoczesnym kliknięciem administratora na nieaktualnym ekranie.
export async function rezerwujRecznie(db, { id, wersja, administratorId, notatka, warunkiPublikacji }, teraz = new Date()) {
  return db.list.updateMany({
    where: { id, zaktualizowany: wersja, status: 'OPUBLIKOWANY', edycja: { aktywna: true }, ...warunkiPublikacji },
    data: { status: 'ZAREZERWOWANY', rezerwacjaReczna: teraz, rezerwacjaRecznaPrzezId: administratorId, rezerwacjaRecznaNotatka: notatka || null },
  });
}

export async function archiwizujList(db, { id, wersja }) {
  return db.list.updateMany({
    where: { id, zaktualizowany: wersja, status: { in: ['SZKIC', 'DO_POPRAWY', 'OPUBLIKOWANY'] } },
    data: { status: 'WYCOFANY' },
  });
}
