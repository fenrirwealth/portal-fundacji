// Reproducible optimization of the campaign artwork; originals stay untouched.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.argv[2];
if (!source) throw new Error("Podaj katalog z oryginalnymi grafikami kampanii");
await mkdir("public/magia", { recursive: true });
for (const [input, output, width] of [
  ["exec-4b37f5f4-4384-48ce-978b-0b2519c1e478.png", "noc.webp", 1920],
  ["exec-ab45af2f-3f86-41ba-8d59-8d15775409ce.png", "koperta.webp", 1000],
  ["exec-d67b707f-0930-4b41-9f8a-0679534891af.png", "stories.webp", 1080],
]) {
  await sharp(resolve(source, input)).resize({ width, withoutEnlargement: true }).webp({ quality: 86 }).toFile(`public/magia/${output}`);
}
// Satori/OG accepts JPEG/PNG data URIs, not WebP.
await sharp(resolve(source, "exec-d67b707f-0930-4b41-9f8a-0679534891af.png"))
  .resize({ width: 1080, withoutEnlargement: true }).jpeg({ quality: 88 }).toFile("public/magia/stories.jpg");
