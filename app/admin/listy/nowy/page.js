import { db } from "../../../../lib/db";
import { wymagajRedakcji } from "../../../../lib/admin";
import { WOJEWODZTWA } from "../../../../lib/slowniki";
import { utworzList } from "../../actions";

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
      <p><a href="/admin">← Panel redakcji</a></p>
      <h1 className="tytul">Nowy list</h1>
      {p.blad && <p className="blad" role="alert">{p.blad}</p>}
      {udzialy.length === 0 ? (
        <p className="blad">Najpierw zatwierdz zgloszenie placowki w aktywnej edycji.</p>
      ) : (
        <form action={utworzList} className="formularz-admin">
          <label>Placowka
            <select name="udzialId" required defaultValue="">
              <option value="" disabled>wybierz</option>
              {udzialy.map((u) => <option key={u.id} value={u.id}>{u.placowka.nazwa} — {u.placowka.wojewodztwo}</option>)}
            </select>
          </label>
          <label>Imie dziecka<input name="imie" required maxLength={80} /></label>
          <label>Wiek<input name="wiek" type="number" min="1" max="25" required /></label>
          <label>Wojewodztwo
            <select name="wojewodztwo" required defaultValue="">
              <option value="" disabled>wybierz</option>
              {WOJEWODZTWA.map((w) => <option key={w}>{w}</option>)}
            </select>
          </label>
          <label>Kategoria
            <select name="kategoria" required defaultValue="">
              <option value="" disabled>wybierz</option>
              {['ZABAWKI','SPORT','KSIAZKI','NAUKA','UBRANIA','INNE'].map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label>Marzenie<textarea name="marzenie" required maxLength={300} rows={3} /></label>
          <label>Rozmiar (opcjonalnie)<input name="rozmiar" maxLength={80} /></label>
          <label>Opis publiczny<textarea name="opis" maxLength={1200} rows={5} /></label>
          <label>Adres przygotowanego zdjecia listu (HTTPS)<input name="zdjecieUrl" type="url" /></label>
          <p className="wstep">Po zapisaniu list pozostanie szkicem. Publikacja bedzie mozliwa dopiero po uzupelnieniu zgody i calej listy kontrolnej.</p>
          <button className="btn" type="submit">Utworz szkic</button>
        </form>
      )}
    </div>
  );
}
