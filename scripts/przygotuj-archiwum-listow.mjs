// Optymalizuje archiwalne listy i usuwa metadane. Oryginały pozostają nietknięte.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.argv[2];
if (!source) throw new Error("Podaj katalog zawierający pliki 1.png–9.png");

await mkdir("public/archiwum/listy", { recursive: true });

for (let i = 1; i <= 9; i += 1) {
  await sharp(resolve(source, `${i}.png`))
    .rotate()
    .resize({ width: 1120, height: 1480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86, effort: 5 })
    .toFile(`public/archiwum/listy/list-${String(i).padStart(2, "0")}.webp`);
}

console.log("Przygotowano 9 zanonimizowanych technicznie plików bez EXIF.");
