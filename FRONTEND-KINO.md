# Warstwa kinowa portalu

## Zakres

- Hero pozostaje zasilane stanem aktywnej edycji z `app/page.js`. Nie zmieniono rezerwacji, autoryzacji ani schematu bazy.
- Powitanie trwa 3,6 s, raz na sesję karty. Można je pominąć lub zamknąć Escape. Przy reduced motion, oszczędzaniu danych lub niedostępnej pamięci sesji nie jest pokazywane. To animacja powitalna, nie wskaźnik postępu zapytań.
- R3F jest ładowane dynamicznie. Koperta ma oświetlenie, fakturę papieru, ruchomą klapę, bordowy lak i złote detale. Pole cząstek reaguje na wskaźnik. Jest to analityczne pole przepływu, nie pełny solver dynamiki płynów.
- Zatrzymanie animacji, przejście poza ekran i ukrycie karty ograniczają renderowanie. Limit DPR wynosi 1,5. Brak WebGL lub błąd sceny pozostawia wygenerowany wcześniej obraz koperty.
- Czujnik ruchu jest uruchamiany wyłącznie przyciskiem; odmowa uprawnienia nie blokuje portalu.
- Losowanie otwiera skrytkę i kopertę, po czym przechodzi do istniejącego `/listy/losowy`. Nie rezerwuje listu. GET losowania nie jest pobierany przez prefetch.
- Licznik korzysta z istniejącego SSE `/api/licznik`, odrzuca błędne dane, animuje rzeczywisty postęp (również dokładne zero), informuje o utracie połączenia.
- Stories: podgląd prawdziwego PNG przed drugim, świadomym kliknięciem udostępniania. Pobieranie i kopiowanie linku dostępne osobno. Zamknięcie przerywa żądanie i zwalnia blob URL.
- Generator korzysta z lokalnego JPEG oraz fontów Fraunces / DM Sans z polskimi znakami. WebP pozostaje formatem tekstur przeglądarkowych. PNG nie jest cache'owane ze starym statusem rezerwacji.
- Grafiki kampanii są w `public/magia`; Docker kopiuje je do obrazu produkcyjnego.

## Sprawdzanie

```sh
npm ci
npm run test:components
npm run typecheck
npm run check
npm run lint
npm run build
npm audit
```

`check` wymaga ustawienia `DATABASE_URL` do walidacji schematu. Nie wykonuje migracji ani zapytań do produkcji.

Testy komponentów sprawdzają: timer i pomijanie intro, reduced motion, kontrakt linków Hero, brak rezerwacji podczas renderowania, zdarzenia SSE, sprzątanie połączeń, pobieranie/udostępnianie Stories i obsługę błędu. Test R3F montuje prawdziwe elementy Three z rendererem testowym i sprawdza ruch klapy. Test generatora renderuje prawdziwy PNG 1080×1920 i odrzuca niepubliczny list na podstawie mocka warstwy danych.

## Ograniczenia weryfikacji

- Test R3F nie zastępuje oceny GPU, płynności ani fotorealizmu w prawdziwej przeglądarce.
- Zdalna przeglądarka tej sesji odmówiła otwarcia lokalnego adresu (`ERR_BLOCKED_BY_CLIENT`). Pełny przegląd desktop/mobile, Web Share na telefonie i żyroskop pozostają do sprawdzenia na środowisku podglądowym.
- Integracje testowano przez rzeczywiste komponenty i generator, z kontrolowanymi danymi. Nie wykonano rezerwacji ani wysyłek na produkcji.
- Ta zmiana nie stanowi deklaracji publikacji na produkcji. Przed scaleniem należy sprawdzić podgląd: intro, Escape, reduced motion, WebGL fallback, responsywność 390/768/1440 px, losowanie, Stories oraz logowanie i rezerwację.

## Decyzje techniczne

React Three Fiber 9.4.0 jest przypięte dokładnie: 9.7.0 deklaruje niezgodność z React 19.3 używanym w projekcie. Nie zastosowano `--force` ani `--legacy-peer-deps`. Zgodność sceny jest dodatkowo sprawdzana rendererem testowym.

Motion i Lenis już istniały w projekcie; nie dodano drugiej biblioteki animacji. Cała animacja działa po stronie urządzenia użytkownika, nie korzysta z rdzeni VPS do renderowania WebGL.
