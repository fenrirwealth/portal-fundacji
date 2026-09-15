import { auth } from "../../../../auth";
import { db } from "../../../../lib/db";
import { jsonZLimitem, odpowiedzBleduHttp } from "../../../../lib/http.mjs";
import { KLUCZ_LICZNIKA, usunCache } from "../../../../lib/cache";

// Potwierdzenie i rezygnacja. Obie operacje sprawdzaja wlasciciela —
// bez tego znajomosc identyfikatora pozwalalaby ruszyc cudza rezerwacje.
//
// Obie sa tez warunkowe na statusie, zeby nie dalo sie cofnac rezerwacji
// juz rozliczonej ani potwierdzic takiej, ktora wlasnie wygasla.
export async function PATCH(request, { params }) {
  const sesja = await auth();
  if (!sesja?.user?.id) {
    return Response.json({ blad: "Zaloguj sie." }, { status: 401 });
  }

  const { id } = await params;
  let dane;
  try {
    dane = await jsonZLimitem(request, 2 * 1024);
  } catch (e) {
    const odpowiedz = odpowiedzBleduHttp(e);
    if (odpowiedz) return odpowiedz;
    throw e;
  }
  const { akcja } = dane;

  const rezerwacja = await db.rezerwacja.findFirst({
    where: { id, userId: sesja.user.id },
    select: { id: true, status: true, listId: true },
  });
  if (!rezerwacja) {
    return Response.json({ blad: "Nie znaleziono rezerwacji." }, { status: 404 });
  }

  if (akcja === "potwierdz") {
    // Warunek na terminie jest w zapytaniu, nie w kodzie nad nim.
    // Inaczej rezerwacja wygasla o sekunde wczesniej dalaby sie
    // potwierdzic, a list zostalby zajety mimo zwolnienia.
    const wynik = await db.rezerwacja.updateMany({
      where: {
        id: rezerwacja.id,
        userId: sesja.user.id,
        status: "OCZEKUJE",
        wygasa: { gt: new Date() },
      },
      data: { status: "POTWIERDZONA", potwierdzona: new Date() },
    });

    if (wynik.count === 0) {
      return Response.json(
        { blad: "Tej rezerwacji nie mozna juz potwierdzic — termin minal albo zostala zmieniona." },
        { status: 409 }
      );
    }
    return Response.json({ ok: true });
  }

  if (akcja === "anuluj") {
    // Anulowac mozna wylacznie rezerwacje aktywna. Rezerwacji juz
    // rozliczonej (DOSTARCZONA) ani wygaslej nie ruszamy.
    const wynik = await db.rezerwacja.updateMany({
      where: {
        id: rezerwacja.id,
        userId: sesja.user.id,
        status: { in: ["OCZEKUJE", "POTWIERDZONA"] },
      },
      data: { status: "ANULOWANA", anulowana: new Date() },
    });

    if (wynik.count === 0) {
      return Response.json(
        { blad: "Tej rezerwacji nie mozna juz anulowac." },
        { status: 409 }
      );
    }

    // List zwalniamy tylko jesli nadal jest zarezerwowany. Gdy
    // administrator zdazyl zmienic status, nie nadpisujemy go.
    await db.list.updateMany({
      where: { id: rezerwacja.listId, status: "ZAREZERWOWANY" },
      data: { status: "OPUBLIKOWANY" },
    });
    await usunCache(KLUCZ_LICZNIKA);

    return Response.json({ ok: true });
  }

  return Response.json({ blad: "Nieznana operacja." }, { status: 400 });
}
