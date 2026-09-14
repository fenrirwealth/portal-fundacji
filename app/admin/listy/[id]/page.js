import { notFound } from "next/navigation";
import { db } from "../../../../lib/db";
import { wymagajRedakcji } from "../../../../lib/admin";
import { WOJEWODZTWA } from "../../../../lib/slowniki";
import { zapiszList } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edycja listu", robots: { index: false, follow: false } };

const kontrola = [
  ["zgodaDolaczona", "Zgoda dyrektora jest w dokumentacji fundacji"],
  ["brakNazwiska", "Brak nazwiska dziecka"],
  ["brakPlacowki", "Brak nazwy i adresu placowki"],
  ["brakMiejscowosci", "Brak miejscowosci pozwalajacej zidentyfikowac dziecko"],
  ["brakInnychOsob", "Brak danych innych osob"],
  ["brakDanychWrazliwych", "Brak danych o zdrowiu i innych danych wrazliwych"],
  ["brakWizerunku", "Brak wizerunku dziecka"],
  ["metadaneUsuniete", "Usunieto metadane pliku"],
  ["nazwaPlikuPoprawna", "Nazwa pliku nie zawiera danych osobowych"],
  ["opisPoprawny", "Opis publiczny zostal sprawdzony"],
];

export default async function EdycjaListu({ params, searchParams }) {
  const { id } = await params;
  await wymagajRedakcji("/admin/listy/" + id);
  const p = (await searchParams) || {};
  const list = await db.list.findUnique({
    where: { id },
    include: {
      placowka: { select: { nazwa: true } },
      edycja: { select: { nazwa: true } },
      weryfikacja: true,
    },
  });
  if (!list) notFound();

  const zablokowany = ["ZAREZERWOWANY", "OPLACONY", "PRZEKAZANY"].includes(list.status);

  return (
    <div className="wrap sekcja">
      <p><a href="/admin">← Panel redakcji</a></p>
      <h1 className="tytul">List nr {list.numer}: {list.imie}</h1>
      <p className="wstep">{list.placowka.nazwa} · {list.edycja.nazwa} · status: {list.status}</p>
      {p.blad && <p className="blad" role="alert">{p.blad}</p>}
      {p.sukces && <p className="info" role="status">Zmiany zapisano poprawnie.</p>}
      {zablokowany && <p className="blad">List jest w realizacji. Dane sa zablokowane przed przypadkowa zmiana.</p>}

      <form action={zapiszList} className="formularz-admin">
        <input type="hidden" name="id" value={list.id} />
        <input type="hidden" name="wersja" value={list.zaktualizowany.toISOString()} />
        <label>Imie dziecka<input name="imie" required defaultValue={list.imie} disabled={zablokowany} /></label>
        <label>Wiek<input name="wiek" type="number" min="1" max="25" required defaultValue={list.wiek} disabled={zablokowany} /></label>
        <label>Wojewodztwo
          <select name="wojewodztwo" required defaultValue={list.wojewodztwo} disabled={zablokowany}>
            {WOJEWODZTWA.map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label>Kategoria
          <select name="kategoria" defaultValue={list.kategoria} disabled={zablokowany}>
            {['ZABAWKI','SPORT','KSIAZKI','NAUKA','UBRANIA','INNE'].map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label>Marzenie<textarea name="marzenie" rows={3} required defaultValue={list.marzenie} disabled={zablokowany} /></label>
        <label>Rozmiar<input name="rozmiar" defaultValue={list.rozmiar || ""} disabled={zablokowany} /></label>
        <label>Opis publiczny<textarea name="opis" rows={5} defaultValue={list.opis || ""} disabled={zablokowany} /></label>
        <label>Adres przygotowanego zdjecia listu (HTTPS)<input name="zdjecieUrl" type="url" defaultValue={list.zdjecieUrl || ""} disabled={zablokowany} /></label>

        <fieldset disabled={zablokowany}>
          <legend>Zgoda i lista kontrolna</legend>
          <label className="checkbox"><input name="zgoda" type="checkbox" defaultChecked={Boolean(list.zgodaData && !list.zgodaCofnieta)} /> Zgoda dyrektora zostala przyjeta</label>
          {kontrola.map(([pole, opis]) => (
            <label className="checkbox" key={pole}>
              <input name={pole} type="checkbox" defaultChecked={Boolean(list.weryfikacja?.[pole])} /> {opis}
            </label>
          ))}
        </fieldset>

        {!zablokowany && <div className="naglowek-rzad">
          <button className="btn drugorzedny" name="operacja" value="zapisz">Zapisz jako szkic</button>
          <button className="btn" name="operacja" value="publikuj">Sprawdz i opublikuj</button>
          <button className="btn niebezpieczny" name="operacja" value="wycofaj">Wycofaj list</button>
        </div>}
      </form>
    </div>
  );
}
