import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
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
  OPUBLIKOWANY: ["Czeka na Mikołaja", "plakietka-wolny"],
  ZAREZERWOWANY: ["Ma już Mikołaja", "plakietka-zajety"],
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
  return (
    <article className="karta-listu">
      <div className="karta-listu-poswiata" aria-hidden="true" />
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
        <span className="karta-listu-ikona" aria-hidden="true"><Mail /></span>
        <div className="karta-listu-meta">
          <h3>{list.imie}</h3>
          <p>Wiek: {list.wiek} {list.wiek === 1 ? "rok" : "lat"}</p>
        </div>
        <p className="karta-listu-szczegoly">
          woj. {list.wojewodztwo.toLowerCase()} · {list.kategoria.toLowerCase()}
          {list.rozmiar ? ` · rozmiar ${list.rozmiar}` : ""}
        </p>
        <p className="karta-listu-marzenie">„{list.marzenie}”</p>
        <Link
          className="karta-listu-akcja"
          href={`/listy/${list.id}`}
          aria-label={`Otwórz list od ${list.imie}, ${list.wiek} lat. ${opis}.`}
        >
          <span>Otwórz ten list</span><ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
