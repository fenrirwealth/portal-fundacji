import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const czytaj = (sciezka) => fs.readFileSync(new URL(`../${sciezka}`, import.meta.url), "utf8");

test("prywatne skany nie trafiaja do katalogu publicznego i sa oczyszczane", () => {
  const skany = czytaj("lib/skany.js");
  const route = czytaj("app/api/placowka/skany/[token]/route.js");
  assert.match(skany, /rotate\(\).*resize[\s\S]*\.jpeg\(/);
  assert.doesNotMatch(skany, /\.withMetadata\s*\(/);
  assert.match(skany, /SKANY_PRIVATE_DIR/);
  assert.match(route, /tokenPrzesylaniaHash/);
  assert.match(route, /limitOperacji/);
});

test("panel udostepnia skan tylko po sprawdzeniu roli redakcji", () => {
  const route = czytaj("app/api/admin/skany/[id]/route.js");
  assert.match(route, /await wymagajRedakcji\(/);
  assert.match(route, /private, no-store/);
  assert.match(route, /noindex, nofollow, noarchive/);
});

test("e-maile transakcyjne przechodza przez kolejke z ponowieniami", () => {
  const kolejka = czytaj("lib/kolejka-email.js");
  const worker = czytaj("worker.mjs");
  assert.match(kolejka, /attempts: 5/);
  assert.match(kolejka, /exponential/);
  for (const typ of ["REZERWACJA", "PRZYPOMNIENIE", "PRZYPOMNIENIE_DOSTARCZENIA", "PODZIEKOWANIE", "LINK_PLACOWKI", "NOWY_SKAN"]) {
    assert.match(worker, new RegExp(typ));
  }
  assert.match(worker, /attachments:/);
});

test("migracja laczy skan z jedna placowka i jednym listem", () => {
  const sql = czytaj("prisma/migrations/20260915213000_skany_placowek/migration.sql");
  assert.match(sql, /SkanListu_udzialId_fkey/);
  assert.match(sql, /List_skanId_key/);
  assert.match(sql, /tokenPrzesylaniaHash_key/);
});

test("zadanie cykliczne egzekwuje retencje prywatnych skanow", () => {
  const route = czytaj("app/api/zadania/przypomnienia/route.js");
  assert.match(route, /90 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(route, /status: "ODRZUCONY"/);
  assert.match(route, /usunPrywatnySkan/);
});
