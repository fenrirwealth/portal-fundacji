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
    return Response.json({ blad: "Zaloguj się." }, { status: 401 });
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
    return Response.json({ blad: "Rezerwację potwierdza Fundacja po rozmowie telefonicznej. Zadzwoń pod +48 570 747 779." }, { status: 403 });
  }

  if (akcja === "anuluj") {
    // Anulowac mozna wylacznie rezerwacje aktywna. Rezerwacji juz
    // rozliczonej (DOSTARCZONA) ani wygaslej nie ruszamy.
    const anulowano = await db.$transaction(async (tx) => {
      const wynik = await tx.rezerwacja.updateMany({
        where: {
          id: rezerwacja.id,
          userId: sesja.user.id,
          status: { in: ["OCZEKUJE", "POTWIERDZONA"] },
        },
        data: { status: "ANULOWANA", anulowana: new Date() },
      });
      if (wynik.count !== 1) return false;

      await tx.list.updateMany({
        where: { id: rezerwacja.listId, status: "ZAREZERWOWANY" },
        data: { status: "OPUBLIKOWANY" },
      });
      return true;
    });

    if (!anulowano) {
      return Response.json(
        { blad: "Tej rezerwacji nie można już anulować." },
        { status: 409 }
      );
    }

    await usunCache(KLUCZ_LICZNIKA);

    return Response.json({ ok: true });
  }

  return Response.json({ blad: "Nieznana operacja." }, { status: 400 });
}
