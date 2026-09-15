"use client";

import { useRef, useState } from "react";

export default function FormularzSkanow({ token, nazwa }) {
  const formularz = useRef(null);
  const [stan, setStan] = useState("gotowy");
  const [komunikat, setKomunikat] = useState("");

  async function wyslij(event) {
    event.preventDefault();
    setStan("wysylanie");
    setKomunikat("");
    try {
      const odpowiedz = await fetch(`/api/placowka/skany/${encodeURIComponent(token)}`, {
        method: "POST", body: new FormData(event.currentTarget),
      });
      const dane = await odpowiedz.json();
      if (!odpowiedz.ok) throw new Error(dane.blad || "Nie udało się przesłać plików.");
      setStan("sukces");
      setKomunikat(`Bezpiecznie zapisaliśmy ${dane.liczba} ${dane.liczba === 1 ? "list" : "listów"}. Fundacja sprawdzi je przed publikacją.`);
      formularz.current?.reset();
    } catch (blad) {
      setStan("blad");
      setKomunikat(blad.message);
    }
  }

  return (
    <form ref={formularz} onSubmit={wyslij} className="formularz-skanow">
      <div className="pole-upload">
        <label htmlFor="skany"><b>Zdjęcia lub skany listów</b><span>JPG, PNG lub WEBP · maks. 5 plików po 10 MB</span></label>
        <input id="skany" name="skany" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
      </div>
      <label>
        <span className="etykieta-pola">Notatka dla Fundacji <small>(opcjonalnie)</small></span>
        <textarea name="notatka" rows={4} maxLength={800} placeholder={`Informacja dotycząca przesyłki z placówki ${nazwa}`} />
      </label>
      <label className="pulapka" aria-hidden="true">Nie wypełniaj<input name="strona" tabIndex={-1} autoComplete="off" /></label>
      <button className="btn btn-magiczny btn-duzy" disabled={stan === "wysylanie"} aria-busy={stan === "wysylanie"}>
        {stan === "wysylanie" ? "Oczyszczamy i zapisujemy…" : "Prześlij bezpiecznie"}
      </button>
      {komunikat && <p className={stan === "sukces" ? "komunikat komunikat-sukces" : "blad"} role="status">{komunikat}</p>}
    </form>
  );
}
