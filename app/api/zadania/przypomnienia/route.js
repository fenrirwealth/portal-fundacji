import { db } from "../../../../lib/db";
import { poprawnyTokenCron } from "../../../../lib/cron.mjs";
import { kolejkujEmail, kolejkujPowiadomienieRezerwacji } from "../../../../lib/kolejka-email";
import { zwolnijWygasle } from "../../rezerwacja/route";
import { usunPrywatnySkan } from "../../../../lib/skany";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Zadanie wywoluje harmonogram Coolify. Nie udostepniamy wariantu GET,
// aby robot, podglad linku ani przypadkowe wejscie nie wysylaly poczty.
export async function POST(request) {
  if (!poprawnyTokenCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ blad: "Brak dostepu." }, { status: 401 });
  }

  const wygasle = await zwolnijWygasle();
  const teraz = new Date();
  const godzina = 60 * 60 * 1000;
  const zaTrzyGodziny = new Date(teraz.getTime() + 3 * godzina);
  const zaDobe = new Date(teraz.getTime() + 24 * godzina);
  const zaDwieDoby = new Date(teraz.getTime() + 48 * godzina);

  // Jeśli kontrola ruszy dopiero w ostatnich trzech godzinach, darczyńca
  // bez telefonu dostanie tylko ostatnie przypomnienie.
  const przypomnienia = [
    {
      pole: "przypomnienieWyslane",
      prefiks: "przypomnienie",
      ostatnie: false,
      warunki: {
        wygasa: { gt: teraz, lte: zaDobe },
        OR: [{ telefonKontaktowy: { not: null } }, { wygasa: { gt: zaTrzyGodziny } }],
      },
    },
    {
      pole: "przypomnienieKoncoweWyslane",
      prefiks: "przypomnienie-koncowe",
      ostatnie: true,
      warunki: { telefonKontaktowy: null, wygasa: { gt: teraz, lte: zaTrzyGodziny } },
    },
  ];

  const [pierwsze, koncowe, dostarczenia] = await Promise.all([
    ...przypomnienia.map(({ pole, warunki }) => db.rezerwacja.findMany({
      where: { status: "OCZEKUJE", [pole]: null, ...warunki },
      select: { id: true },
      orderBy: { wygasa: "asc" },
      take: 100,
    })),
    db.rezerwacja.findMany({
      where: {
        status: "POTWIERDZONA", przypomnienieDostarczeniaWyslane: null,
        list: { edycja: { aktywna: true, terminDostarczenia: { gt: teraz, lte: zaDwieDoby } } },
      },
      select: { id: true }, orderBy: { utworzona: "asc" }, take: 300,
    }),
  ]);

  let zakolejkowane = 0;
  let bledy = 0;

  for (const [i, kandydaci] of [pierwsze, koncowe].entries()) {
    const { pole, prefiks, ostatnie, warunki } = przypomnienia[i];
    for (const { id } of kandydaci) {
      // Każdy etap ma osobny znacznik i identyfikator zadania. Warunkowy
      // zapis zapobiega powtórzeniu, gdy harmonogram uruchomi się równolegle.
      const znacznik = new Date();
      const zajeta = await db.rezerwacja.updateMany({
        where: {
          id, status: "OCZEKUJE", [pole]: null, ...warunki,
          wygasa: { ...warunki.wygasa, gt: znacznik },
        },
        data: { [pole]: znacznik },
      });
      if (zajeta.count !== 1) continue;

      try {
        const dodano = await kolejkujEmail("PRZYPOMNIENIE", { rezerwacjaId: id, ostatnie }, `${prefiks}-${id}`);
        if (!dodano) throw new Error("KOLEJKA_NIEDOSTEPNA");
        zakolejkowane += 1;
      } catch {
        bledy += 1;
        await db.rezerwacja.updateMany({
          where: { id, [pole]: znacznik },
          data: { [pole]: null },
        });
      }
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

  const [noweRezerwacje, nowePotwierdzenia] = await Promise.all([
    db.rezerwacja.findMany({
      where: { status: { in: ["OCZEKUJE", "POTWIERDZONA"] }, emailRezerwacjiZakolejkowany: null, list: { edycja: { aktywna: true } } },
      select: { id: true },
      take: 100,
    }),
    db.rezerwacja.findMany({
      where: { status: "POTWIERDZONA", kontaktTelefoniczny: { not: null }, emailPotwierdzeniaZakolejkowany: null, list: { edycja: { aktywna: true } } },
      select: { id: true },
      take: 100,
    }),
  ]);
  for (const [typ, rezerwacje] of [
    ["REZERWACJA", noweRezerwacje],
    ["KONTAKT_POTWIERDZONY", nowePotwierdzenia],
  ]) {
    for (const { id } of rezerwacje) {
      try {
        await kolejkujPowiadomienieRezerwacji(db, typ, id);
        zakolejkowane += 1;
      } catch {
        bledy += 1;
      }
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
    { wygasle, sprawdzone: pierwsze.length + koncowe.length + dostarczenia.length, zakolejkowane, bledy, usunieteSkany: stareSkany.length },
    { status: bledy > 0 ? 502 : 200 }
  );
}
