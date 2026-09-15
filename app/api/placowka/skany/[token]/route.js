import { db } from "../../../../../lib/db";
import { limitOperacji } from "../../../../../lib/limit";
import { hashTokena, usunPrywatnySkan, zapiszOczyszczonySkan } from "../../../../../lib/skany";
import { kolejkujEmail } from "../../../../../lib/kolejka-email";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return Response.json({ blad: "Link jest nieprawidłowy." }, { status: 404 });
  const dlugosc = Number(request.headers.get("content-length") || 0);
  if (dlugosc > 52 * 1024 * 1024) return Response.json({ blad: "Przesyłka jest za duża." }, { status: 413 });
  if (!(await limitOperacji(`skany:${hashTokena(token)}`, 20, 3600))) {
    return Response.json({ blad: "Osiągnięto limit przesyłania. Spróbuj ponownie za godzinę." }, { status: 429 });
  }

  const udzial = await db.udzialPlacowki.findFirst({
    where: { tokenPrzesylaniaHash: hashTokena(token), tokenPrzesylaniaWygasa: { gt: new Date() }, status: "POTWIERDZILA", edycja: { aktywna: true } },
    include: { placowka: { select: { nazwa: true } }, _count: { select: { skany: true } } },
  });
  if (!udzial) return Response.json({ blad: "Link wygasł lub został wyłączony." }, { status: 403 });

  const form = await request.formData();
  if (form.get("strona")) return Response.json({ ok: true, liczba: 0 });
  const pliki = form.getAll("skany").filter((plik) => plik instanceof File && plik.size > 0);
  if (pliki.length < 1 || pliki.length > 5) return Response.json({ blad: "Wybierz od 1 do 5 plików." }, { status: 400 });
  const notatka = String(form.get("notatka") || "").trim().slice(0, 800) || null;
  const zapisane = [];
  try {
    for (const plik of pliki) zapisane.push(await zapiszOczyszczonySkan(plik));
    await db.skanListu.createMany({ data: zapisane.map((s) => ({ ...s, udzialId: udzial.id, notatkaPlacowki: notatka })) });
  } catch (blad) {
    await Promise.all(zapisane.map((s) => usunPrywatnySkan(s.plik)));
    return Response.json({ blad: blad.message || "Nie udało się bezpiecznie przetworzyć pliku." }, { status: 400 });
  }

  await kolejkujEmail("NOWY_SKAN", {
    emailAdmina: process.env.ADMIN_EMAIL || "kontakt@fundacjalepszydomlepszejutro.pl",
    nazwa: udzial.placowka.nazwa, liczba: udzial._count.skany + zapisane.length,
  }, `nowy-skan-${udzial.id}-${Date.now()}`).catch((blad) => console.error("[skany] Powiadomienie:", blad.message));
  return Response.json({ ok: true, liczba: zapisane.length });
}
