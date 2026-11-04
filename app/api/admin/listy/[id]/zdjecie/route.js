import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "../../../../../../lib/db";
import { wymagajRedakcji } from "../../../../../../lib/admin";
import { adresyZdjeciaListu } from "../../../../../../lib/zdjecie-listu-admin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
