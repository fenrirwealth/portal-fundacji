import { db } from "../../../../lib/db";
import { poprawnyTokenCron } from "../../../../lib/cron.mjs";
import { nadawca, utworzTransportSmtp } from "../../../../lib/poczta";

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
  const kandydaci = await db.rezerwacja.findMany({
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
  });

  let transport;
  try {
    transport = utworzTransportSmtp();
  } catch {
    return Response.json({ blad: "Brak konfiguracji SMTP." }, { status: 503 });
  }

  const adresPortalu = String(process.env.AUTH_URL || "").replace(/\/$/, "");
  let wyslane = 0;
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
      await transport.sendMail({
        from: nadawca(),
        to: rezerwacja.user.email,
        subject: `Potwierdź rezerwację listu nr ${rezerwacja.list.numer}`,
        text: [
          `Rezerwacja listu od ${rezerwacja.list.imie} wygasa ${rezerwacja.wygasa.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}.`,
          "Potwierdź ją przed upływem terminu, inaczej list wróci do puli.",
          adresPortalu ? `${adresPortalu}/moje-rezerwacje` : "Zaloguj się do portalu i otwórz Moje rezerwacje.",
        ].join("\n\n"),
      });
      wyslane += 1;
    } catch {
      bledy += 1;
      await db.rezerwacja.updateMany({
        where: { id: rezerwacja.id, przypomnienieWyslane: znacznik },
        data: { przypomnienieWyslane: null },
      });
    }
  }

  return Response.json(
    { sprawdzone: kandydaci.length, wyslane, bledy },
    { status: bledy > 0 ? 502 : 200 }
  );
}
