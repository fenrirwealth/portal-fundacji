import OdswiezStatusy from "../../ui/OdswiezStatusy";
import { wiekPL } from "../../../lib/wiek.mjs";
import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import { db, listPubliczny, aktywnaEdycja, formatujTermin, WERSJA_REGULAMINU } from "../../../lib/db";
import { zwolnijWygasle } from "../../api/rezerwacja/route";
import PrzyciskRezerwacji from "./PrzyciskRezerwacji";
import Link from "next/link";
import UdostepnijMarzenie from "./UdostepnijMarzenie";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const p = await params;
  const list = await listPubliczny(p.id);
  if (!list) return { title: "Nie znaleziono listu" };
  return {
    title: `List nr ${list.numer} — ${list.imie}, ${wiekPL(list.wiek)}`,
    description: `Marzenie: ${list.marzenie}. Sprawdź, jak przekazać prezent.`,
    openGraph: {
      title: list.status === "OPUBLIKOWANY" ? `Ten list nadal czeka na Mikołaja` : `Ten list ma już swojego Mikołaja`,
      description: `${list.imie}, ${wiekPL(list.wiek)} — ${list.marzenie}`,
      images: [{ url: `/api/listy/${list.id}/story?format=og`, width: 1200, height: 630 }],
    },
    // Pojedynczy list NIE trafia do wyszukiwarek. Strona zbiorcza
    // wystarcza do promocji akcji, a indeksowanie kart dzieci
    // zostawiałoby je w pamięci podręcznej Google długo po zakończeniu
    // edycji i po ewentualnym wycofaniu listu.
    robots: { index: false, follow: true },
  };
}

export default async function Szczegol({ params }) {
  const p = await params;
  await zwolnijWygasle();

  const [list, edycja] = await Promise.all([listPubliczny(p.id), aktywnaEdycja()]);
  if (!list) notFound();

  const termin = formatujTermin(edycja?.terminDostarczenia);
  const wolny = list.status === "OPUBLIKOWANY";
  let przedRezerwacja;
  if (wolny) {
    const sesja = await auth();
    const wroc = encodeURIComponent("/listy/" + list.id);
    const konto = sesja?.user?.id && await db.user.findUnique({
      where: { id: sesja.user.id },
      select: { zgodaRegulamin: true, wersjaRegulaminu: true },
    });
    if (!konto) przedRezerwacja = "/zaloguj?wroc=" + wroc;
    else if (!konto.zgodaRegulamin || konto.wersjaRegulaminu !== WERSJA_REGULAMINU) {
      przedRezerwacja = "/regulamin?wroc=" + wroc;
    }
  }

  const rezerwacjaProps = { listId: list.id, numer: list.numer, wolny, status: list.status, przedRezerwacja };

  return (
    <div className="wrap sekcja ma-pasek-mobilny">
      <OdswiezStatusy />
      <Link className="btn btn-tekstowy" href="/listy" style={{ marginBottom: "var(--o-5)", marginLeft: "calc(var(--o-2) * -1)" }}>
        ← Wszystkie listy
      </Link>

      <div className="list-uklad">
        <figure style={{ margin: 0 }}>
          <div className="list-zdjecie">
            {list.zdjecieUrl ? (
              <img src={list.zdjecieUrl} alt={`Zdjęcie listu napisanego przez ${list.imie}, ${wiekPL(list.wiek)}`} />
            ) : (
              <div className="karta-listu-zastepnik zastepnik" aria-hidden="true">
                <span>zdjęcie listu nr {list.numer} w przygotowaniu</span>
              </div>
            )}
          </div>
          {list.opis && (
            <figcaption className="maly cichy czytanie" style={{ marginTop: "var(--o-4)" }}>
              {list.opis}
            </figcaption>
          )}
        </figure>

        <div className="panel-rezerwacji">
          <div className="karta karta-tresc">
            <p className="drobny"><strong>List nr {list.numer}</strong></p>
            <h1 style={{ fontSize: "var(--t-2xl)" }}>
              {list.imie}, {wiekPL(list.wiek)}
            </h1>
            <p className="drobny cichy" style={{ marginTop: "var(--o-2)" }}>
              {list.wojewodztwo ? `woj. ${list.wojewodztwo.toLowerCase()} · ` : ""}{list.kategoria.toLowerCase()}
            </p>

            <dl style={{ margin: "var(--o-5) 0 0", display: "grid", gap: "var(--o-4)" }}>
              <div>
                <dt className="drobny cichy">Marzenie</dt>
                <dd style={{ margin: 0, fontSize: "var(--t-lg)", fontFamily: "var(--krój-tytuł)" }}>{list.marzenie}</dd>
              </div>
              {list.rozmiar && (
                <div>
                  <dt className="drobny cichy">Rozmiar</dt>
                  <dd style={{ margin: 0 }}>{list.rozmiar}</dd>
                </div>
              )}
            </dl>

            <p className="komunikat komunikat-info maly" style={{ margin: "var(--o-5) 0" }}>
              Nie musisz kupować wszystkiego z listu. Liczy się gest, nie kwota.
            </p>

            <PrzyciskRezerwacji {...rezerwacjaProps} />
            <div style={{ marginTop: "var(--o-3)" }}>
              <UdostepnijMarzenie listId={list.id} imie={list.imie} wolny={wolny} />
            </div>

            <p className="drobny cichy" style={{ marginTop: "var(--o-5)", paddingTop: "var(--o-4)", borderTop: "1px solid var(--linia)" }}>
              Po rezerwacji zadzwoń do Fundacji: <a href="tel:+48570747779">+48 570 747 779</a>.
              Administrator musi potwierdzić rozmowę w ciągu 48 godzin od rezerwacji —
              bez tego list wróci do puli. Prezent dostarczasz do siedziby Fundacji
              {termin ? ` do ${termin}` : " w terminie podanym w regulaminie"}.
              Prosimy, zapakuj go tak, by można go było łatwo otworzyć. Sprawdzimy zawartość przed przekazaniem prezentu placówce.
            </p>
          </div>
        </div>
      </div>

      {/* Na telefonie panel przestaje być przyklejony i lądowałby pod
          długim zdjęciem — czyli najważniejszy przycisk byłby poza
          pierwszym ekranem. Pasek trzyma go zawsze w zasięgu kciuka. */}
      <div className="pasek-mobilny">
        <span className="opis">
          List nr {list.numer} · {list.imie}, {wiekPL(list.wiek)}<br />{list.marzenie}
        </span>
        <PrzyciskRezerwacji {...rezerwacjaProps} zwiezly />
      </div>
    </div>
  );
}
