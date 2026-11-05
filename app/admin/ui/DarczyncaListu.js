"use client";

import { useActionState, useId, useState } from "react";
import { zapiszDarczynce } from "../darczynca-listu";
import PrzyciskOperacji from "./PrzyciskOperacji";
import styl from "./UwagiListu.module.css";

export default function DarczyncaListu({ listId, numer, rezerwacja, recznaOd, recznyDarczynca }) {
  const [stan, zapisz, trwa] = useActionState(
    zapiszDarczynce.bind(null, { listId, rezerwacjaId: rezerwacja?.id, recznaOd }),
    { etykieta: rezerwacja ? rezerwacja.darczyncaEtykieta : recznyDarczynca, zapisano: false, blad: "" }
  );
  const [tresc, setTresc] = useState(stan.etykieta ?? "");
  const pole = useId();
  const nazwaKonta = rezerwacja?.user.name || rezerwacja?.user.email;
  const nazwa = stan.etykieta || nazwaKonta || "Darczyńca do wpisania";

  return (
    <div className={styl.uwagi}>
      <p className={styl.podglad}><strong>{nazwa}</strong></p>
      <p className="drobny cichy">{rezerwacja ? "Rezerwacja online" : "Rezerwacja ręczna"}</p>
      <details>
        <summary>Edytuj darczyńcę</summary>
        <form action={zapisz} className={styl.formularz}>
          <label htmlFor={pole} className="drobny">Zarezerwował(a) list nr {numer}</label>
          <input
            id={pole}
            className="pole-kontrolka"
            name="darczynca"
            maxLength={120}
            placeholder={nazwaKonta || "Imię, nazwisko lub firma"}
            value={tresc}
            readOnly={trwa}
            onChange={(e) => setTresc(e.target.value)}
          />
          <PrzyciskOperacji className="btn drugorzedny">Zapisz darczyńcę</PrzyciskOperacji>
          {stan.blad && <p role="alert" className="drobny pole-blad">{stan.blad}</p>}
          {stan.zapisano && tresc.trim() === (stan.etykieta ?? "") && <p role="status" className="drobny">Zapisano darczyńcę.</p>}
        </form>
      </details>
    </div>
  );
}
