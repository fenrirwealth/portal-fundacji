"use client";

import { useActionState, useState } from "react";
import { zapiszUwagiListu } from "../uwagi-listu";
import PrzyciskOperacji from "./PrzyciskOperacji";
import styl from "./UwagiListu.module.css";

export default function UwagiListu({ id, numer, notatka }) {
  const [stan, zapisz, trwa] = useActionState(zapiszUwagiListu.bind(null, id), {
    tresc: notatka?.tresc ?? "",
    wersja: notatka?.wersja ?? 0,
    zapisano: false,
    blad: "",
  });
  const [tresc, setTresc] = useState(stan.tresc);
  const poleId = "uwagi-listu-" + id;

  return (
    <div className={styl.uwagi}>
      {stan.tresc && <p className={styl.podglad}>{stan.tresc}</p>}
      <details>
        <summary>{stan.tresc ? "Edytuj uwagi" : "Dodaj uwagi"}</summary>
        <form action={zapisz} className={styl.formularz}>
          <label htmlFor={poleId} className="tylko-dla-czytnika">Uwagi wewnętrzne do listu nr {numer}</label>
          <textarea
            className="pole-kontrolka"
            id={poleId}
            name="uwagi"
            rows={3}
            maxLength={2000}
            placeholder="Wpisz uwagi Fundacji"
            value={tresc}
            readOnly={trwa}
            onChange={(e) => setTresc(e.target.value)}
          />
          <PrzyciskOperacji className="btn drugorzedny">Zapisz uwagi</PrzyciskOperacji>
          {stan.blad && <p role="alert" className="drobny pole-blad">{stan.blad}</p>}
          {stan.zapisano && tresc.trim() === stan.tresc && <p role="status" className="drobny">Zapisano uwagi.</p>}
        </form>
      </details>
    </div>
  );
}
