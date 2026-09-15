-- Prywatne, oczyszczone skany listów i bezpieczne linki placówek.
CREATE TYPE "StatusSkanu" AS ENUM ('NOWY', 'W_MODERACJI', 'ZATWIERDZONY', 'ODRZUCONY');

ALTER TABLE "UdzialPlacowki"
  ADD COLUMN "tokenPrzesylaniaHash" TEXT,
  ADD COLUMN "tokenPrzesylaniaWygasa" TIMESTAMP(3);

CREATE UNIQUE INDEX "UdzialPlacowki_tokenPrzesylaniaHash_key"
  ON "UdzialPlacowki"("tokenPrzesylaniaHash");

CREATE TABLE "SkanListu" (
  "id" TEXT NOT NULL,
  "udzialId" TEXT NOT NULL,
  "plik" TEXT NOT NULL,
  "oryginalnaNazwa" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "rozmiar" INTEGER NOT NULL,
  "sumaKontrolna" TEXT NOT NULL,
  "status" "StatusSkanu" NOT NULL DEFAULT 'NOWY',
  "notatkaPlacowki" TEXT,
  "uwagiModeracji" TEXT,
  "utworzony" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "zaktualizowany" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SkanListu_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkanListu_plik_key" ON "SkanListu"("plik");
CREATE INDEX "SkanListu_status_utworzony_idx" ON "SkanListu"("status", "utworzony");
CREATE INDEX "SkanListu_udzialId_idx" ON "SkanListu"("udzialId");

ALTER TABLE "SkanListu"
  ADD CONSTRAINT "SkanListu_udzialId_fkey"
  FOREIGN KEY ("udzialId") REFERENCES "UdzialPlacowki"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "List" ADD COLUMN "skanId" TEXT;
CREATE UNIQUE INDEX "List_skanId_key" ON "List"("skanId");
ALTER TABLE "List"
  ADD CONSTRAINT "List_skanId_fkey"
  FOREIGN KEY ("skanId") REFERENCES "SkanListu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Rezerwacja" ADD COLUMN "przypomnienieDostarczeniaWyslane" TIMESTAMP(3);
