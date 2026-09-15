import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("przyklad srodowiska zawiera wszystkie wymagane sekrety i adresy", () => {
  const env = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  for (const nazwa of [
    "DATABASE_URL",
    "AUTH_URL",
    "AUTH_SECRET",
    "CRON_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
  ]) {
    assert.match(env, new RegExp(`^${nazwa}=`, "m"));
  }
});

test("obraz uruchamia migracje przed aplikacja i ma healthcheck", () => {
  const dockerfile = fs.readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  const entrypoint = fs.readFileSync(
    new URL("../docker-entrypoint.sh", import.meta.url),
    "utf8"
  );
  assert.match(dockerfile, /HEALTHCHECK[\s\S]*\/api\/zdrowie/);
  assert.match(entrypoint, /prisma migrate deploy/);
  assert.doesNotMatch(entrypoint, /^\s*(?:npx )?prisma migrate resolve --applied/m);
});

test("migracja wymusza kluczowe ograniczenia wspolbieznosci", () => {
  const sql = fs.readFileSync(
    new URL("../prisma/migrations/0_init/migration.sql", import.meta.url),
    "utf8"
  );
  assert.match(sql, /Rezerwacja_jedna_aktywna_na_konto/);
  assert.match(sql, /User_email_lower_key/);
  assert.match(sql, /EdycjaAkcji_jedna_aktywna/);
});

test("kazda akcja panelu ponownie sprawdza role redakcji", () => {
  const akcje = fs.readFileSync(new URL("../app/admin/actions.js", import.meta.url), "utf8");
  const eksporty = [...akcje.matchAll(/export async function (\w+)\([^)]*\) \{([\s\S]*?)(?=\nexport async function|$)/g)];
  assert.ok(eksporty.length >= 4);
  for (const [, nazwa, tresc] of eksporty) {
    assert.match(tresc, /await wymagajRedakcji\(/, `brak kontroli roli w ${nazwa}`);
  }
});

test("SEO portalu indeksuje tylko bezpieczne strony publiczne", () => {
  const robots = fs.readFileSync(new URL("../app/robots.js", import.meta.url), "utf8");
  const sitemap = fs.readFileSync(new URL("../app/sitemap.js", import.meta.url), "utf8");
  const szczegolListu = fs.readFileSync(
    new URL("../app/listy/[id]/page.js", import.meta.url),
    "utf8"
  );

  assert.match(robots, /"\/admin\/"/);
  assert.match(robots, /"\/api\/"/);
  assert.match(robots, /"\/listy\/\*"/);
  assert.match(sitemap, /"\/listy"/);
  assert.doesNotMatch(sitemap, /\/listy\/\[id\]/);
  assert.match(szczegolListu, /robots:\s*\{\s*index:\s*false/);
});
