import { Suspense } from "react";
import { listyPubliczne, licznik, aktywnaEdycja, formatujTermin } from "../../lib/db";
import { zwolnijWygasle } from "../api/rezerwacja/route";
import LicznikNaZywo from "./LicznikNaZywo";
import KartaListu from "../ui/KartaListu";
import { SzkieletListy } from "../ui/Szkielet";
import Szukajka from "./Szukajka";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Listy dzieci",
  description:
    "Dzieci z placówek opiekuńczo-wychowawczych napisały, o czym marzą. Wybierz list i sprawdź, jak przekazać prezent.",
};

const KATEGORIE = [
  ["", "Wszystkie"], ["ZABAWKI", "Zabawki"], ["SPORT", "Sport"],
  ["KSIAZKI", "Książki"], ["NAUKA", "Nauka"], ["UBRANIA", "Ubrania"], ["INNE", "Inne"],
];

const WIEKI = [
  ["", "Każdy wiek"], ["0-7", "do 7 lat"], ["8-11", "8–11 lat"], ["12-99", "12 lat i więcej"],
];

function link(params, zmiana) {
  const p = new URLSearchParams(params);
  for (const [k, v] of Object.entries(zmiana)) {
    if (v) p.set(k, v); else p.delete(k);
  }
  const s = p.toString();
  return s ? "/listy?" + s : "/listy";
}

async function Wyniki({ params }) {
  const kategoria = params.kategoria || "";
  const wiek = params.wiek || "";
  const wolne = params.wolne === "1";
  const szukaj = (params.szukaj || "").trim().toLowerCase().slice(0, 60);

  // Przy każdym wejściu zwalniamy listy, których nikt nie potwierdził
  // w terminie — pula jest aktualna bez osobnego zadania cyklicznego.
  await zwolnijWygasle();

  const zakres = wiek ? wiek.split("-").map(Number) : [null, null];

  let listy = await listyPubliczne({
    kategoria: kategoria || undefined,
    wiekOd: zakres[0] || undefined,
    wiekDo: zakres[1] || undefined,
    tylkoWolne: wolne,
  });

  // Wyszukiwanie po danych, które i tak są publiczne: imię, marzenie,
  // opis. Świadomie po stronie serwera na już pobranym zbiorze — przy
  // skali kilkuset listów to szybsze niż zapytanie z LIKE, a nie
  // wymaga rozszerzeń pełnotekstowych w bazie.
  if (szukaj) {
    listy = listy.filter((l) =>
      [l.imie, l.marzenie, l.opis].filter(Boolean).join(" ").toLowerCase().includes(szukaj)
    );
  }

  const cos = listy.length > 0;
  const stan = await licznik();

  return (
    <>
      <p className="maly cichy" role="status" style={{ marginBottom: "var(--o-4)" }}>
        {cos
          ? `Pokazujemy ${listy.length} z ${stan.wszystkie} listów`
          : stan.wszystkie === 0 ? "" : "Żaden list nie pasuje do wybranych filtrów"}
      </p>

      <div className="siatka siatka-listy">
        {cos && listy.map((l) => <KartaListu key={l.id} list={l} />)}

        {!cos && (
          <div className="pusto">
            <h3>{stan.wszystkie === 0 ? "Listy pojawią się wkrótce" : "Nic tu nie ma przy tych filtrach"}</h3>
            <p>
              {stan.wszystkie === 0
                ? "Zbieramy listy od placówek opiekuńczo-wychowawczych. Każdy przechodzi weryfikację, zanim trafi na stronę."
                : "Spróbuj zmienić wiek, kategorię albo wyczyścić wyszukiwanie."}
            </p>
            {stan.wszystkie > 0 && (
              <Link className="btn btn-cichy" href="/listy" style={{ marginTop: "var(--o-4)" }}>
                Wyczyść filtry
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default async function Listy({ searchParams }) {
  const params = (await searchParams) || {};
  const kategoria = params.kategoria || "";
  const wiek = params.wiek || "";
  const wolne = params.wolne === "1";

  const [stan, edycja] = await Promise.all([licznik(), aktywnaEdycja()]);
  const klucz = JSON.stringify(params);

  return (
    <div className="wrap sekcja">
      <header style={{ marginBottom: "var(--o-6)" }}>
        <h1 style={{ fontSize: "var(--t-3xl)" }}>Listy dzieci</h1>
        <p className="czytanie cichy" style={{ marginTop: "var(--o-3)" }}>
          Każdy list przeszedł weryfikację placówki i Fundacji. Publikujemy imię,
          wiek, województwo, opis marzenia i kategorię prezentu, w razie potrzeby
          rozmiar, oraz zdjęcie listu przygotowane przez Fundację. Nie publikujemy
          nazwisk, nazwy placówki, miejscowości, adresu ani wizerunku dziecka.
        </p>
      </header>

      <LicznikNaZywo poczatkowy={stan} termin={formatujTermin(edycja?.terminDostarczenia)} />

      <section aria-label="Filtry" style={{ margin: "var(--o-6) 0 var(--o-5)" }}>
        <Szukajka poczatkowa={params.szukaj || ""} />

        <div className="filtry" style={{ marginTop: "var(--o-4)" }}>
          <div className="filtry-grupa">
            {KATEGORIE.map(([w, n]) => (
              <Link key={w || "all"} className="filtr" aria-pressed={kategoria === w}
                 href={link(params, { kategoria: w })}>{n}</Link>
            ))}
          </div>
          <div className="filtry-grupa">
            {WIEKI.map(([w, n]) => (
              <Link key={w || "any"} className="filtr" aria-pressed={wiek === w}
                 href={link(params, { wiek: w })}>{n}</Link>
            ))}
          </div>
          <div className="filtry-grupa">
            <Link className="filtr" aria-pressed={wolne} href={link(params, { wolne: wolne ? "" : "1" })}>
              Tylko wolne
            </Link>
          </div>
        </div>
      </section>

      {/* Suspense z szkieletem: przy wolnym łączu użytkownik widzi układ
          docelowy zamiast pustej strony, a wymiary się zgadzają, więc nic
          nie przeskakuje po wczytaniu. */}
      <Suspense key={klucz} fallback={<SzkieletListy />}>
        <Wyniki params={params} />
      </Suspense>
    </div>
  );
}
