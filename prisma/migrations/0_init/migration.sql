-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rola" AS ENUM ('DARCZYNCA', 'REDAKCJA', 'ZARZAD');

-- CreateEnum
CREATE TYPE "StatusPlacowki" AS ENUM ('ZGLOSZONA', 'POTWIERDZILA', 'ODMOWILA', 'ZAKONCZONA');

-- CreateEnum
CREATE TYPE "StatusListu" AS ENUM ('SZKIC', 'DO_POPRAWY', 'OPUBLIKOWANY', 'ZAREZERWOWANY', 'OPLACONY', 'PRZEKAZANY', 'WYCOFANY');

-- CreateEnum
CREATE TYPE "Kategoria" AS ENUM ('ZABAWKI', 'SPORT', 'KSIAZKI', 'NAUKA', 'UBRANIA', 'INNE');

-- CreateEnum
CREATE TYPE "StatusRezerwacji" AS ENUM ('OCZEKUJE', 'POTWIERDZONA', 'DOSTARCZONA', 'WYGASLA', 'ANULOWANA');

-- CreateEnum
CREATE TYPE "StanPrezentu" AS ENUM ('ZAPOWIEDZIANY', 'PRZYJETY', 'SPRAWDZONY', 'ODRZUCONY', 'ZAPAKOWANY', 'WYDANY');

-- CreateEnum
CREATE TYPE "StatusZgloszenia" AS ENUM ('NOWE', 'W_TOKU', 'PRZYJETE', 'ODRZUCONE');

-- CreateTable
CREATE TABLE "Uzytkownik" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "imieNazwisko" TEXT NOT NULL,
    "telefon" TEXT,
    "telefonPotwierdzony" TIMESTAMP(3),
    "rola" "Rola" NOT NULL DEFAULT 'DARCZYNCA',
    "dostawcaAuth" TEXT,
    "idZewnetrzne" TEXT,
    "emailPotwierdzony" TIMESTAMP(3),
    "zgodaRegulamin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zgodaMarketing" TIMESTAMP(3),
    "utworzony" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zaktualizowany" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Uzytkownik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ustawienie" (
    "klucz" TEXT NOT NULL,
    "wartosc" TEXT NOT NULL,
    "opis" TEXT,
    "zmienione" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ustawienie_pkey" PRIMARY KEY ("klucz")
);

