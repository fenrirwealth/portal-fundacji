import { db } from "../../lib/db";
import { wymagajRedakcji } from "../../lib/admin";
import { rozpatrzZgloszenie, utworzEdycje } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel redakcji", robots: { index: false, follow: false } };

const etykiety = {
  SZKIC: "Szkic",
  DO_POPRAWY: "Do poprawy",
  OPUBLIKOWANY: "Opublikowany",
  ZAREZERWOWANY: "Zarezerwowany",
  OPLACONY: "Prezent przyjety",
  PRZEKAZANY: "Przekazany",
  WYCOFANY: "Wycofany",
};

export default async function Admin({ searchParams }) {
  const konto = await wymagajRedakcji();
  const p = (await searchParams) || {};

  const [edycja, zgloszenia, listy] = await Promise.all([
    db.edycjaAkcji.findFirst({ where: { aktywna: true } }),
    db.udzialPlacowki.findMany({
      where: { status: "ZGLOSZONA" },
      include: { placowka: { select: { nazwa: true, wojewodztwo: true } }, edycja: { select: { rok: true } } },
      orderBy: { utworzony: "asc" },
      take: 30,
    }),
    db.list.findMany({
      include: { placowka: { select: { nazwa: true } } },
      orderBy: { zaktualizowany: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="wrap sekcja">
      <h1 className="tytul">Panel redakcji</h1>
      <p className="wstep">Zalogowano jako {konto.email} ({konto.rola}).</p>

      {p.blad && <p className="blad" role="alert">{p.blad}</p>}
      {p.sukces && <p className="info" role="status">Operacja zakonczona poprawnie.</p>}

      <section style={{ marginTop: 32 }}>
        <h2>Aktywna edycja</h2>
        {edycja ? (
          <p className="wstep">
            <b>{edycja.nazwa}</b> ({edycja.rok}), termin dostarczenia:{" "}
            {edycja.terminDostarczenia.toLocaleDateString("pl-PL")}.
          </p>
        ) : (
          <p className="blad">Brak aktywnej edycji. Publiczne listy i formularz placowek sa wstrzymane.</p>
        )}

        <details style={{ marginTop: 16 }}>
          <summary>Utworz nowa edycje</summary>
          <form action={utworzEdycje} className="formularz-admin">
            <label>Rok<input name="rok" type="number" min="2022" max="2100" required /></label>
            <label>Nazwa<input name="nazwa" required placeholder="Listy do Swietego Mikolaja 2026" /></label>
            <label>Start<input name="dataStart" type="date" required /></label>
            <label>Koniec<input name="dataKoniec" type="date" required /></label>
            <label>Termin dostarczenia<input name="terminDostarczenia" type="date" required /></label>
            <label className="checkbox"><input name="aktywna" type="checkbox" /> Ustaw od razu jako aktywna</label>
            <button className="btn" type="submit">Utworz edycje</button>
          </form>
        </details>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Zgloszenia placowek ({zgloszenia.length})</h2>
        {zgloszenia.length === 0 ? <p className="wstep">Brak nowych zgloszen.</p> : (
          <div className="tabela-przewijana"><table className="tabela">
            <thead><tr><th>Placowka</th><th>Kontakt z wniosku</th><th>Dzieci</th><th>Decyzja</th></tr></thead>
            <tbody>{zgloszenia.map((z) => (
              <tr key={z.id}>
                <td><b>{z.placowka.nazwa}</b><br />{z.placowka.wojewodztwo}, edycja {z.edycja.rok}</td>
                <td>{z.zgloszonaOsoba || "—"}<br />{z.zgloszonyEmail || "—"}<br />{z.zgloszonyTelefon || "—"}</td>
                <td>{z.deklarowaneDzieci ?? "—"}</td>
                <td>
                  <form action={rozpatrzZgloszenie}>
                    <input type="hidden" name="id" value={z.id} />
                    <button className="btn" name="decyzja" value="zatwierdz">Zatwierdz</button>
                    <button className="btn drugorzedny" name="decyzja" value="odrzuc">Odrzuc</button>
                  </form>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <div className="naglowek-rzad">
          <h2>Listy ({listy.length})</h2>
          <a className="btn" href="/admin/listy/nowy">Dodaj list</a>
        </div>
        {listy.length === 0 ? <p className="wstep">Nie dodano jeszcze zadnych listow.</p> : (
          <div className="tabela-przewijana"><table className="tabela">
            <thead><tr><th>Nr</th><th>Dziecko</th><th>Placowka</th><th>Status</th><th /></tr></thead>
            <tbody>{listy.map((l) => (
              <tr key={l.id}>
                <td>{l.numer}</td><td>{l.imie}, {l.wiek} lat</td><td>{l.placowka.nazwa}</td>
                <td>{etykiety[l.status] || l.status}</td>
                <td><a href={"/admin/listy/" + l.id}>Otworz</a></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
