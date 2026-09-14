import Link from "next/link";
import { db } from "../../../../lib/db";
import { wymagajRedakcji } from "../../../../lib/admin";
import { WOJEWODZTWA, KATEGORIE } from "../../../../lib/slowniki";
import { utworzList } from "../../actions";
import Podglad from "../../ui/Podglad";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nowy list", robots: { index: false, follow: false } };

export default async function NowyList({ searchParams }) {
  await wymagajRedakcji("/admin/listy/nowy");
  const p = (await searchParams) || {};

  const udzialy = await db.udzialPlacowki.findMany({
    where: { status: "POTWIERDZILA", edycja: { aktywna: true } },
    include: { placowka: { select: { nazwa: true, wojewodztwo: true } } },
    orderBy: { placowka: { nazwa: "asc" } },
  });

  return (
    <div className="wrap sekcja">
      <Link className="btn btn-tekstowy" href="/admin" style={{ marginLeft: "calc(var(--o-2) * -1)" }}>
        ← Panel redakcji
      </Link>

      <h1 className="tytul" style={{ marginTop: "var(--o-4)" }}>Nowy list</h1>
      <p className="wstep" style={{ marginTop: "var(--o-2)" }}>
        List powstaje jako szkic. Publikacja będzie możliwa dopiero po przyjęciu
        zgody dyrektora i zaznaczeniu całej listy kontrolnej.
      </p>

      {p.blad && <p className="blad" role="alert">{p.blad}</p>}

      {udzialy.length === 0 ? (
        <div className="pusto" style={{ marginTop: "var(--o-6)" }}>
          <h3>Brak zatwierdzonych placówek</h3>
          <p>
            Listy można dodawać tylko dla placówek, których zgłoszenie zostało
            zatwierdzone w aktywnej edycji.
          </p>
          <Link className="btn" href="/admin" style={{ marginTop: "var(--o-4)" }}>
            Przejdź do zgłoszeń
          </Link>
        </div>
      ) : (
        <form action={utworzList} className="formularz-admin">
          <fieldset>
            <legend>Placówka i edycja</legend>
            <label>Placówka
              <select name="udzialId" required defaultValue="">
                <option value="" disabled>wybierz z listy zatwierdzonych</option>
                {udzialy.map((u) => (
                  <option key={u.id} value={u.id}>{u.placowka.nazwa} — {u.placowka.wojewodztwo}</option>
                ))}
              </select>
            </label>
            <p className="drobny cichy" style={{ margin: 0 }}>
              Widoczne są wyłącznie placówki zatwierdzone w aktywnej edycji.
            </p>
          </fieldset>

          <fieldset>
            <legend>Dane publiczne</legend>
            <p className="drobny cichy" style={{ margin: 0 }}>
              Wszystko w tej sekcji zobaczy darczyńca. Nie wpisuj nazwiska dziecka,
              nazwy placówki ani miejscowości.
            </p>
            <label>Imię dziecka<input name="imie" required maxLength={80} /></label>
            <label>Wiek<input name="wiek" type="number" min="1" max="25" required /></label>
            <label>Województwo
              <select name="wojewodztwo" required defaultValue="">
                <option value="" disabled>wybierz</option>
                {WOJEWODZTWA.map((w) => <option key={w}>{w}</option>)}
              </select>
            </label>
            <label>Kategoria
              <select name="kategoria" required defaultValue="">
                <option value="" disabled>wybierz</option>
                {KATEGORIE.map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
            <label>Marzenie<textarea name="marzenie" required maxLength={300} rows={3} /></label>
            <label>Rozmiar (opcjonalnie)<input name="rozmiar" maxLength={80} /></label>
            <label>Opis publiczny<textarea name="opis" maxLength={1200} rows={5} /></label>
            <label>Adres przygotowanego zdjęcia listu (HTTPS)
              <input name="zdjecieUrl" type="url" pattern="https://.*" />
            </label>
          </fieldset>

          <div className="pasek-akcji-admin">
            <Podglad pola={{}} />
            <span style={{ flex: 1 }} />
            <button className="btn" type="submit">Utwórz szkic</button>
          </div>
        </form>
      )}
    </div>
  );
}