-- CreateTable
CREATE TABLE "Placowka" (
    "id" TEXT NOT NULL,
    "nazwa" TEXT NOT NULL,
    "ulica" TEXT,
    "kodPocztowy" TEXT,
    "miejscowosc" TEXT,
    "wojewodztwo" TEXT NOT NULL,
    "osobaKontaktowa" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "status" "StatusPlacowki" NOT NULL DEFAULT 'ZGLOSZONA',
    "zakazanePrzedmioty" TEXT,
    "notatki" TEXT,
    "utworzona" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zaktualizowana" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Placowka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "numer" SERIAL NOT NULL,
    "imie" TEXT NOT NULL,
    "wiek" INTEGER NOT NULL,
    "wojewodztwo" TEXT NOT NULL,
    "kategoria" "Kategoria" NOT NULL,
    "marzenie" TEXT NOT NULL,
    "rozmiar" TEXT,
    "skanUrl" TEXT,
    "trescOdczytana" TEXT,
    "placowkaId" TEXT NOT NULL,
    "zgodaPlik" TEXT,
    "zgodaData" TIMESTAMP(3),
    "zgodaCofnieta" TIMESTAMP(3),
    "status" "StatusListu" NOT NULL DEFAULT 'SZKIC',
    "utworzony" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zaktualizowany" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weryfikacja" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "osobaId" TEXT NOT NULL,
    "zgodaDolaczona" BOOLEAN NOT NULL DEFAULT false,
    "brakNazwiska" BOOLEAN NOT NULL DEFAULT false,
    "brakPlacowki" BOOLEAN NOT NULL DEFAULT false,
    "brakMiejscowosci" BOOLEAN NOT NULL DEFAULT false,
    "brakInnychOsob" BOOLEAN NOT NULL DEFAULT false,
    "brakDanychWrazliwych" BOOLEAN NOT NULL DEFAULT false,
    "brakWizerunku" BOOLEAN NOT NULL DEFAULT false,
    "metadaneUsuniete" BOOLEAN NOT NULL DEFAULT false,
    "nazwaPlikuPoprawna" BOOLEAN NOT NULL DEFAULT false,
    "opisPoprawny" BOOLEAN NOT NULL DEFAULT false,
    "uwagi" TEXT,
    "zakonczona" TIMESTAMP(3),
    "utworzona" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Weryfikacja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rezerwacja" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "uzytkownikId" TEXT NOT NULL,
    "status" "StatusRezerwacji" NOT NULL DEFAULT 'OCZEKUJE',
    "wygasa" TIMESTAMP(3) NOT NULL,
    "potwierdzona" TIMESTAMP(3),
    "anulowana" TIMESTAMP(3),
    "przypomnienieWyslane" TIMESTAMP(3),
    "utworzona" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rezerwacja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prezent" (
    "id" TEXT NOT NULL,
    "rezerwacjaId" TEXT NOT NULL,
    "stan" "StanPrezentu" NOT NULL DEFAULT 'ZAPOWIEDZIANY',
    "dataPrzyjecia" TIMESTAMP(3),
    "przyjetyPrzez" TEXT,
    "opisZawartosci" TEXT,
    "powodOdrzucenia" TEXT,
    "dostawaId" TEXT,
    "utworzony" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zaktualizowany" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prezent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dostawa" (
    "id" TEXT NOT NULL,
    "placowkaId" TEXT NOT NULL,
    "dataWydania" TIMESTAMP(3),
    "odebralOsoba" TEXT,
    "protokolPlik" TEXT,
    "utworzona" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dostawa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aktualnosc" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tytul" TEXT NOT NULL,
    "zajawka" TEXT NOT NULL,
    "tresc" TEXT NOT NULL,
    "obrazUrl" TEXT,
    "opublikowana" TIMESTAMP(3),
    "utworzona" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zaktualizowana" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aktualnosc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZgloszeniePotrzeby" (
    "id" TEXT NOT NULL,
    "ktoZglasza" TEXT NOT NULL,
    "nazwa" TEXT NOT NULL,
    "miejscowosc" TEXT,
    "rodzajPotrzeby" TEXT NOT NULL,
    "opis" TEXT NOT NULL,
    "kontakt" TEXT NOT NULL,
    "status" "StatusZgloszenia" NOT NULL DEFAULT 'NOWE',
    "notatki" TEXT,
    "utworzone" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zaktualizowane" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZgloszeniePotrzeby_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Uzytkownik_email_key" ON "Uzytkownik"("email");

-- CreateIndex
CREATE INDEX "Uzytkownik_email_idx" ON "Uzytkownik"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Uzytkownik_dostawcaAuth_idZewnetrzne_key" ON "Uzytkownik"("dostawcaAuth", "idZewnetrzne");

-- CreateIndex
CREATE UNIQUE INDEX "List_numer_key" ON "List"("numer");

-- CreateIndex
CREATE INDEX "List_status_idx" ON "List"("status");

-- CreateIndex
CREATE INDEX "List_kategoria_wiek_idx" ON "List"("kategoria", "wiek");

-- CreateIndex
CREATE UNIQUE INDEX "Weryfikacja_listId_key" ON "Weryfikacja"("listId");

-- CreateIndex
CREATE INDEX "Rezerwacja_status_wygasa_idx" ON "Rezerwacja"("status", "wygasa");

-- CreateIndex
CREATE INDEX "Rezerwacja_uzytkownikId_idx" ON "Rezerwacja"("uzytkownikId");

-- CreateIndex
CREATE UNIQUE INDEX "Prezent_rezerwacjaId_key" ON "Prezent"("rezerwacjaId");

-- CreateIndex
CREATE UNIQUE INDEX "Aktualnosc_slug_key" ON "Aktualnosc"("slug");

-- CreateIndex
CREATE INDEX "Aktualnosc_opublikowana_idx" ON "Aktualnosc"("opublikowana");

-- CreateIndex
CREATE INDEX "ZgloszeniePotrzeby_status_idx" ON "ZgloszeniePotrzeby"("status");

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_placowkaId_fkey" FOREIGN KEY ("placowkaId") REFERENCES "Placowka"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weryfikacja" ADD CONSTRAINT "Weryfikacja_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weryfikacja" ADD CONSTRAINT "Weryfikacja_osobaId_fkey" FOREIGN KEY ("osobaId") REFERENCES "Uzytkownik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezerwacja" ADD CONSTRAINT "Rezerwacja_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezerwacja" ADD CONSTRAINT "Rezerwacja_uzytkownikId_fkey" FOREIGN KEY ("uzytkownikId") REFERENCES "Uzytkownik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prezent" ADD CONSTRAINT "Prezent_rezerwacjaId_fkey" FOREIGN KEY ("rezerwacjaId") REFERENCES "Rezerwacja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prezent" ADD CONSTRAINT "Prezent_dostawaId_fkey" FOREIGN KEY ("dostawaId") REFERENCES "Dostawa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dostawa" ADD CONSTRAINT "Dostawa_placowkaId_fkey" FOREIGN KEY ("placowkaId") REFERENCES "Placowka"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
