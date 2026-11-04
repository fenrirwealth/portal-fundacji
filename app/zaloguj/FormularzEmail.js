"use client";

import { useActionState } from "react";
import { wyslijLink } from "./link-actions";
import Pole from "../ui/Pole";

export default function FormularzEmail({ wroc }) {
  const [stan, akcja, czeka] = useActionState(wyslijLink, { blad: "", email: "" });
  return (
    <form action={akcja} className="logowanie-formularz" aria-busy={czeka}>
      <input type="hidden" name="wroc" value={wroc} />
      <Pole id="email" name="email" typ="email" etykieta="Twój adres e-mail" wymagane autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} defaultValue={stan.email} placeholder="np. anna@poczta.pl" podpowiedz="Link jest ważny 30 minut. Nie musisz pamiętać hasła." />
      <div aria-live="polite">{stan.blad && <p className="pole-blad" role="alert">{stan.blad}</p>}</div>
      <button className="btn btn-pelny btn-duzy" type="submit" disabled={czeka}>{czeka ? "Wysyłamy link…" : "Wyślij mi link do wejścia"}</button>
    </form>
  );
}
