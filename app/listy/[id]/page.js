import { notFound } from "next/navigation";
import { listPubliczny } from "../../../lib/db";
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
  };
}

export default async function Szczegol({ params }) {
  const p = await params;
  await zwolnijWygasle();

  const list = await listPubliczny(p.id);
  if (!list) notFound();

  const wolny = list.status === "OPUBLIKOWANY";

  return (
    <div className="wrap sekcja">
      <a className="wroc" href="/listy">&larr; Wroc do listow</a>

      <div className="szczegol">
        <div className="skan">
          <div className="linie" />
          {list.skanUrl ? (
            <img
              src={list.skanUrl}
              alt={"Odreczny list od " + list.imie + ", " + list.wiek + " lat"}
              style={{ position: "relative", borderRadius: 3 }}
            />
          ) : (
            <>
              <div className="pismo">{list.trescOdczytana || list.marzenie}</div>
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
            Po rezerwacji masz 3 dni na potwierdzenie — przypomnimy mailem dzien
            wczesniej. Prezent dostarczasz do siedziby fundacji do 7 grudnia,
            nieowiniety: sprawdzamy zawartosc i pakujemy sami.
          </div>
        </div>
      </div>
    </div>
  );
}
