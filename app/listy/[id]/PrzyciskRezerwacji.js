"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import style from "./Rezerwacja.module.css";
import { OPISY_STATUSU_LISTU } from "../../../lib/statusy-listu.mjs";

/**
 * @param {object} p
 * @param {string} p.listId
 * @param {number} p.numer
 * @param {boolean} p.wolny
 * @param {string} p.status
 * @param {string} [p.przedRezerwacja]
 * @param {boolean} [p.zwiezly] wariant do paska mobilnego
 */
export default function PrzyciskRezerwacji({ listId, numer, wolny, status, przedRezerwacja, zwiezly = false }) {
  const dialog = useRef(null);
  const identyfikator = useId();
  const [czekam, setCzekam] = useState(false);
  const [blad, setBlad] = useState("");
  const router = useRouter();
  const etykieta = zwiezly ? "Wybieram" : "Zostań Mikołajem tego listu";
  const klasa = "btn" + (zwiezly ? "" : " btn-pelny btn-duzy");

  if (!wolny) {
    return (
      <button className={"btn" + (zwiezly ? "" : " btn-pelny")} disabled>
        {OPISY_STATUSU_LISTU[status] || "Rezerwacja niedostępna"}
      </button>
    );
  }

  if (przedRezerwacja) {
    return <Link className={klasa} href={przedRezerwacja}>{etykieta}</Link>;
  }

  async function rezerwuj(e) {
    e.preventDefault();
    if (czekam) return;

    const telefon = new FormData(e.currentTarget).get("telefon");
    setCzekam(true);
    setBlad("");

    try {
      const odp = await fetch("/api/rezerwacja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, telefon }),
      });
      const dane = await odp.json();

      const wroc = encodeURIComponent("/listy/" + listId);
      if (odp.status === 403 && dane.wymagaZgody) {
        dialog.current.close();
        router.push("/regulamin?wroc=" + wroc);
        return;
      }
      if (odp.status === 401) {
        dialog.current.close();
        router.push("/zaloguj?wroc=" + wroc);
        return;
      }
      if (!odp.ok) {
        setBlad(dane.blad || "Nie udało się zarezerwować listu.");
        setCzekam(false);
        if (odp.status === 409) router.refresh();
        return;
      }

      dialog.current.close();
      window.location.replace("/moje-rezerwacje?nowa=" + encodeURIComponent(dane.rezerwacjaId));
    } catch {
      setBlad("Brak połączenia. Spróbuj jeszcze raz.");
      setCzekam(false);
    }
  }

  return (
    <>
      <button type="button" className={klasa} onClick={() => {
        setBlad("");
        dialog.current.showModal();
      }} aria-haspopup="dialog" disabled={czekam}>
        {etykieta}
      </button>
      <dialog
        ref={dialog}
        className={style.dialog + " karta"}
        aria-labelledby={identyfikator + "-tytul"}
        onCancel={(e) => { if (czekam) e.preventDefault(); }}
      >
        <form onSubmit={rezerwuj} aria-busy={czekam}>
          <h2 id={identyfikator + "-tytul"}>Zarezerwuj list nr {numer}</h2>
          <p className="maly cichy" id={identyfikator + "-opis"}>
            Fundacja użyje numeru do kontaktu w sprawie prezentu. Jeśli nie zadzwonisz, możemy do Ciebie oddzwonić.
          </p>
          <label htmlFor={identyfikator + "-telefon"}>Twój numer telefonu (wymagany)</label>
          <input
            className="pole-kontrolka"
            id={identyfikator + "-telefon"}
            name="telefon"
            type="tel"
            autoComplete="tel"
            maxLength={32}
            placeholder="np. +48 123 456 789"
            aria-describedby={identyfikator + "-opis"}
            required
            disabled={czekam}
          />
          {blad && <p className="pole-blad" role="alert">{blad}</p>}
          <button className="btn btn-pelny" type="submit" disabled={czekam}>
            {czekam ? "Rezerwuję…" : "Potwierdź rezerwację"}
          </button>
          <button className="btn btn-tekstowy btn-pelny" type="button" onClick={() => dialog.current.close()} disabled={czekam}>
            Wróć do listu
          </button>
        </form>
      </dialog>
    </>
  );
}
