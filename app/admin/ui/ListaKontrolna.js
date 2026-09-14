"use client";

import { useState } from "react";

// Lista kontrolna z licznikiem postepu.
//
// Wczesniej byla to kolumna dziesieciu pol wyboru bez informacji, ile
// zostalo — redaktor dowiadywal sie o brakach dopiero po nieudanej probie
// publikacji, z komunikatem w adresie i po przeladowaniu strony.
//
// Licznik jest wylacznie podpowiedzia. Warunkiem publikacji pozostaje
// sprawdzenie po stronie serwera w actions.js, ktorego nie dotykamy.
export default function ListaKontrolna({ pozycje, wartosci, zgodaPoczatkowa, zablokowany }) {
  const [zaznaczone, setZaznaczone] = useState(
    () => Object.fromEntries(pozycje.map(([pole]) => [pole, Boolean(wartosci?.[pole])]))
  );
  const [zgoda, setZgoda] = useState(Boolean(zgodaPoczatkowa));

  const ile = pozycje.filter(([pole]) => zaznaczone[pole]).length;
  const komplet = ile === pozycje.length && zgoda;

  return (
    <fieldset disabled={zablokowany} className="kontrolna">
      <legend>Zgoda i lista kontrolna</legend>

      <p className={"kontrolna-postep" + (komplet ? " kontrolna-gotowa" : "")} aria-live="polite">
        {komplet
          ? "Komplet — publikacja jest możliwa"
          : `Zaznaczono ${ile} z ${pozycje.length}${zgoda ? "" : ", brakuje też zgody dyrektora"}`}
      </p>

      <label className="checkbox">
        <input
          name="zgoda"
          type="checkbox"
          checked={zgoda}
          onChange={(e) => setZgoda(e.target.checked)}
        />
        <span><b>Zgoda dyrektora została przyjęta</b><br />
          <span className="drobny cichy">Podpisany dokument zostaje w dokumentacji Fundacji, nie w portalu.</span>
        </span>
      </label>

      {pozycje.map(([pole, opis]) => (
        <label className="checkbox" key={pole}>
          <input
            name={pole}
            type="checkbox"
            checked={Boolean(zaznaczone[pole])}
            onChange={(e) => setZaznaczone((s) => ({ ...s, [pole]: e.target.checked }))}
          />
          <span>{opis}</span>
        </label>
      ))}
    </fieldset>
  );
}
