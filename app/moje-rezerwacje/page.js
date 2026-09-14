import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { db, aktywnaEdycja, formatujTermin } from "../../lib/db";
import { zwolnijWygasle } from "../api/rezerwacja/route";
import Akcje from "./Akcje";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moje rezerwacje",
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
      <h1 className="tytul">Moje rezerwacje</h1>

      {p.nowa === "1" && (
        <p className="info" role="status">
          Rezerwacja przyjeta. Potwierdz ja w ciagu 3 dni — po tym czasie
          list wraca do puli.
        </p>
      )}

      <p className="wstep">
        Mozesz trzymac jeden list naraz. Po potwierdzeniu masz czas
        {termin ? " do " + termin : ""} na dostarczenie prezentu do siedziby
        fundacji.
      </p>

      {rezerwacje.length === 0 && (
        <div className="pusto" style={{ marginTop: 26 }}>
          <h3>Nie masz jeszcze rezerwacji</h3>
          <p>Wybierz list z listy dzieci — przy kazdym widac, czy jest wolny.</p>
          <p style={{ marginTop: 12 }}><a className="btn" href="/listy">Zobacz listy</a></p>
        </div>
      )}

      {rezerwacje.length > 0 && (
        <table className="tabela" style={{ marginTop: 26, width: "100%" }}>
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
                <td><b>{r.list.imie}</b>, {r.list.wiek} lat</td>
                <td>{r.list.marzenie}</td>
                <td>{OPISY[r.status] || r.status}</td>
                <td>
                  {r.status === "OCZEKUJE"
                    ? "potwierdz do " + new Date(r.wygasa).toLocaleDateString("pl-PL")
                    : r.status === "POTWIERDZONA"
                      ? (termin ? "prezent do " + termin : "prezent w terminie akcji")
                      : "—"}
                </td>
                <td style={{ textAlign: "right" }}>
                  <Akcje id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {aktywne.length === 0 && rezerwacje.length > 0 && (
        <p style={{ marginTop: 18 }}>
          <a href="/listy">Wybierz kolejny list</a>
        </p>
      )}
    </div>
  );
}
