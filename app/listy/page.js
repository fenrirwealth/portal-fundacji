import { listyPubliczne, licznik } from "../../lib/db";
import { zwolnijWygasle } from "../api/rezerwacja/route";
import LicznikNaZywo from "./LicznikNaZywo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Listy dzieci",
  description:
    "Dzieci z placowek opiekunczo-wychowawczych napisaly, o czym marza. Wybierz list i sprawdz, jak przekazac prezent.",
};

const KATEGORIE = [
  ["", "Wszystkie"],
  ["ZABAWKI", "Zabawki"],
  ["SPORT", "Sport"],
  ["KSIAZKI", "Ksiazki"],
  ["NAUKA", "Nauka"],
  ["UBRANIA", "Ubrania"],
];

const WIEKI = [
  ["", "Kazdy wiek"],
  ["0-7", "do 7 lat"],
  ["8-11", "8-11 lat"],
  ["12-99", "12 lat i wiecej"],
];

function etykieta(status) {
  if (status === "OPUBLIKOWANY")
    return <span className="st-wolny">Czeka na darczynce</span>;
  if (status === "ZAREZERWOWANY")
    return <span className="st-zajety">Zarezerwowany</span>;
  return <span className="st-gotowy">Prezent przekazany</span>;
}

function link(params, zmiana) {
  const p = new URLSearchParams(params);
  for (const [k, v] of Object.entries(zmiana)) {
    if (v) p.set(k, v); else p.delete(k);
  }
  const s = p.toString();
  return s ? "/listy?" + s : "/listy";
}

export default async function Listy({ searchParams }) {
  const params = (await searchParams) || {};
  const kategoria = params.kategoria || "";
  const wiek = params.wiek || "";
  const wolne = params.wolne === "1";

  // Przy kazdym wejsciu zwalniamy listy, ktorych nikt nie potwierdzil
  // w terminie. Pula jest zawsze aktualna bez zadania cyklicznego.
  await zwolnijWygasle();

  const zakres = wiek ? wiek.split("-").map(Number) : [null, null];

  const [listy, stan] = await Promise.all([
    listyPubliczne({
      kategoria: kategoria || undefined,
      wiekOd: zakres[0] || undefined,
      wiekDo: zakres[1] || undefined,
      tylkoWolne: wolne,
    }),
    licznik(),
  ]);

  return (
    <div className="wrap sekcja">
      <h1 className="tytul">Listy dzieci</h1>
      <p className="wstep">
        Kazdy list przeszedl weryfikacje placowki i fundacji. Publikujemy
        wylacznie imie, wiek i wojewodztwo — bez nazwisk, nazw placowek
        i miejscowosci.
      </p>

      <LicznikNaZywo poczatkowy={stan} />

      <div className="filtry">
        {KATEGORIE.map(([wartosc, nazwa]) => (
          <a key={wartosc || "all"} className="filtr"
             data-on={kategoria === wartosc ? "1" : "0"}
             href={link(params, { kategoria: wartosc })}>{nazwa}</a>
        ))}
        <span style={{ width: 12 }} />
        {WIEKI.map(([wartosc, nazwa]) => (
          <a key={wartosc || "any"} className="filtr"
             data-on={wiek === wartosc ? "1" : "0"}
             href={link(params, { wiek: wartosc })}>{nazwa}</a>
        ))}
        <a className="filtr" data-on={wolne ? "1" : "0"}
           href={link(params, { wolne: wolne ? "" : "1" })}>Tylko wolne</a>
        <span className="wynik">
          {listy.length === 1 ? "1 list" : listy.length + " listow"}
        </span>
      </div>

      <div className="siatka">
        {listy.length === 0 && (
          <div className="pusto">
            <h3>
              {stan.wszystkie === 0
                ? "Listy pojawia sie wkrotce"
                : "Nic nie pasuje do tych filtrow"}
            </h3>
            <p>
              {stan.wszystkie === 0
                ? "Zbieramy listy od placowek. Zajrzyj za kilka dni."
                : "Zmien wiek albo kategorie — listy czekaja gdzie indziej."}
            </p>
          </div>
        )}

        {listy.map((l) => (
          <a key={l.id} className="list" href={"/listy/" + l.id}>
            <div className="kartka">
              <div className="linie" />
              <div className="pismo">
                {(l.trescOdczytana || l.marzenie).slice(0, 96)}…
              </div>
            </div>
            <div className="tresc">
              <h3>{l.imie}, {l.wiek} lat</h3>
              <div className="meta">woj. {l.wojewodztwo.toLowerCase()}</div>
              <span className="tag">{l.kategoria.toLowerCase()}</span>
              <div style={{ marginTop: 10, fontSize: 14 }}>{l.marzenie}</div>
            </div>
            <div className="stopka-listu">{etykieta(l.status)}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
