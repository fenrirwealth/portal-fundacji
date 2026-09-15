# Portal „Listy do Świętego Mikołaja” — architektura

## Drzewo informacji

- `/` — stan akcji, hero, Żywy Łańcuch Dobra, wyjaśnienie procesu
- `/listy` — wyszukiwarka i filtrowanie bezpiecznie opublikowanych listów
- `/listy/[id]` — szczegóły marzenia, wybór listu i generator Stories
- `/listy/losowy` — „Niech list wybierze mnie”, losuje wyłącznie wolny list
- `/o-akcji` — zasady, bezpieczeństwo i rola Fundacji
- `/moje-rezerwacje` — prywatny stan wybranego listu i karta „Mam już Mikołaja”
- `/zaloguj` — logowanie bez hasła przez zweryfikowany adres e-mail
- `/regulamin` — wersjonowana zgoda na zasady akcji
- `/zglos-placowke` — zgłoszenie instytucji bez przekazywania danych dzieci
- `/admin` — odseparowany panel redakcyjny

## Warstwy aplikacji

1. **Publiczny frontend**: Next.js App Router, komponenty serwerowe dla treści i klientowe tylko dla animacji, udostępniania oraz SSE.
2. **Warstwa doświadczenia**: Motion do wejść, Lenis tylko na desktopie, Three.js ładowany dynamicznie. Telefon, `Save-Data` i `prefers-reduced-motion` otrzymują lekką wersję CSS.
3. **Domena**: funkcje z `lib/db.js` zwracają wyłącznie białą listę pól publicznych i tylko listy po pełnej weryfikacji.
4. **Transakcje**: rezerwacja najpierw atomowo zmienia status listu. Dwa częściowe indeksy PostgreSQL pilnują jednego aktywnego listu na konto i jednej aktywnej rezerwacji danego listu.
5. **Cache**: Redis przechowuje wyłącznie publiczny licznik przez 15 sekund. Awaria Redisa nie blokuje działania — aplikacja wraca do PostgreSQL.
6. **Media viralowe**: `/api/listy/[id]/story` generuje format 1080×1920 lub Open Graph 1200×630 z zatwierdzonego opisu, bez skanu i danych placówki.

## Mechaniki udostępniania

- **Udostępnij marzenie** — natywne Web Share API przekazuje gotowy plik PNG; na desktopie grafika jest pobierana, a link kopiowany.
- **Ten list ma już Mikołaja** — po wyborze pojawia się osobna karta sukcesu i wariant Stories kierujący do pozostałych listów.
- **Niech list wybierze mnie** — losowanie wyłącznie z publicznych, wolnych listów aktywnej edycji.
- **Żywy Łańcuch Dobra** — rzeczywiste dane przez SSE: wszystkie listy, mają Mikołaja, czekają i procent realizacji.

Etap „Zaproś trzech Mikołajów” wymaga osobnej zgody na analitykę linków polecających i polityki retencji. Nie został potajemnie uruchomiony: portal nie powinien tworzyć profili poleceń bez opisania tego w regulaminie i informacji o prywatności.

## Budżet wydajności

- brak wymuszonego ekranu ładowania,
- Three.js nie wchodzi do głównego renderu i nie ładuje się na telefonie,
- maksymalny `devicePixelRatio` WebGL: 1.7,
- animacja zatrzymuje się po ukryciu karty,
- obrazy Stories są cache'owane na brzegu przez 5 minut,
- fonty są dostarczane lokalnie, bez żądania do Google Fonts.

## VPS 6 vCPU / 12 GB RAM

`docker-compose.production.yml` ustawia:

- portal: 3 procesy `node:cluster`, limit 4 GB RAM i 3.5 CPU,
- PostgreSQL: limit 4 GB, `shared_buffers=1GB`, `effective_cache_size=3GB`,
- Redis: limit 512 MB i cache LRU 384 MB,
- około 3.5 GB pozostaje dla systemu, proxy, cache dyskowego i skoków obciążenia.

W Coolify można zachować zarządzany PostgreSQL i Redis jako osobne zasoby. Plik Compose jest wariantem dla instalacji samodzielnej; nie zawiera żadnego hasła.

## Wdrożenie

1. Skopiuj `.env.example` do bezpiecznej konfiguracji środowiska i ustaw prawdziwe sekrety.
2. Nie zapisuj `.env` w repozytorium.
3. Uruchom `docker compose --env-file .env.production -f docker-compose.production.yml up -d --build`.
4. Punkt wejścia wykona `prisma migrate deploy` przed uruchomieniem klastra Node.js.
5. Sprawdź `/api/zdrowie`, logowanie, wybór listu, anulowanie i generator Stories.
6. Ciężkie przyszłe tekstury trzymaj za CDN z wersjonowanymi nazwami i długim `Cache-Control`; nie wkładaj do obrazu Dockera surowych skanów listów.
