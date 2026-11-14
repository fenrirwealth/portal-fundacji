import OdswiezStatusy from "../ui/OdswiezStatusy";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { db, aktywnaEdycja, formatujTermin } from "../../lib/db";
import { zwolnijWygasle } from "../api/rezerwacja/route";
import Akcje from "./Akcje";
import Link from "next/link";
import { TELEFON_FUNDACJI, TELEFON_HREF, terminPL, LIMIT_AKTYWNYCH_LISTOW } from "../../lib/zasady-akcji.mjs";
import UdostepnijMarzenie from "../listy/[id]/UdostepnijMarzenie";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moje listy",
  robots: { index: false, follow: false },
};

const OPISY = {
  OCZEKUJE: "Zarezerwowany · czekamy na rozmowę",
  POTWIERDZONA: "Zarezerwowany · czekamy na paczkę",
  DOSTARCZONA: "Fundacja przyjęła paczkę",
  WYGASLA: "Wygasła",
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
      // Z listu bierzemy wylacznie pola jawne — ta strona nie moze byc
      // furtka do danych, ktorych nie pokazujemy publicznie.
      list: { select: { id: true, numer: true, imie: true, wiek: true, marzenie: true, status: true } },
    },
  });

  const aktywne = rezerwacje.filter((r) => ["OCZEKUJE", "POTWIERDZONA"].includes(r.status));
  const nowa = aktywne.find((r) => r.id === p.nowa);

  return (
    <div className="wrap sekcja">
      <OdswiezStatusy />
      <h1 style={{ fontSize: "var(--t-3xl)" }}>Moje listy</h1>

      {nowa && (
        <div className="karta-mikolaja" role="status" style={{ margin: "var(--o-5) 0" }}>
          <span className="karta-mikolaja-gwiazda" aria-hidden="true">✦</span>
          <div>
            <h2>Dziękujemy! List nr {nowa.list.numer} jest zarezerwowany.</h2>
            <p>To pierwszy krok do spełnienia dziecięcego marzenia. Poniżej znajdziesz informacje o tym, co zrobić dalej.</p>
            <div style={{ maxWidth: 340, marginTop: "var(--o-4)" }}>
              <UdostepnijMarzenie listId={nowa.list.id} imie={nowa.list.imie} wolny={false} />
            </div>
          </div>
        </div>
      )}

      <p className="czytanie cichy" style={{ marginTop: "var(--o-3)" }}>
        Możesz mieć do {LIMIT_AKTYWNYCH_LISTOW} aktywnych rezerwacji jednocześnie. Obecnie: {aktywne.length}/{LIMIT_AKTYWNYCH_LISTOW}. Po potwierdzeniu masz czas
        {termin ? " do " + termin : ""} na dostarczenie prezentu do siedziby
        fundacji.
      </p>

      {aktywne.filter((r) => r.status === "OCZEKUJE").map((r) => <section className="kontakt-rezerwacji" key={r.id}>
        <h2>Teraz zadzwoń do Fundacji</h2>
        <p>W sprawie listu nr {r.list.numer} zadzwoń pod <a href={TELEFON_HREF}><b>{TELEFON_FUNDACJI}</b></a>.</p>
        <p>Uzgodnij szczegóły do <b>{terminPL(r.wygasa)}</b>. Fundacja musi potwierdzić rozmowę w tym terminie — inaczej rezerwacja wygaśnie, a list wróci do puli.</p>
        <a className="btn" href={TELEFON_HREF}>Zadzwoń do Fundacji</a>
      </section>)}

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
                <td data-etykieta="Dziecko"><b>{r.list.imie}</b>, {r.list.wiek} lat<br /><span className="drobny">List nr {r.list.numer}</span></td>
                <td data-etykieta="Marzenie">{r.list.marzenie}</td>
                <td data-etykieta="Status">
                  <span className={"plakietka " + (r.status === "DOSTARCZONA" ? "plakietka-wolny" : ["OCZEKUJE", "POTWIERDZONA"].includes(r.status) ? "plakietka-gotowy" : "plakietka-zajety")}>
                    {r.status === "DOSTARCZONA" && r.list.status === "PRZEKAZANY"
                      ? "Prezent przekazany placówce"
                      : OPISY[r.status] || r.status}
                  </span>
                  {r.status === "POTWIERDZONA" && (
                    <p className="drobny cichy">Dziękujemy za rezerwację! Czekamy na dostarczenie paczki zgodnie z ustaleniami.</p>
                  )}
                </td>
                <td data-etykieta="Termin">
                  {r.status === "OCZEKUJE"
                    ? "kontakt do " + terminPL(r.wygasa)
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
