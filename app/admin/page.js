import { wiekPL } from "../../lib/wiek.mjs";
import Link from "next/link";
import { db } from "../../lib/db";
import { wymagajRedakcji } from "../../lib/admin";
import { moderujSkan, odnowLinkPlacowki, rozpatrzZgloszenie, utworzEdycje, potwierdzKontaktTelefoniczny } from "./actions";
import { zwolnijWygasle } from "../api/rezerwacja/route";
import { terminPL } from "../../lib/zasady-akcji.mjs";
import SzybkieAkcje from "./ui/SzybkieAkcje";
import MiniaturaListu from "./ui/MiniaturaListu";
import Status, { ETYKIETY } from "./ui/Status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel zarządzania listami", robots: { index: false, follow: false } };

// Filtry jako odnosniki z parametrami, nie stan w przegladarce: kazdy
// widok ma wlasny adres, wiec da sie go wyslac wspolpracownikowi
// i dziala przycisk wstecz.
const STATUSY = ["SZKIC", "DO_POPRAWY", "OPUBLIKOWANY", "ZAREZERWOWANY", "OPLACONY", "PRZEKAZANY"];

function link(params, zmiana) {
  const p = new URLSearchParams(params);
  for (const [k, v] of Object.entries(zmiana)) {
    if (v) p.set(k, v); else p.delete(k);
  }
  const s = p.toString();
  return s ? "/admin?" + s : "/admin";
}

