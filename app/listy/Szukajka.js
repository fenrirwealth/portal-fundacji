"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

// Wyszukiwarka po prawdziwych danych: imię, marzenie, opis.
// Jako formularz, nie filtrowanie w locie — wynik ma własny adres,
// więc da się go wysłać znajomemu i działa przycisk „wstecz".
export default function Szukajka({ poczatkowa }) {
  const [wartosc, setWartosc] = useState(poczatkowa);
  const router = useRouter();
  const params = useSearchParams();

  function wyslij(e) {
    e.preventDefault();
    const p = new URLSearchParams(params);
    const czysta = wartosc.trim();
    if (czysta) p.set("szukaj", czysta); else p.delete("szukaj");
    const s = p.toString();
    router.push(s ? "/listy?" + s : "/listy");
  }

  return (
    <form onSubmit={wyslij} role="search" style={{ display: "flex", gap: "var(--o-2)", maxWidth: 520 }}>
      <label htmlFor="szukaj" className="tylko-dla-czytnika">Szukaj w listach</label>
      <input
        id="szukaj"
        className="pole-kontrolka"
        type="search"
        value={wartosc}
        onChange={(e) => setWartosc(e.target.value)}
        placeholder="Szukaj: imię, marzenie, np. rower"
        maxLength={60}
      />
      <button className="btn btn-cichy" type="submit">Szukaj</button>
      {poczatkowa && (
        <Link className="btn btn-tekstowy" href="/listy" aria-label="Wyczyść wyszukiwanie">Wyczyść</Link>
      )}
    </form>
  );
}
