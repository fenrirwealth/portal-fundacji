"use client";

import { useActionState } from "react";
import PoleAdmin from "./PoleAdmin";
import ListaKontrolna from "./ListaKontrolna";
import Podglad from "./Podglad";

const STAN_POCZATKOWY = { ok: true, bledy: {}, wartosci: {} };

/**
 * Formularz edycji listu.
 *
 * Wartosci pochodza z bazy, ale po nieudanej walidacji nadpisuje je to,
 * co przyszlo z formularza — dzieki temu redaktor nie traci poprawek.
 */
export default function FormularzListu({
  akcja, list, weryfikacja, kontrola, wojewodztwa, kategorie, zablokowany, wycofany,
}) {
  const [stan, wyslij, wTrakcie] = useActionState(akcja, STAN_POCZATKOWY);
  const b = stan?.bledy || {};
  const z = stan?.wartosci || {};

  // Po bledzie pierwszenstwo maja wartosci z formularza, nie z bazy.
  const v = (pole, domyslna) => (z[pole] !== undefined ? z[pole] : domyslna);
  const poBledzie = Object.keys(b).length > 0;

  return (
    <form action={wyslij} className="formularz-admin" noValidate>
      <input type="hidden" name="id" value={list.id} />
      <input type="hidden" name="wersja" value={list.wersja} />

      {poBledzie && (
        <p className="blad" role="alert" style={{ marginTop: 0 }}>
          Zmiany nie zostały zapisane — popraw zaznaczone pola. Wpisane dane zostały zachowane.
        </p>
      )}

      {/* List wycofany jest w archiwum: pola sa tylko do odczytu, dopoki
          redaktor swiadomie nie przywroci go do szkicu. */}
      {wycofany ? (
        <div className="realizacja">
          <h2>List jest w archiwum</h2>
          <p className="maly">
            Wycofany list nie jest widoczny dla darczyńców. Możesz przywrócić go
            do szkiców — wróci do edycji, ale <b>nie zostanie opublikowany</b>.
            Publikacja będzie wymagała ponownego sprawdzenia listy kontrolnej.
          </p>
          <div className="pasek-akcji-admin" style={{ borderTop: 0, paddingTop: "var(--o-4)" }}>
            <button className="btn" name="operacja" value="przywroc" disabled={wTrakcie} aria-busy={wTrakcie}>
              {wTrakcie ? "Przywracam…" : "Przywróć do szkiców"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <fieldset disabled={zablokowany}>
            <legend>Dane publiczne</legend>
            <p className="drobny cichy" style={{ margin: 0 }}>
              Wszystko w tej sekcji zobaczy darczyńca. Nic poza nią nie opuszcza panelu.
            </p>

            <PoleAdmin nazwa="imie" etykieta="Imię dziecka" blad={b.imie}>
              <input name="imie" maxLength={80} defaultValue={v("imie", list.imie)} />
            </PoleAdmin>

            <PoleAdmin nazwa="wiek" etykieta="Wiek" blad={b.wiek}>
              <input name="wiek" type="number" min="1" max="25" defaultValue={v("wiek", list.wiek)} />
            </PoleAdmin>

            <PoleAdmin nazwa="wojewodztwo" etykieta="Województwo" blad={b.wojewodztwo}>
              <select name="wojewodztwo" defaultValue={v("wojewodztwo", list.wojewodztwo)}>
                {wojewodztwa.map((x) => <option key={x}>{x}</option>)}
              </select>
            </PoleAdmin>

            <PoleAdmin nazwa="kategoria" etykieta="Kategoria" blad={b.kategoria}>
              <select name="kategoria" defaultValue={v("kategoria", list.kategoria)}>
                {kategorie.map((x) => <option key={x}>{x}</option>)}
              </select>
            </PoleAdmin>

            <PoleAdmin nazwa="marzenie" etykieta="Zatwierdzony cytat / marzenie" blad={b.marzenie}>
              <textarea name="marzenie" rows={3} maxLength={300} defaultValue={v("marzenie", list.marzenie)} />
            </PoleAdmin>

            <PoleAdmin nazwa="rozmiar" etykieta="Rozmiar" blad={b.rozmiar}>
              <input name="rozmiar" maxLength={80} defaultValue={v("rozmiar", list.rozmiar || "")} />
            </PoleAdmin>

            <PoleAdmin nazwa="opis" etykieta="Opis publiczny" blad={b.opis}>
              <textarea name="opis" rows={5} maxLength={1200} defaultValue={v("opis", list.opis || "")} />
            </PoleAdmin>

            <PoleAdmin nazwa="zdjecieUrl" etykieta="Adres przygotowanego zdjęcia listu (HTTPS)" blad={b.zdjecieUrl}>
              <input name="zdjecieUrl" type="url" defaultValue={v("zdjecieUrl", list.zdjecieUrl || "")} />
            </PoleAdmin>
          </fieldset>

          <ListaKontrolna
            pozycje={kontrola}
            wartosci={poBledzie ? z : weryfikacja}
            zgodaPoczatkowa={poBledzie ? Boolean(z.zgoda) : list.zgodaPrzyjeta}
            zablokowany={zablokowany}
            bladZgody={b.zgoda}
            bladListy={b.weryfikacja}
          />

          {!zablokowany && (
            <div className="pasek-akcji-admin">
              <Podglad pola={{ numer: list.numer }} />
              <span style={{ flex: 1 }} />
              <button className="btn drugorzedny" name="operacja" value="zapisz" disabled={wTrakcie}>
                Zapisz jako szkic
              </button>
              <button className="btn" name="operacja" value="publikuj" disabled={wTrakcie} aria-busy={wTrakcie}>
                {wTrakcie ? "Zapisuję…" : "Sprawdź i opublikuj"}
              </button>
              <button className="btn niebezpieczny" name="operacja" value="wycofaj" disabled={wTrakcie}>
                Wycofaj list
              </button>
            </div>
          )}
        </>
      )}
    </form>
  );
}