export default async function Admin({ searchParams }) {
  const konto = await wymagajRedakcji();
  await zwolnijWygasle();
  const p = (await searchParams) || {};

  const filtrStatus = STATUSY.includes(p.status) || p.status === "WYCOFANY" ? p.status : "";
  const szukaj = String(p.szukaj || "").trim().slice(0, 60);
  const archiwum = p.archiwum === "1";

  const [edycja, zgloszenia, placowkiAkcji, skany, listy, liczby] = await Promise.all([
    db.edycjaAkcji.findFirst({ where: { aktywna: true } }),
    db.udzialPlacowki.findMany({
      where: { status: "ZGLOSZONA" },
      include: { placowka: { select: { nazwa: true, wojewodztwo: true } }, edycja: { select: { rok: true } } },
      orderBy: { utworzony: "asc" },
      take: 30,
    }),
    db.udzialPlacowki.findMany({
      where: { status: "POTWIERDZILA", edycja: { aktywna: true } },
      include: { placowka: { select: { nazwa: true } }, _count: { select: { skany: true } } },
      orderBy: { placowka: { nazwa: "asc" } },
      take: 100,
    }),
    db.skanListu.findMany({
      where: { status: { in: ["NOWY", "W_MODERACJI"] }, list: null },
      include: { udzial: { include: { placowka: { select: { nazwa: true } } } } },
      orderBy: { utworzony: "asc" },
      take: 50,
    }),
    db.list.findMany({
      where: {
        // Archiwum ukryte domyslnie. Wycofane listy zostaja w bazie —
        // to zapis decyzji, nie smiec — ale nie zasmiecaja biezacej pracy.
        ...(filtrStatus ? { status: filtrStatus } : archiwum ? {} : { status: { not: "WYCOFANY" } }),
        ...(szukaj
          ? {
              OR: [
                { imie: { contains: szukaj, mode: "insensitive" } },
                { marzenie: { contains: szukaj, mode: "insensitive" } },
                { placowka: { nazwa: { contains: szukaj, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { placowka: { select: { nazwa: true } }, weryfikacja: { select: { zakonczona: true } } },
      orderBy: { zaktualizowany: "desc" },
      take: 100,
    }),
    db.list.groupBy({ by: ["status"], _count: true }),
  ]);

  const kontakty = await db.rezerwacja.findMany({
    where: { status: "OCZEKUJE", wygasa: { gt: new Date() }, list: { edycja: { aktywna: true } } },
    select: { id: true, wygasa: true, telefonKontaktowy: true, user: { select: { email: true } }, list: { select: { id: true, numer: true, imie: true } } },
    orderBy: { wygasa: "asc" }, take: 100,
  });

  const licznik = Object.fromEntries(liczby.map((l) => [l.status, l._count]));
  const wszystkich = liczby.reduce((s, l) => s + l._count, 0);

  return (
    <div className="wrap sekcja"><Link className="btn btn-tekstowy" href="/admin/haslo">Ustaw hasło do panelu</Link>
      <div className="naglowek-rzad">
        <div>
          <h1 className="tytul">Panel zarządzania listami</h1>
          <p className="wstep">Zalogowano jako {konto.email} ({konto.rola}).</p>
        </div>
        <Link className="btn" href="/admin/listy/nowy">Dodaj list</Link>
      </div>

      {p.blad && <p className="blad" role="alert">{p.blad}</p>}
      {p.sukces && <p className="info" role="status">{p.sukces === "reczna" ? "List oznaczony jako zarezerwowany przez Fundację." : p.sukces === "usuniety" ? "List usunięty ze strony i przeniesiony do archiwum." : "Operacja zakończona poprawnie."}</p>}

      <section className="kontakt-rezerwacji">
        <h2>Rezerwacje czekające na kontakt telefoniczny ({kontakty.length})</h2>
        <p className="drobny cichy">Potwierdź dopiero po rozmowie z darczyńcą. Bez potwierdzenia rezerwacja wygasa po 48 godzinach.</p>
        {kontakty.length === 0 ? <p>Wszystkie bieżące kontakty są obsłużone.</p> : <div className="tabela-przewijana"><table className="tabela">
          <thead><tr><th>List</th><th>Darczyńca</th><th>Potwierdź do</th><th>Kontakt</th></tr></thead>
          <tbody>{kontakty.map((r) => <tr key={r.id}>
            <td><Link href={`/admin/listy/${r.list.id}`}>Nr {r.list.numer} · {r.list.imie}</Link></td>
            <td>
              {r.user.email}<br />
              {r.telefonKontaktowy
                ? <a href={`tel:${r.telefonKontaktowy}`}>{r.telefonKontaktowy}</a>
                : <span className="drobny cichy">Brak numeru telefonu</span>}
            </td>
            <td>{terminPL(r.wygasa)}</td>
            <td><form action={potwierdzKontaktTelefoniczny}><input type="hidden" name="rezerwacjaId" value={r.id} /><button className="btn" type="submit">Kontakt telefoniczny odbył się</button></form></td>
          </tr>)}</tbody>
        </table></div>}
      </section>

      <section style={{ marginTop: "var(--o-7)" }}>
        <h2 style={{ fontSize: "var(--t-xl)" }}>Aktywna edycja</h2>
        {edycja ? (
          <p className="wstep" style={{ marginTop: "var(--o-2)" }}>
            <b>{edycja.nazwa}</b> ({edycja.rok}), termin dostarczenia:{" "}
            {edycja.terminDostarczenia.toLocaleDateString("pl-PL")}.
          </p>
        ) : (
          <p className="blad">Brak aktywnej edycji. Publiczne listy i formularz placówek są wstrzymane.</p>
        )}

        <details style={{ marginTop: "var(--o-4)" }}>
          <summary className="btn drugorzedny" style={{ display: "inline-flex" }}>Utwórz nową edycję</summary>
          <form action={utworzEdycje} className="formularz-admin">
            <label>Rok<input name="rok" type="number" min="2022" max="2100" required /></label>
            <label>Nazwa<input name="nazwa" required placeholder="Listy do Świętego Mikołaja 2026" /></label>
            <label>Start<input name="dataStart" type="date" required /></label>
            <label>Koniec<input name="dataKoniec" type="date" required /></label>
            <label>Termin dostarczenia<input name="terminDostarczenia" type="date" required /></label>
            <label className="checkbox"><input name="aktywna" type="checkbox" /> <span>Ustaw od razu jako aktywną</span></label>
            <button className="btn" type="submit">Utwórz edycję</button>
          </form>
        </details>
      </section>

      {placowkiAkcji.length > 0 && (
        <section style={{ marginTop: "var(--o-8)" }}>
          <h2 style={{ fontSize: "var(--t-xl)" }}>Placówki w aktywnej edycji</h2>
          <div className="tabela-przewijana"><table className="tabela">
            <thead><tr><th>Placówka</th><th>Skany</th><th>Link przesyłania</th></tr></thead>
            <tbody>{placowkiAkcji.map((u) => (
              <tr key={u.id}><td><b>{u.placowka.nazwa}</b><br /><span className="drobny cichy">{u.zgloszonyEmail}</span></td>
                <td>{u._count.skany}</td><td><form action={odnowLinkPlacowki}><input type="hidden" name="id" value={u.id} /><button className="btn drugorzedny">Wyślij nowy bezpieczny link</button></form></td></tr>
            ))}</tbody>
          </table></div>
        </section>
      )}

      <section style={{ marginTop: "var(--o-8)" }}>
        <h2 style={{ fontSize: "var(--t-xl)" }}>
          Skany do moderacji {skany.length > 0 && <span className="plakietka plakietka-gotowy">{skany.length} czeka</span>}
        </h2>
        {skany.length === 0 ? (
          <p className="wstep" style={{ marginTop: "var(--o-3)" }}>Brak nowych skanów.</p>
        ) : (
          <div className="tabela-przewijana"><table className="tabela">
            <thead><tr><th>Placówka</th><th>Przesłano</th><th>Status</th><th>Akcje</th></tr></thead>
            <tbody>{skany.map((s) => (
              <tr key={s.id}>
                <td><b>{(s.udzial?.placowka?.nazwa || "Bez placówki · Fundacja")}</b></td>
                <td className="maly">{s.utworzony.toLocaleString("pl-PL")}</td>
                <td><Status status={s.status} /></td>
                <td><div className="naglowek-rzad">
                  <a className="btn drugorzedny" href={`/api/admin/skany/${s.id}`} target="_blank" rel="noreferrer">Podgląd</a>
                  <Link className="btn" href={`/admin/listy/nowy?skan=${s.id}`}>Utwórz szkic</Link>
                  <form action={moderujSkan}><input type="hidden" name="id" value={s.id} /><button className="btn niebezpieczny" name="decyzja" value="odrzuc">Odrzuć</button></form>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section style={{ marginTop: "var(--o-8)" }}>
        <h2 style={{ fontSize: "var(--t-xl)" }}>
          Zgłoszenia placówek {zgloszenia.length > 0 && <span className="plakietka plakietka-gotowy">{zgloszenia.length} czeka</span>}
        </h2>
        {zgloszenia.length === 0 ? (
          <p className="wstep" style={{ marginTop: "var(--o-3)" }}>Brak nowych zgłoszeń.</p>
        ) : (
          <div className="tabela-przewijana"><table className="tabela">
            <thead><tr><th>Placówka</th><th>Kontakt z wniosku</th><th>Dzieci</th><th>Decyzja</th></tr></thead>
            <tbody>{zgloszenia.map((z) => (
              <tr key={z.id}>
                <td><b>{z.placowka.nazwa}</b><br /><span className="drobny cichy">{z.placowka.wojewodztwo}, edycja {z.edycja.rok}</span></td>
                <td className="maly">{z.zgloszonaOsoba || "—"}<br />{z.zgloszonyEmail || "—"}<br />{z.zgloszonyTelefon || "—"}</td>
                <td>{z.deklarowaneDzieci ?? "—"}</td>
                <td>
                  <form action={rozpatrzZgloszenie} style={{ display: "flex", gap: "var(--o-2)" }}>
                    <input type="hidden" name="id" value={z.id} />
                    <button className="btn" name="decyzja" value="zatwierdz">Zatwierdź</button>
                    <button className="btn drugorzedny" name="decyzja" value="odrzuc">Odrzuć</button>
                  </form>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section id="zarzadzanie-listami" className="zarzadzanie-listami" style={{ marginTop: "var(--o-8)" }}>
        <div className="naglowek-rzad">
          <h2 style={{ fontSize: "var(--t-xl)" }}>Zarządzanie listami</h2>
          <Link className="btn" href="/admin/listy/nowy">+ Dodaj list</Link>
          <span className="drobny cichy">
            {wszystkich} w bazie · pokazujemy {listy.length}
          </span>
        </div>

        <form className="szukajka-admin" role="search">
          {filtrStatus && <input type="hidden" name="status" value={filtrStatus} />}
          {archiwum && <input type="hidden" name="archiwum" value="1" />}
          <label htmlFor="szukaj" className="tylko-dla-czytnika">Szukaj listów</label>
          <input id="szukaj" name="szukaj" type="search" className="pole-kontrolka" defaultValue={szukaj}
                 placeholder="Imię dziecka, marzenie albo nazwa placówki" maxLength={60} />
          <button className="btn drugorzedny" type="submit">Szukaj</button>
          {(szukaj || filtrStatus || archiwum) && (
            <Link className="btn btn-tekstowy" href="/admin">Wyczyść</Link>
          )}
        </form>

        <div className="filtry" style={{ marginTop: "var(--o-4)" }}>
          <div className="filtry-grupa">
            <Link className="filtr" aria-pressed={!filtrStatus && !archiwum} href={link(p, { status: "", archiwum: "" })}>
              Bieżące
            </Link>
            {STATUSY.map((s) => (
              <Link key={s} className="filtr" aria-pressed={filtrStatus === s} href={link(p, { status: s, archiwum: "" })}>
                {ETYKIETY[s]}{licznik[s] ? ` (${licznik[s]})` : ""}
              </Link>
            ))}
          </div>
          <div className="filtry-grupa">
            <Link className="filtr" aria-pressed={filtrStatus === "WYCOFANY"} href={link(p, { status: "WYCOFANY", archiwum: "" })}>
              Archiwum{licznik.WYCOFANY ? ` (${licznik.WYCOFANY})` : ""}
            </Link>
          </div>
        </div>

        {listy.length === 0 ? (
          <div className="pusto" style={{ marginTop: "var(--o-5)" }}>
            <h3>{szukaj ? "Nic nie pasuje do wyszukiwania" : "Brak listów w tym widoku"}</h3>
            <p>{szukaj ? "Spróbuj innego słowa albo wyczyść filtry." : "Dodaj pierwszy list albo zmień filtr statusu."}</p>
          </div>
        ) : (
          <div className="tabela-przewijana"><table className="tabela">
            <thead><tr><th>Zdjęcie</th><th>Nr</th><th>Dziecko</th><th>Placówka</th><th>Status</th><th>Weryfikacja</th><th><span className="tylko-dla-czytnika">Akcje</span></th></tr></thead>
            <tbody>{listy.map((l) => (
              <tr key={l.id}>
                <td><MiniaturaListu id={l.id} numer={l.numer} imie={l.imie} zdjecieUrl={l.zdjecieUrl} /></td>
                <td className="cichy">{l.numer}</td>
                <td><b>{l.imie}</b>, {wiekPL(l.wiek)}<br /><span className="drobny cichy">{l.marzenie.slice(0, 48)}{l.marzenie.length > 48 ? "…" : ""}</span></td>
                <td className="maly">{(l.placowka?.nazwa || "Bez placówki · Fundacja")}</td>
                <td><Status status={l.status} />{l.rezerwacjaReczna && <p className="drobny cichy">Rezerwacja ręczna Fundacji</p>}</td>
                <td className="drobny">{l.weryfikacja?.zakonczona ? "zakończona" : <span className="cichy">w toku</span>}</td>
                <td><SzybkieAkcje list={l} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
