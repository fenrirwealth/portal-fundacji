"use client";

import { useActionState } from "react";
import PoleAdmin from "./PoleAdmin";
import Podglad from "./Podglad";

const STAN_POCZATKOWY = { ok: true, bledy: {}, wartosci: {} };

/**
 * Formularz nowego listu. Bledy walidacji wracaja z akcji serwerowej
 * i trafiaja do konkretnych pol, a wpisane wartosci sa odtwarzane —
 * wczesniej kazdy blad przeladowywal strone i kasowal cala prace.
 */
export default function FormularzNowy({ akcja, udzialy, skany, domyslnySkanId, domyslnyUdzialId, wojewodztwa, kategorie }) {
  const [stan, wyslij, wTrakcie] = useActionState(akcja, STAN_POCZATKOWY);
  const b = stan?.bledy || {};
  const w = stan?.wartosci || {};

  return (
    <form action={wyslij} className="formularz-admin" noValidate>
      {Object.keys(b).length > 0 && (
        <p className="blad" role="alert" style={{ marginTop: 0 }}>
          Formularz nie został zapisany — popraw zaznaczone pola. Wpisane dane zostały zachowane.
        </p>
      )}

      <fieldset>
        <legend>Placówka i edycja</legend>
        <PoleAdmin nazwa="udzialId" etykieta="Placówka" blad={b.udzialId}
                   podpowiedz="Widoczne są wyłącznie placówki zatwierdzone w aktywnej edycji.">
          <select name="udzialId" defaultValue={w.udzialId || domyslnyUdzialId || ""}>
            <option value="" disabled>wybierz z listy zatwierdzonych</option>
            {udzialy.map((u) => <option key={u.id} value={u.id}>{u.nazwa} — {u.wojewodztwo}</option>)}
          </select>
        </PoleAdmin>
        <PoleAdmin nazwa="skanId" etykieta="Prywatny skan źródłowy (opcjonalnie)" blad={b.skanId}
                   podpowiedz="Skan jest widoczny tylko dla redakcji i zostanie przypięty do tego szkicu.">
          <select name="skanId" defaultValue={w.skanId || domyslnySkanId || ""}>
            <option value="">bez skanu z panelu placówki</option>
            {skany.map((s) => <option key={s.id} value={s.id}>{s.nazwa} · {s.data}</option>)}
          </select>
        </PoleAdmin>
      </fieldset>

      <fieldset>
        <legend>Dane publiczne</legend>
        <p className="drobny cichy" style={{ margin: 0 }}>
          Wszystko w tej sekcji zobaczy darczyńca. Nie wpisuj nazwiska dziecka,
          nazwy placówki ani miejscowości.
        </p>

        <PoleAdmin nazwa="imie" etykieta="Imię dziecka" blad={b.imie}>
          <input name="imie" maxLength={80} defaultValue={w.imie || ""} />
        </PoleAdmin>

        <PoleAdmin nazwa="wiek" etykieta="Wiek" blad={b.wiek}>
          <input name="wiek" type="number" min="1" max="25" defaultValue={w.wiek || ""} />
        </PoleAdmin>

        <PoleAdmin nazwa="wojewodztwo" etykieta="Województwo" blad={b.wojewodztwo}>
          <select name="wojewodztwo" defaultValue={w.wojewodztwo || ""}>
            <option value="" disabled>wybierz</option>
            {wojewodztwa.map((x) => <option key={x}>{x}</option>)}
          </select>
        </PoleAdmin>

        <PoleAdmin nazwa="kategoria" etykieta="Kategoria" blad={b.kategoria}>
          <select name="kategoria" defaultValue={w.kategoria || ""}>
            <option value="" disabled>wybierz</option>
            {kategorie.map((x) => <option key={x}>{x}</option>)}
          </select>
        </PoleAdmin>

        <PoleAdmin nazwa="marzenie" etykieta="Zatwierdzony cytat / marzenie" blad={b.marzenie}>
          <textarea name="marzenie" maxLength={300} rows={3} defaultValue={w.marzenie || ""} />
        </PoleAdmin>

        <PoleAdmin nazwa="rozmiar" etykieta="Rozmiar (opcjonalnie)" blad={b.rozmiar}>
          <input name="rozmiar" maxLength={80} defaultValue={w.rozmiar || ""} />
        </PoleAdmin>

        <PoleAdmin nazwa="opis" etykieta="Opis publiczny" blad={b.opis}>
          <textarea name="opis" maxLength={1200} rows={5} defaultValue={w.opis || ""} />
        </PoleAdmin>

        <PoleAdmin nazwa="zdjecieUrl" etykieta="Adres przygotowanego zdjęcia listu (HTTPS)" blad={b.zdjecieUrl}>
          <input name="zdjecieUrl" type="url" defaultValue={w.zdjecieUrl || ""} />
        </PoleAdmin>
      </fieldset>

      <div className="pasek-akcji-admin">
        <Podglad pola={{}} />
        <span style={{ flex: 1 }} />
        <button className="btn" type="submit" disabled={wTrakcie} aria-busy={wTrakcie}>
          {wTrakcie ? "Zapisuję…" : "Utwórz szkic"}
        </button>
      </div>
    </form>
  );
}
