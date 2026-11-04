ALTER TABLE "Weryfikacja"
  ADD COLUMN "zgodaNaNazwisko" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "zgodaNaDaneZdrowotne" BOOLEAN NOT NULL DEFAULT false;
