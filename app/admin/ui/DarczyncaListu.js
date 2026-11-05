"use client";

import { useActionState, useId, useRef, useState } from "react";
import { zapiszDarczynce } from "../darczynca-listu";
import PrzyciskOperacji from "./PrzyciskOperacji";
import styl from "./PanelListow.module.css";

export default function DarczyncaListu({ listId, numer, rezerwacja, recznaOd, recznyDarczynca }) {
  const [stan, zapisz, trwa] = useActionState(
    zapiszDarczynce.bind(null, { listId, rezerwacjaId: rezerwacja?.id, recznaOd }),
    { etykieta: rezerwacja ? rezerwacja.darczyncaEtykieta : recznyDarczynca, zapisano: false, blad: "" }
  );
  const [tresc, setTresc] = useState(stan.etykieta ?? "");
  const pole = useId();
  const dialog = useRef(null);
  const nazwaKonta = rezerwacja?.user.name || rezerwacja?.user.email;
  const nazwa = stan.etykieta || nazwaKonta || "Darczyńca do wpisania";

  return (
    <div className={styl.darczynca}>
      <p><strong>{nazwa}</strong></p>
      <p className="drobny cichy">{rezerwacja ? "Rezerwacja online" : "Rezerwacja ręczna"}</p>
      <button className="btn btn-tekstowy" type="button" aria-haspopup="dialog" onClick={() => dialog.current.showModal()}>
        Edytuj darczyńcę
      </button>
      <dialog
        ref={dialog}
        className={styl.dialog + " karta"}
        aria-labelledby={pole + "-tytul"}
        onCancel={(e) => { if (trwa) e.preventDefault(); }}
      >
        <form action={zapisz} aria-busy={trwa}>
          <h2 id={pole + "-tytul"}>Darczyńca listu nr {numer}</h2>
          <dl className={styl.kontakt}>
            <div>
              <dt className="drobny cichy">E-mail</dt>
              <dd>{rezerwacja?.user.email || "Brak w rezerwacji"}</dd>
            </div>
            <div>
              <dt className="drobny cichy">Telefon</dt>
              <dd>{rezerwacja?.telefonKontaktowy
                ? <a href={`tel:${rezerwacja.telefonKontaktowy}`}>{rezerwacja.telefonKontaktowy}</a>
                : "Brak w rezerwacji"}</dd>
            </div>
          </dl>
          <label htmlFor={pole} className="maly">Zarezerwował(a)</label>
          <textarea
            id={pole}
            className="pole-kontrolka"
            name="darczynca"
            rows={2}
            maxLength={120}
            placeholder={nazwaKonta || "Imię, nazwisko lub firma"}
            value={tresc}
            readOnly={trwa}
            onChange={(e) => setTresc(e.target.value)}
          />
          {stan.blad && <p role="alert" className="drobny pole-blad">{stan.blad}</p>}
          {stan.zapisano && tresc.trim() === (stan.etykieta ?? "") && <p role="status" className="drobny">Zapisano darczyńcę.</p>}
          <PrzyciskOperacji>Zapisz darczyńcę</PrzyciskOperacji>
          <button className="btn btn-tekstowy" type="button" onClick={() => dialog.current.close()} disabled={trwa}>
            Zamknij
          </button>
        </form>
      </dialog>
    </div>
  );
}
