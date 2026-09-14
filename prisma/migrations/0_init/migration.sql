-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rola" AS ENUM ('DARCZYNCA', 'REDAKCJA', 'ZARZAD');

-- CreateEnum
CREATE TYPE "StatusUdzialu" AS ENUM ('ZGLOSZONA', 'POTWIERDZILA', 'ODMOWILA', 'ZAKONCZONA');

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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "telefon" TEXT,
    "telefonPotwierdzony" TIMESTAMP(3),
    "rola" "Rola" NOT NULL DEFAULT 'DARCZYNCA',
    "zgodaRegulamin" TIMESTAMP(3),
    "wersjaRegulaminu" TEXT,
    "zgodaMarketing" TIMESTAMP(3),
    "wersjaZgodyMarketing" TEXT,
    "utworzony" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zaktualizowany" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "EdycjaAkcji" (
    "id" TEXT NOT NULL,
    "rok" INTEGER NOT NULL,
    "nazwa" TEXT NOT NULL,
    "dataStart" TIMESTAMP(3) NOT NULL,
    "dataKoniec" TIMESTAMP(3) NOT NULL,
    "terminDostarczenia" TIMESTAMP(3) NOT NULL,
    "aktywna" BOOLEAN NOT NULL DEFAULT false,
    "utworzona" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdycjaAkcji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placowka" (
    "id" TEXT NOT NULL,
    "klucz" TEXT,
    "nazwa" TEXT NOT NULL,
    "ulica" TEXT,
    "kodPocztowy" TEXT,
    "miejscowosc" TEXT,
    "wojewodztwo" TEXT NOT NULL,
    "osobaKontaktowa" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "notatki" TEXT,
    "utworzona" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zaktualizowana" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Placowka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UdzialPlacowki" (
    "id" TEXT NOT NULL,
    "placowkaId" TEXT NOT NULL,
    "edycjaId" TEXT NOT NULL,
    "status" "StatusUdzialu" NOT NULL DEFAULT 'ZGLOSZONA',
    "deklarowaneDzieci" INTEGER,
    "zakazanePrzedmioty" TEXT,
    "uwagi" TEXT,
    "zgloszonaOsoba" TEXT,
    "zgloszonyTelefon" TEXT,
    "zgloszonyEmail" TEXT,
    "utworzony" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zaktualizowany" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UdzialPlacowki_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "numer" SERIAL NOT NULL,
    "edycjaId" TEXT NOT NULL,
    "imie" TEXT NOT NULL,
    "wiek" INTEGER NOT NULL,
    "wojewodztwo" TEXT NOT NULL,
    "kategoria" "Kategoria" NOT NULL,
    "marzenie" TEXT NOT NULL,
    "rozmiar" TEXT,
    "opis" TEXT,
    "zdjecieUrl" TEXT,
    "placowkaId" TEXT NOT NULL,
    "zgodaData" TIMESTAMP(3),
    "zgodaPrzyjalId" TEXT,
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
    "userId" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "EdycjaAkcji_rok_key" ON "EdycjaAkcji"("rok");

-- CreateIndex
CREATE INDEX "EdycjaAkcji_aktywna_idx" ON "EdycjaAkcji"("aktywna");

-- CreateIndex
CREATE UNIQUE INDEX "Placowka_klucz_key" ON "Placowka"("klucz");

-- CreateIndex
CREATE INDEX "Placowka_wojewodztwo_idx" ON "Placowka"("wojewodztwo");

-- CreateIndex
CREATE INDEX "UdzialPlacowki_status_idx" ON "UdzialPlacowki"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UdzialPlacowki_placowkaId_edycjaId_key" ON "UdzialPlacowki"("placowkaId", "edycjaId");

-- CreateIndex
CREATE UNIQUE INDEX "List_numer_key" ON "List"("numer");

-- CreateIndex
CREATE INDEX "List_status_idx" ON "List"("status");

-- CreateIndex
CREATE INDEX "List_edycjaId_status_idx" ON "List"("edycjaId", "status");

-- CreateIndex
CREATE INDEX "List_kategoria_wiek_idx" ON "List"("kategoria", "wiek");

-- CreateIndex
CREATE UNIQUE INDEX "Weryfikacja_listId_key" ON "Weryfikacja"("listId");

-- CreateIndex
CREATE INDEX "Rezerwacja_status_wygasa_idx" ON "Rezerwacja"("status", "wygasa");

-- CreateIndex
CREATE INDEX "Rezerwacja_userId_idx" ON "Rezerwacja"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Prezent_rezerwacjaId_key" ON "Prezent"("rezerwacjaId");

-- CreateIndex
CREATE UNIQUE INDEX "Aktualnosc_slug_key" ON "Aktualnosc"("slug");

-- CreateIndex
CREATE INDEX "Aktualnosc_opublikowana_idx" ON "Aktualnosc"("opublikowana");

-- CreateIndex
CREATE INDEX "ZgloszeniePotrzeby_status_idx" ON "ZgloszeniePotrzeby"("status");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UdzialPlacowki" ADD CONSTRAINT "UdzialPlacowki_placowkaId_fkey" FOREIGN KEY ("placowkaId") REFERENCES "Placowka"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UdzialPlacowki" ADD CONSTRAINT "UdzialPlacowki_edycjaId_fkey" FOREIGN KEY ("edycjaId") REFERENCES "EdycjaAkcji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_edycjaId_fkey" FOREIGN KEY ("edycjaId") REFERENCES "EdycjaAkcji"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_placowkaId_fkey" FOREIGN KEY ("placowkaId") REFERENCES "Placowka"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weryfikacja" ADD CONSTRAINT "Weryfikacja_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weryfikacja" ADD CONSTRAINT "Weryfikacja_osobaId_fkey" FOREIGN KEY ("osobaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezerwacja" ADD CONSTRAINT "Rezerwacja_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezerwacja" ADD CONSTRAINT "Rezerwacja_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prezent" ADD CONSTRAINT "Prezent_rezerwacjaId_fkey" FOREIGN KEY ("rezerwacjaId") REFERENCES "Rezerwacja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prezent" ADD CONSTRAINT "Prezent_dostawaId_fkey" FOREIGN KEY ("dostawaId") REFERENCES "Dostawa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dostawa" ADD CONSTRAINT "Dostawa_placowkaId_fkey" FOREIGN KEY ("placowkaId") REFERENCES "Placowka"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Limit "jedno konto — jeden aktywny list", wymuszony przez baze.
CREATE UNIQUE INDEX "Rezerwacja_jedna_aktywna_na_konto"
  ON "Rezerwacja"("userId")
  WHERE "status" IN ('OCZEKUJE', 'POTWIERDZONA');

-- Adres e-mail jest tozsamoscia konta, wiec roznica w wielkosci liter
-- nie moze tworzyc drugiego uzytkownika.
CREATE UNIQUE INDEX "User_email_lower_key" ON "User"(lower("email"));

-- MAKSYMALNIE jedna edycja moze byc aktywna. Zero aktywnych edycji jest
-- stanem dozwolonym i normalnym miedzy kampaniami.
CREATE UNIQUE INDEX "EdycjaAkcji_jedna_aktywna"
  ON "EdycjaAkcji"((1))
  WHERE "aktywna" = true;
