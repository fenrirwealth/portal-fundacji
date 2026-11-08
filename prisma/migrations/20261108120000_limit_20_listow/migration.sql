BEGIN;

ALTER TABLE "Rezerwacja" ADD COLUMN "miejsceNaKoncie" INTEGER NOT NULL DEFAULT 1;

-- Zachowujemy istniejące rezerwacje; każda zajmuje własne miejsce na koncie.
WITH miejsca AS (
  SELECT "id", row_number() OVER (PARTITION BY "userId" ORDER BY "utworzona", "id") AS numer
  FROM "Rezerwacja" WHERE "status" IN ('OCZEKUJE', 'POTWIERDZONA')
)
UPDATE "Rezerwacja" r SET "miejsceNaKoncie" = m.numer
FROM miejsca m WHERE r."id" = m."id";

ALTER TABLE "Rezerwacja" ADD CONSTRAINT "Rezerwacja_miejsce_1_do_20"
  CHECK ("miejsceNaKoncie" BETWEEN 1 AND 20);

CREATE UNIQUE INDEX "Rezerwacja_aktywne_miejsce_na_koncie"
  ON "Rezerwacja"("userId", "miejsceNaKoncie")
  WHERE "status" IN ('OCZEKUJE', 'POTWIERDZONA');

DROP INDEX "Rezerwacja_jedna_aktywna_na_konto";

COMMIT;
