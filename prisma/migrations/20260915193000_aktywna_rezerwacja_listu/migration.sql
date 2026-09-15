-- Obrona warstwowa przed podwojna rezerwacja.
-- Kod aplikacji zajmuje list atomowym UPDATE ... WHERE status=OPUBLIKOWANY,
-- a ten indeks dodatkowo uniemożliwia istnienie dwóch aktywnych rezerwacji
-- jednego listu nawet po przyszłej zmianie kodu lub ręcznej operacji.
CREATE UNIQUE INDEX IF NOT EXISTS "Rezerwacja_jedna_aktywna_na_list"
ON "Rezerwacja" ("listId")
WHERE "status" IN ('OCZEKUJE', 'POTWIERDZONA');
