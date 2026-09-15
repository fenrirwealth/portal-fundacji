import { db } from "../../../../../lib/db";
import { wymagajRedakcji } from "../../../../../lib/admin";
import { odczytajPrywatnySkan } from "../../../../../lib/skany";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  await wymagajRedakcji("/admin");
  const { id } = await params;
  const skan = await db.skanListu.findUnique({ where: { id }, select: { plik: true } });
  if (!skan) return new Response("Nie znaleziono", { status: 404 });
  try {
    const obraz = await odczytajPrywatnySkan(skan.plik);
    return new Response(obraz, { headers: {
      "Content-Type": "image/jpeg", "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="skan-${id.slice(0, 8)}.jpg"`, "X-Robots-Tag": "noindex, nofollow, noarchive",
    } });
  } catch {
    return new Response("Plik nie jest dostępny", { status: 404 });
  }
}
