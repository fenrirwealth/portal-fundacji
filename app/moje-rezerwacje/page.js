import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { db, aktywnaEdycja, formatujTermin } from "../../lib/db";
import { zwolnijWygasle } from "../api/rezerwacja/route";
import Akcje from "./Akcje";
import Link from "next/link";
import UdostepnijMarzenie from "../listy/[id]/UdostepnijMarzenie";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moje listy",
  robots: { index: false, follow: false },
};

const OPISY = {
  OCZEKUJE: "Wymaga potwierdzenia",
  POTWIERDZONA: "Potwierdzona",
  DOSTARCZONA: "Prezent dostarczony",
  WYGASLA: "Wygasla",
  ANULOWANA: "Anulowana",
};

export default async function MojeRezerwacje({ searchParams }) {
  const sesja = await auth();
  if (!sesja?.user?.id) redirect("/zaloguj?wroc=/moje-rezerwacje");

  const p = (await searchParams) || {};
  await zwolnijWygasle();

  const edycja = await aktywnaEdycja();
  const termin = formatujTermin(edycja?.terminDostarczenia);

  const rezerwacje = await db.rezerwacja.findMany({
    where: { userId: sesja.user.id },
    orderBy: { utworzona: "desc" },
    select: {
      id: true,
      status: true,
      wygasa: true,
      potwierdzona: true,
      // Z listu bierzemy wylacznie pola jawne — ta strona nie moze byc
      // furtka do danych, ktorych nie pokazujemy publicznie.
      list: { select: { id: true, imie: true, wiek: true, marzenie: true } },
    },
  });

  const aktywne = rezerwacje.filter((r) => ["OCZEKUJE", "POTWIERDZONA"].includes(r.status));

  return (
    <div className="wrap sekcja">
      <h1 style={{ fontSize: "var(--t-3xl)" }}>Moje listy</h1>

      {p.nowa === "1" && (
        <div className="karta-mikolaja" role="status" style={{ margin: "var(--o-5) 0" }}>
          <span className="karta-mikolaja-gwiazda" aria-hidden="true">✦</span>
          <div>
            <h2>Ten list ma już Mikołaja. Ciebie.</h2>
            <p>Potwierdź wybór w ciągu 3 dni, a potem zaproś innych do Łańcucha Dobra.</p>
            {aktywne[0] && (
              <div style={{ maxWidth: 340, marginTop: "var(--o-4)" }}>
                <UdostepnijMarzenie listId={aktywne[0].list.id} imie={aktywne[0].list.imie} wolny={false} />
              </div>
            )}
          </div>
        </div>
      )}

      <p className="czytanie cichy" style={{ marginTop: "var(--o-3)" }}>
        Możesz wybrać jeden list naraz. Po potwierdzeniu masz czas
        {termin ? " do " + termin : ""} na dostarczenie prezentu do siedziby
        fundacji.
      </p>

      {rezerwacje.length === 0 && (
        <div className="pusto" style={{ marginTop: "var(--o-6)" }}>
          <h3>Nie masz jeszcze wybranego listu</h3>
          <p>Wybierz list z listy dzieci — przy każdym widać, czy jest jeszcze wolny.</p>
          <Link className="btn" href="/listy" style={{ marginTop: "var(--o-4)" }}>Zobacz listy dzieci</Link>
        </div>
      )}

      {rezerwacje.length > 0 && (
        <div className="karta" style={{ marginTop: "var(--o-6)" }}>
          <table className="tabela">
          <thead>
            <tr>
              <th>Dziecko</th>
              <th>Marzenie</th>
              <th>Status</th>
              <th>Termin</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rezerwacje.map((r) => (
              <tr key={r.id}>
                <td data-etykieta="Dziecko"><b>{r.list.imie}</b>, {r.list.wiek} lat</td>
                <td data-etykieta="Marzenie">{r.list.marzenie}</td>
                <td data-etykieta="Status">
                  <span className={"plakietka " + (r.status === "POTWIERDZONA" ? "plakietka-wolny" : r.status === "OCZEKUJE" ? "plakietka-gotowy" : "plakietka-zajety")}>
                    {OPISY[r.status] || r.status}
                  </span>
                </td>
                <td data-etykieta="Termin">
                  {r.status === "OCZEKUJE"
                    ? "potwierdz do " + new Date(r.wygasa).toLocaleDateString("pl-PL")
                    : r.status === "POTWIERDZONA"
                      ? (termin ? "prezent do " + termin : "prezent w terminie akcji")
                      : "—"}
                </td>
                <td data-etykieta="Akcje" style={{ textAlign: "right" }}>
                  <Akcje id={r.id} status={r.status} imie={r.list.imie} />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}

      {aktywne.length === 0 && rezerwacje.length > 0 && (
        <p style={{ marginTop: 18 }}>
          <Link href="/listy">Wybierz kolejny list</Link>
        </p>
      )}
    </div>
  );
}
