import { db } from "../../../../lib/db";
import { poprawnyTokenCron } from "../../../../lib/cron.mjs";
import { kolejkujEmail } from "../../../../lib/kolejka-email";
import { usunPrywatnySkan } from "../../../../lib/skany";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Zadanie wywoluje harmonogram Coolify. Nie udostepniamy wariantu GET,
// aby robot, podglad linku ani przypadkowe wejscie nie wysylaly poczty.
export async function POST(request) {
  if (!poprawnyTokenCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ blad: "Brak dostepu." }, { status: 401 });
  }

  const teraz = new Date();
  const zaDobe = new Date(teraz.getTime() + 24 * 60 * 60 * 1000);
  const zaDwieDoby = new Date(teraz.getTime() + 2 * 24 * 60 * 60 * 1000);
  const [kandydaci, dostarczenia] = await Promise.all([db.rezerwacja.findMany({
    where: {
      status: "OCZEKUJE",
      przypomnienieWyslane: null,
      wygasa: { gt: teraz, lte: zaDobe },
    },
    select: {
      id: true,
      wygasa: true,
      user: { select: { email: true } },
      list: { select: { id: true, imie: true, numer: true } },
    },
    orderBy: { wygasa: "asc" },
    take: 100,
  }), db.rezerwacja.findMany({
    where: {
      status: "POTWIERDZONA", przypomnienieDostarczeniaWyslane: null,
      list: { edycja: { aktywna: true, terminDostarczenia: { gt: teraz, lte: zaDwieDoby } } },
    },
    select: { id: true }, orderBy: { utworzona: "asc" }, take: 300,
  })]);

  let zakolejkowane = 0;
  let bledy = 0;

  for (const rezerwacja of kandydaci) {
    // Atomowe zajecie rekordu chroni przed podwojnym mailem, gdy dwa
    // wywolania harmonogramu na siebie nachodza. Przy bledzie wysylki
    // cofamy znacznik, aby nastepna proba mogla ponowic wiadomosc.
    const znacznik = new Date();
    const zajeta = await db.rezerwacja.updateMany({
      where: {
        id: rezerwacja.id,
        status: "OCZEKUJE",
        przypomnienieWyslane: null,
        wygasa: { gt: new Date() },
      },
      data: { przypomnienieWyslane: znacznik },
    });
    if (zajeta.count !== 1) continue;

    try {
      if (!(await kolejkujEmail("PRZYPOMNIENIE", { rezerwacjaId: rezerwacja.id }, `przypomnienie-${rezerwacja.id}`))) throw new Error("KOLEJKA_NIEDOSTEPNA");
      zakolejkowane += 1;
    } catch {
      bledy += 1;
      await db.rezerwacja.updateMany({
        where: { id: rezerwacja.id, przypomnienieWyslane: znacznik },
        data: { przypomnienieWyslane: null },
      });
    }
  }

  for (const rezerwacja of dostarczenia) {
    const znacznik = new Date();
    const zajeta = await db.rezerwacja.updateMany({
      where: { id: rezerwacja.id, status: "POTWIERDZONA", przypomnienieDostarczeniaWyslane: null },
      data: { przypomnienieDostarczeniaWyslane: znacznik },
    });
    if (zajeta.count !== 1) continue;
    try {
      if (!(await kolejkujEmail("PRZYPOMNIENIE_DOSTARCZENIA", { rezerwacjaId: rezerwacja.id }, `dostarczenie-${rezerwacja.id}`))) throw new Error("KOLEJKA_NIEDOSTEPNA");
      zakolejkowane += 1;
    } catch {
      bledy += 1;
      await db.rezerwacja.updateMany({
        where: { id: rezerwacja.id, przypomnienieDostarczeniaWyslane: znacznik },
        data: { przypomnienieDostarczeniaWyslane: null },
      });
    }
  }

  // Minimalizacja danych: odrzucone, niepowiązane skany usuwamy po 90 dniach.
  // Każdy rekord wskazuje wyłącznie losową nazwę w prywatnym katalogu.
  const granicaRetencji = new Date(teraz.getTime() - 90 * 24 * 60 * 60 * 1000);
  const stareSkany = await db.skanListu.findMany({
    where: { status: "ODRZUCONY", list: null, zaktualizowany: { lt: granicaRetencji } },
    select: { id: true, plik: true }, take: 100,
  });
  for (const skan of stareSkany) {
    const usuniety = await db.skanListu.deleteMany({ where: { id: skan.id, status: "ODRZUCONY", list: null } });
    if (usuniety.count === 1) await usunPrywatnySkan(skan.plik);
  }

  await db.udzialPlacowki.updateMany({
    where: { tokenPrzesylaniaWygasa: { lt: teraz }, tokenPrzesylaniaHash: { not: null } },
    data: { tokenPrzesylaniaHash: null, tokenPrzesylaniaWygasa: null },
  });

  return Response.json(
    { sprawdzone: kandydaci.length + dostarczenia.length, zakolejkowane, bledy, usunieteSkany: stareSkany.length },
    { status: bledy > 0 ? 502 : 200 }
  );
}
