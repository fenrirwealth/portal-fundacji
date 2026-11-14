import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { db } from "../../../../../../lib/db";
import { wymagajRedakcji } from "../../../../../../lib/admin";
import { limitOperacji } from "../../../../../../lib/limit";
import { katalogSkanow } from "../../../../../../lib/skany";
import { adresyZdjeciaListu } from "../../../../../../lib/zdjecie-listu-admin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PORTAL = "https://portal.fundacjalepszydomlepszejutro.pl";
const LIMIT_PLIKU = 10 * 1024 * 1024;
const FORMATY = new Set(["jpeg", "png", "webp"]);

export async function POST(request, { params }) {
  const origin = request.headers.get("origin");
  const dozwolone = [PORTAL, process.env.AUTH_URL].filter(Boolean).map((url) => new URL(url).origin);
  if (!dozwolone.includes(origin)) return Response.json({ blad: "Otwórz formularz bezpośrednio w portalu." }, { status: 403 });
  const administrator = await wymagajRedakcji("/admin");
  const { id } = await params;
  if (!/^[a-z0-9-]{1,80}$/i.test(id)) return Response.json({ blad: "Nie znaleziono listu." }, { status: 404 });
  const wersja = request.headers.get("x-wersja-listu");
  if (!wersja || !Number.isFinite(Date.parse(wersja))) return Response.json({ blad: "Odśwież kartę listu." }, { status: 400 });
  const dlugosc = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(dlugosc) || dlugosc <= 0 || dlugosc > 2 * LIMIT_PLIKU + 16384) {
    return Response.json({ blad: "Wybierz maksymalnie dwa zdjęcia, każde do 10 MB." }, { status: 413 });
  }
  if (!(await limitOperacji(`zdjecie-listu:${administrator.id}`, 60, 3600))) {
    return Response.json({ blad: "Limit przesyłania zdjęć został osiągnięty. Spróbuj za godzinę." }, { status: 429 });
  }

  let obraz;
  try {
    const formularz = await request.formData();
    const pliki = formularz.getAll("zdjecia");
    if (pliki.length < 1 || pliki.length > 2) throw new Error("Liczba zdjęć");
    const strony = await Promise.all(pliki.map(async (plik) => {
      if (!(plik instanceof File) || plik.size < 1 || plik.size > LIMIT_PLIKU) throw new Error("Rozmiar zdjęcia");
      const skan = sharp(Buffer.from(await plik.arrayBuffer()), { failOn: "warning", limitInputPixels: 40_000_000 });
      if (!FORMATY.has((await skan.metadata()).format)) throw new Error("Format zdjęcia");
      return skan.rotate().resize({ width: 1500, height: 1800, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#fff" }).png().toBuffer({ resolveWithObject: true });
    }));
    if (strony.length === 1) {
      obraz = strony[0].data;
    } else {
      const [gora, dol] = strony;
      const width = Math.max(gora.info.width, dol.info.width);
      const przerwa = 20;
      obraz = await sharp({ create: { width, height: gora.info.height + przerwa + dol.info.height, channels: 3, background: "#fff" } })
        .composite([
          { input: gora.data, top: 0, left: Math.floor((width - gora.info.width) / 2) },
          { input: dol.data, top: gora.info.height + przerwa, left: Math.floor((width - dol.info.width) / 2) },
        ]).png().toBuffer();
    }
  } catch {
    return Response.json({ blad: "Wybierz jedno lub dwa poprawne zdjęcia JPG, PNG lub WEBP, każde do 10 MB." }, { status: 400 });
  }

  const katalog = path.join(katalogSkanow(), "public-listy");
  const plikTymczasowy = path.join(katalog, randomUUID() + ".tmp");
  try {
    await mkdir(katalog, { recursive: true, mode: 0o700 });
    await writeFile(plikTymczasowy, obraz, { mode: 0o600, flag: "wx" });
    const zapisano = await db.$transaction(async (tx) => {
      const wynik = await tx.list.updateMany({
        where: { id, zaktualizowany: new Date(wersja), status: { not: "WYCOFANY" } },
        data: { zdjecieUrl: `${PORTAL}/api/listy/${id}/zdjecie` },
      });
      if (wynik.count !== 1) return false;
      await rename(plikTymczasowy, path.join(katalog, id + ".png"));
      return true;
    });
    if (!zapisano) return Response.json({ blad: "Stan listu zmienił się. Odśwież kartę i spróbuj ponownie." }, { status: 409 });
  } catch (error) {
    console.error("[zdjecie-listu] Błąd zapisu:", error.code);
    return Response.json({ blad: "Nie udało się zapisać zdjęcia." }, { status: 500 });
  } finally {
    await rm(plikTymczasowy, { force: true }).catch(() => {});
  }

  for (const sciezka of ["/admin", `/admin/listy/${id}`, "/listy", `/listy/${id}`]) revalidatePath(sciezka);
  return Response.json({ ok: true });
}

export async function GET(request, { params }) {
  await wymagajRedakcji("/admin");
  const { id } = await params;
  if (!/^[a-z0-9-]{1,80}$/i.test(id)) return new Response(null, { status: 404 });
  const list = await db.list.findUnique({ where: { id }, select: { zdjecieUrl: true } });
  const adresy = adresyZdjeciaListu(id, list?.zdjecieUrl);
  if (!adresy?.pelny.startsWith("/api/admin/listy/")) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(process.env.SKANY_PRIVATE_DIR || "/data/skany", "public-listy", id + ".png"));
    const miniatura = new URL(request.url).searchParams.get("miniatura") === "1";
    const obraz = miniatura ? await sharp(bytes).resize({ width: 144, height: 192, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer() : bytes;
    return new Response(obraz, { headers: {
      "Content-Type": miniatura ? "image/webp" : "image/png",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    } });
  } catch { return new Response(null, { status: 404 }); }
}
