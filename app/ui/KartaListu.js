import Link from "next/link";
// Karta listu — komponent wspoldzielony przez liste i wyniki wyszukiwania.
//
// Obszar zdjecia ma STALE proporcje 4:3 niezaleznie od tego, czy zdjecie
// juz jest. Dzieki temu uklad nie skacze, gdy administrator dogra
// fotografie, a szkielet ladowania ma te same wymiary co tresc docelowa.
//
// Gdy zdjecia nie ma, pokazujemy kartke z numerem listu zamiast udawac
// pismo odreczne fontem — imitacja przy prawdziwych skanach obok
// wygladalaby falszywie.

const OPISY_STATUSU = {
  OPUBLIKOWANY: ["Czeka na darczyńcę", "plakietka-wolny"],
  ZAREZERWOWANY: ["Zarezerwowany", "plakietka-zajety"],
  OPLACONY: ["Prezent dostarczony", "plakietka-gotowy"],
  PRZEKAZANY: ["Prezent przekazany", "plakietka-gotowy"],
};

/**
 * @param {object} p
 * @param {{id: string, numer: number, imie: string, wiek: number, wojewodztwo: string,
 *          kategoria: string, marzenie: string, rozmiar?: string|null,
 *          zdjecieUrl?: string|null, status: string}} p.list
 */
export default function KartaListu({ list }) {
  const [opis, klasa] = OPISY_STATUSU[list.status] || ["", "plakietka-zajety"];
  const wolny = list.status === "OPUBLIKOWANY";

  return (
    <Link
      className="karta karta-listu"
      href={`/listy/${list.id}`}
      aria-label={`List od ${list.imie}, ${list.wiek} lat. ${opis}.`}
    >
      <div className="karta-listu-zdjecie">
        {list.zdjecieUrl ? (
          <img src={list.zdjecieUrl} alt={`Zdjęcie listu napisanego przez ${list.imie}`} loading="lazy" />
        ) : (
          <div className="karta-listu-zastepnik" aria-hidden="true">
            <span>list nr {list.numer}</span>
          </div>
        )}
        <span className={"plakietka " + klasa} style={{ position: "absolute", top: "var(--o-3)", left: "var(--o-3)" }}>
          {opis}
        </span>
      </div>

      <div className="karta-tresc">
        <h3 style={{ fontSize: "var(--t-lg)" }}>
          {list.imie}, {list.wiek} {list.wiek === 1 ? "rok" : "lat"}
        </h3>
        <p className="drobny cichy" style={{ margin: "var(--o-1) 0 var(--o-3)" }}>
          woj. {list.wojewodztwo.toLowerCase()} · {list.kategoria.toLowerCase()}
          {list.rozmiar ? ` · rozmiar ${list.rozmiar}` : ""}
        </p>
        <p className="maly" style={{ margin: 0 }}>{list.marzenie}</p>
        {wolny && <span className="karta-listu-akcja" aria-hidden="true">Zobacz list →</span>}
      </div>
    </Link>
  );
}
