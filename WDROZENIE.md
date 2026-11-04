# Wdrozenie portalu w Coolify

## Uslugi

- aplikacja z tego repozytorium, budowana przez `Dockerfile`,
- PostgreSQL w prywatnej sieci Coolify,
- domena `portal.fundacjalepszydomlepszejutro.pl`,
- zewnetrzny serwer SMTP do linkow logowania.

Nie wystawiaj portu PostgreSQL `5432` do internetu. Aplikacja laczy sie z
baza po wewnetrznej nazwie uslugi. Migracje wykonuja sie automatycznie przy
starcie kontenera, przed uruchomieniem Next.js.

## Zmienne srodowiskowe

Skopiuj nazwy z `.env.example` do konfiguracji aplikacji w Coolify. Wartosci
oznaczone `ZMIEN_TO` musza byc sekretami Coolify i nie moga trafic do Git.

Sekret Auth.js wygeneruj poleceniem:

```sh
openssl rand -base64 48
```

## Kontrola po wdrozeniu

1. `GET /api/zdrowie` zwraca HTTP 200 i `{"stan":"ok","baza":"ok"}`.
2. Certyfikat HTTPS jest aktywny, a HTTP przekierowuje na HTTPS.
3. Link logowania dochodzi na testowy adres i dziala tylko raz.
4. Port `5432` nie odpowiada z internetu.
5. Kopia zapasowa PostgreSQL jest skonfigurowana i przetestowana przez
   odtworzenie do osobnej bazy.

Po ustawieniu DNS i certyfikatow pierwsze cztery kontrole oraz zamkniecie
publicznego portu PostgreSQL mozna sprawdzic automatycznie:

```sh
npm run smoke:production
```

Polecenie domyslnie sprawdza domeny produkcyjne. Dla srodowiska testowego
ustaw `PORTAL_URL` i `STRONA_URL` na jego publiczne adresy HTTPS.

## Kopie zapasowe PostgreSQL

1. Wlacz codzienny backup bazy do magazynu poza VPS-em (S3 lub zgodny).
2. Ustaw retencje co najmniej: 7 kopii dziennych i 4 tygodniowe.
3. Zaszyfruj magazyn, ogranicz dane dostepowe tylko do katalogu backupow.
4. Raz w miesiacu odtworz najnowsza kopie do osobnej, prywatnej bazy.
5. Po odtworzeniu uruchom migracje i sprawdz liczbe uzytkownikow, listow,
   rezerwacji oraz prezentow; testowa baze nastepnie usun.

Kopia znajdujaca sie tylko na tym samym VPS-ie nie chroni przed awaria lub
utrata calego serwera. Hasel i kluczy do magazynu nie zapisuj w repozytorium.

## Pierwsze konto zarzadu

Najpierw zaloguj sie do portalu docelowym adresem e-mail. Nastepnie w
terminalu kontenera aplikacji wykonaj:

```sh
npm run admin:set-role -- osoba@example.com ZARZAD
```

Wyloguj sie i zaloguj ponownie. W nawigacji pojawi sie „Panel redakcji”.
Nie ustawiaj roli przez publiczny formularz ani zmienna srodowiskowa.

## Przypomnienia o rezerwacjach

W Coolify dodaj zadanie cykliczne uruchamiane raz na godzine. Powinno
wykonac zadanie HTTP:

```sh
curl --fail --silent --show-error \
  -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://portal.fundacjalepszydomlepszejutro.pl/api/zadania/przypomnienia
```

`CRON_SECRET` musi byc innym losowym sekretem niz `AUTH_SECRET`. Zadanie
wysyla jedno przypomnienie, gdy do wygaśnięcia niepotwierdzonej rezerwacji
pozostalo najwyzej 24 godziny.

## Kontakt telefoniczny i logowanie (listopad 2026)

Darczyńca potwierdza e-mail linkiem jednorazowym. Osobna, niezaznaczona domyślnie zgoda pozwala zachować sesję na tym urządzeniu przez stałe 30 dni; bez zgody sesja trwa 8 godzin. Data zgody i wybór są zapisane w rekordzie sesji.

Nowa rezerwacja czeka maksymalnie 48 godzin na potwierdzenie odbytej rozmowy przez redakcję/Zarząd. Darczyńca nie ma endpointu pozwalającego potwierdzić ją samemu. Panel pokazuje termin, osobę potwierdzającą i datę rozmowy. Worker co minutę uruchamia chronioną kontrolę terminów, więc wygaśnięcie działa również bez odwiedzin strony; wymagane są REDIS_URL i CRON_SECRET. Dotychczasowy cron może pozostać jako zabezpieczenie.

Każda rezerwacja, przypomnienie o rozmowie, przypomnienie o dostarczeniu i potwierdzenie kontaktu tworzą niezależne zadania e-mail dla darczyńcy i kontakt@fundacjalepszydomlepszejutro.pl. Linki logowania nie są kopiowane do Fundacji.

## Zarządzanie listami

Nawigacja kont REDAKCJA/ZARZAD pokazuje „Panel zarządzania” z wejściem bezpośrednio do tabeli listów. Przy liście dostępne są edycja, ręczna rezerwacja, zwolnienie oraz usunięcie do odwracalnego archiwum. Rezerwacja ręczna działa tylko dla opublikowanego, zweryfikowanego listu aktywnej edycji, zapisuje administratora i prywatną notatkę oraz nie tworzy fikcyjnego darczyńcy. Jest zatwierdzona przez Fundację i nie podlega terminowi 48 godzin. Fundacja otrzymuje osobne powiadomienie e-mail. Listu w aktywnej realizacji nie da się usunąć przed zwolnieniem. Wszystkie operacje ponownie sprawdzają rolę i wersję rekordu.
