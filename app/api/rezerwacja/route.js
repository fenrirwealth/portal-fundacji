import { db } from "../../../lib/db";

const DNI_NA_POTWIERDZENIE = 3;

// Glowna tarcza przed blokowaniem listow: jedno konto trzyma jeden list.
// Troll chcacy sparalizowac akcje musialby zalozyc tyle kont, ile jest
// listow — to przestaje byc zart, a staje sie praca.
const LIMIT = Number(process.env.LIMIT_LISTOW_NA_KONTO || 1);

// Przelacznik awaryjny. Domyslnie wylaczony: SMS-y kosztuja, wymagaja
// zbierania numerow telefonu i odcinaja czesc darczyncow.
const WYMAGAJ_SMS = process.env.WERYFIKACJA_SMS === "on";

// UWAGA: przy 3 dniach przypomnienie jest obowiazkowe, nie opcjonalne.
// Rezerwacja zlozona w piatek wieczorem wygasa w poniedzialek rano,
// zanim darczynca zdazy otworzyc poczte.
export async function zwolnijWygasle() {
  const wygasle = await db.rezerwacja.findMany({
    where: { status: "OCZEKUJE", wygasa: { lt: new Date() } },
    select: { id: true, listId: true },
  });
  if (!wygasle.length) return 0;

  await db.$transaction([
    db.rezerwacja.updateMany({
      where: { id: { in: wygasle.map((r) => r.id) } },
      data: { status: "WYGASLA" },
    }),
    db.list.updateMany({
      where: { id: { in: wygasle.map((r) => r.listId) }, status: "ZAREZERWOWANY" },
      data: { status: "OPUBLIKOWANY" },
    }),
  ]);
  return wygasle.length;
}

export async function POST(request) {
  const { listId, uzytkownikId } = await request.json();
  if (!listId || !uzytkownikId) {
    return Response.json({ blad: "Brak wymaganych danych." }, { status: 401 });
  }

  await zwolnijWygasle();

  const uzytkownik = await db.uzytkownik.findUnique({
    where: { id: uzytkownikId },
    select: { id: true, telefonPotwierdzony: true },
  });
  if (!uzytkownik) {
    return Response.json({ blad: "Nie znaleziono konta." }, { status: 401 });
  }

  if (WYMAGAJ_SMS && !uzytkownik.telefonPotwierdzony) {
    return Response.json(
      { blad: "Potwierdz numer telefonu, zanim zarezerwujesz list.", wymagaSms: true },
      { status: 403 }
    );
  }

  const aktywne = await db.rezerwacja.count({
    where: { uzytkownikId, status: { in: ["OCZEKUJE", "POTWIERDZONA"] } },
  });
  if (aktywne >= LIMIT) {
    return Response.json(
      {
        blad:
          LIMIT === 1
            ? "Masz juz zarezerwowany jeden list. Dokoncz go albo zrezygnuj, zanim wybierzesz kolejny."
            : "Mozesz trzymac najwyzej " + LIMIT + " listow naraz.",
      },
      { status: 429 }
    );
  }

  const wygasa = new Date();
  wygasa.setDate(wygasa.getDate() + DNI_NA_POTWIERDZENIE);

  try {
    // Zajecie listu warunkiem na statusie zamiast blokady jawnej.
    // Gdy zmieniony wiersz to zero, ktos byl pierwszy. Nie trzymamy
    // blokady wiersza przez czas transakcji, wiec przy popularnym liscie
    // nie tworzy sie kolejka oczekujacych.
    const rezerwacja = await db.$transaction(async (tx) => {
      const zajety = await tx.list.updateMany({
        where: { id: listId, status: "OPUBLIKOWANY" },
        data: { status: "ZAREZERWOWANY" },
      });
      if (zajety.count === 0) throw new Error("ZAJETY");

      return tx.rezerwacja.create({
        data: { listId, uzytkownikId, wygasa, status: "OCZEKUJE" },
      });
    });

    return Response.json({ ok: true, rezerwacjaId: rezerwacja.id, wygasa });
  } catch (e) {
    if (e.message === "ZAJETY") {
      return Response.json(
        { blad: "Ten list zostal wlasnie zarezerwowany przez kogos innego." },
        { status: 409 }
      );
    }
    throw e;
  }
}
