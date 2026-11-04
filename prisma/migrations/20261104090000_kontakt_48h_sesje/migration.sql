ALTER TABLE "Session" ADD COLUMN "zapamietana" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "zgodaZapamietania" TIMESTAMP(3);
ALTER TABLE "Rezerwacja" ADD COLUMN "kontaktTelefoniczny" TIMESTAMP(3),
ADD COLUMN "kontaktPotwierdzilId" TEXT;
ALTER TABLE "Rezerwacja" ADD CONSTRAINT "Rezerwacja_kontaktPotwierdzilId_fkey"
FOREIGN KEY ("kontaktPotwierdzilId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Dotychczasowe sesje nie mają zapisanej zgody na 30 dni.
UPDATE "Session" SET "expires" = LEAST("expires", CURRENT_TIMESTAMP + INTERVAL '8 hours');
