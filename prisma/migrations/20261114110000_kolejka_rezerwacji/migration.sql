ALTER TABLE "Rezerwacja"
ADD COLUMN "emailRezerwacjiZakolejkowany" TIMESTAMP(3),
ADD COLUMN "emailPotwierdzeniaZakolejkowany" TIMESTAMP(3);

-- Istniejące zdarzenia obsługiwał wcześniejszy mechanizm kolejki.
UPDATE "Rezerwacja"
SET "emailRezerwacjiZakolejkowany" = "utworzona",
    "emailPotwierdzeniaZakolejkowany" = "kontaktTelefoniczny";
