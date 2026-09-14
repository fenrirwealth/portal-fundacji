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

## Pierwsze konto zarzadu

Najpierw zaloguj sie do portalu docelowym adresem e-mail. Nastepnie w
terminalu kontenera aplikacji wykonaj:

```sh
npm run admin:set-role -- osoba@example.com ZARZAD
```

Wyloguj sie i zaloguj ponownie. W nawigacji pojawi sie „Panel redakcji”.
Nie ustawiaj roli przez publiczny formularz ani zmienna srodowiskowa.
