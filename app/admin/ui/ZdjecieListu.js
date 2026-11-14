"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ZdjecieListu({ id, wersja }) {
  const router = useRouter();
  const [trwa, setTrwa] = useState(false);
  const [blad, setBlad] = useState("");
  const [sukces, setSukces] = useState(false);

  async function wyslij(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const dane = new FormData(form);
    setTrwa(true);
    setBlad("");
    setSukces(false);
    try {
      const response = await fetch(`/api/admin/listy/${id}/zdjecie`, {
        method: "POST",
        body: dane,
        redirect: "error",
        headers: { "x-wersja-listu": wersja },
      });
      const wynik = await response.json();
      if (!response.ok) throw new Error(wynik.blad);
      form.reset();
      setSukces(true);
      router.refresh();
    } catch (error) {
      setBlad(error instanceof TypeError || error instanceof SyntaxError ? "Nie udało się przesłać zdjęcia. Sprawdź połączenie i zalogowanie." : error.message);
    } finally {
      setTrwa(false);
    }
  }

  return (
    <section className="realizacja">
      <h2>Zdjęcie listu</h2>
      <form onSubmit={wyslij} className="formularz-admin">
        <label className="checkbox">
          <input type="checkbox" required />
          Sprawdziłem, że zdjęcia są przygotowane do publicznego wyświetlenia zgodnie z listą kontrolną.
        </label>
        <label>
          Wybierz do dwóch zdjęć w kolejności stron (JPG, PNG lub WEBP)
          <input name="zdjecia" type="file" accept="image/jpeg,image/png,image/webp" multiple required disabled={trwa} />
        </label>
        <button type="submit" className="btn" disabled={trwa}>{trwa ? "Przesyłam…" : "Wgraj zdjęcie listu"}</button>
        {blad && <p role="alert" className="blad">{blad}</p>}
        {sukces && <p role="status" className="info">Zdjęcie listu zapisane.</p>}
      </form>
    </section>
  );
}
