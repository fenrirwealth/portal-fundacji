import { notFound } from "next/navigation";
import { listPubliczny, aktywnaEdycja, formatujTermin } from "../../../lib/db";
import { zwolnijWygasle } from "../../api/rezerwacja/route";
import PrzyciskRezerwacji from "./PrzyciskRezerwacji";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const p = await params;
  const list = await listPubliczny(p.id);
  if (!list) return { title: "Nie znaleziono listu" };
  return {
    title: "List od " + list.imie + ", " + list.wiek + " lat",
    description: "Marzenie: " + list.marzenie + ". Sprawdz, jak przekazac prezent.",
    // Pojedynczy list NIE trafia do wyszukiwarek. Strona zbiorcza wystarczy
    // do promocji akcji, a indeksowanie kart dzieci zostawialoby je w cache
    // Google jeszcze dlugo po zakonczeniu edycji i po ewentualnym wycofaniu.
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

  return (
    <div className="wrap sekcja">
      <a className="wroc" href="/listy">&larr; Wroc do listow</a>

      <div className="szczegol">
        <div className="skan">
          <div className="linie" />
          {list.zdjecieUrl ? (
            <img
              src={list.zdjecieUrl}
              alt={"Odreczny list od " + list.imie + ", " + list.wiek + " lat"}
              style={{ position: "relative", borderRadius: 3 }}
            />
          ) : (
            <>
              <div className="pismo">{list.opis || list.marzenie}</div>
              <div className="podpis">{list.imie}</div>
            </>
          )}
        </div>

        <div className="panel">
          <h1>{list.imie}, {list.wiek} lat</h1>
          <div className="meta">
            woj. {list.wojewodztwo.toLowerCase()} · {list.kategoria.toLowerCase()}
          </div>

          <p style={{ fontSize: 15, marginTop: 12 }}>
            <b>Marzenie:</b> {list.marzenie}
          </p>
          {list.rozmiar && (
            <p style={{ fontSize: 14 }}><b>Rozmiar:</b> {list.rozmiar}</p>
          )}

          <div className="info">
            Nie musisz kupowac wszystkiego z listu. Liczy sie gest, nie kwota.
          </div>

          <PrzyciskRezerwacji listId={list.id} wolny={wolny} status={list.status} />

          <div className="zasady">
            Po rezerwacji masz 3 dni na potwierdzenie. Po tym czasie list
            wraca do puli. Prezent dostarczasz do siedziby fundacji
            {termin ? " do " + termin : " w terminie podanym w regulaminie akcji"},
            nieowiniety: sprawdzamy zawartosc i pakujemy sami.
          </div>
        </div>
      </div>
    </div>
  );
}
