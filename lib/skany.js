import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAKS_BAJTOW = 10 * 1024 * 1024;
const FORMATY = new Set(["jpeg", "png", "webp"]);

export function hashTokena(token) {
  return createHash("sha256").update(String(token), "utf8").digest("hex");
}

export function nowyTokenPrzesylania() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashTokena(token) };
}

export function katalogSkanow() {
  return process.env.SKANY_PRIVATE_DIR || "/data/skany";
}

export async function zapiszOczyszczonySkan(plik) {
  if (!(plik instanceof File) || plik.size < 1 || plik.size > MAKS_BAJTOW) {
    throw new Error("Plik musi mieć od 1 B do 10 MB.");
  }
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(plik.type)) {
    throw new Error("Dozwolone są pliki JPG, PNG i WEBP.");
  }

  const wejscie = Buffer.from(await plik.arrayBuffer());
  const obraz = sharp(wejscie, { failOn: "warning", limitInputPixels: 40_000_000 });
  const meta = await obraz.metadata();
  if (!FORMATY.has(meta.format)) throw new Error("Zawartość pliku nie jest obsługiwanym obrazem.");

  // rotate() respektuje orientację EXIF, a wyjście JPEG bez withMetadata()
  // usuwa EXIF, GPS, miniatury i komentarze. Ograniczenie wymiaru chroni zasoby.
  const oczyszczony = await obraz.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#fff9f0" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();

  const katalog = katalogSkanow();
  await mkdir(katalog, { recursive: true, mode: 0o700 });
  const nazwa = `${randomUUID()}.jpg`;
  await writeFile(path.join(katalog, nazwa), oczyszczony, { flag: "wx", mode: 0o600 });

  return {
    plik: nazwa,
    // Oryginalna nazwa może zawierać imię i nazwisko dziecka, więc jej
    // celowo nie utrwalamy.
    oryginalnaNazwa: "list-przeslany.jpg",
    mimeType: "image/jpeg",
    rozmiar: oczyszczony.length,
    sumaKontrolna: createHash("sha256").update(oczyszczony).digest("hex"),
  };
}

export async function odczytajPrywatnySkan(nazwa) {
  if (!/^[0-9a-f-]{36}\.jpg$/i.test(String(nazwa))) throw new Error("Nieprawidłowa nazwa pliku.");
  return readFile(path.join(/* turbopackIgnore: true */ katalogSkanow(), nazwa));
}

export async function usunPrywatnySkan(nazwa) {
  if (!/^[0-9a-f-]{36}\.jpg$/i.test(String(nazwa))) return;
  await unlink(path.join(/* turbopackIgnore: true */ katalogSkanow(), nazwa)).catch(() => {});
}
