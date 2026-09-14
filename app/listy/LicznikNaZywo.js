"use client";

import { useEffect, useState } from "react";

// Licznik odswiezany strumieniem Server-Sent Events.
// Gdy ktos nie potwierdzi rezerwacji w terminie, liczba wolnych listow
// rosnie na oczach osob, ktore akurat sa na stronie.
/**
 * @param {object} p
 * @param {{wszystkie: number, wolne: number}} p.poczatkowy
 * @param {string|null} [p.termin]
 */
export default function LicznikNaZywo({ poczatkowy, termin = null }) {
  const [stan, setStan] = useState(poczatkowy);

  useEffect(() => {
    // Szanujemy ustawienie oszczedzania danych — bez tego strumien
    // trzymalby otwarte polaczenie takze na komorce w roamingu.
    // navigator.connection nie jest jeszcze w standardowych typach
    // przegladarki, choc dziala w Chrome i Edge.
    const polaczenie = /** @type {any} */ (navigator).connection;
    if (polaczenie?.saveData) return;

    const zrodlo = new EventSource("/api/licznik");
    zrodlo.onmessage = (e) => {
      try { setStan(JSON.parse(e.data)); } catch {}
    };
    // Przy bledzie NIE zamykamy strumienia. EventSource ponawia
    // polaczenie sam, z rosnacym odstepem; close() wylaczyloby ten
    // mechanizm i licznik zamarzlby do konca wizyty.
    zrodlo.onerror = () => {};

    return () => zrodlo.close();
  }, []);

  if (!stan || stan.wszystkie === 0) return null;

  const pozycje = [
    [stan.wszystkie, stan.wszystkie === 1 ? "list w akcji" : "listów w akcji"],
    [stan.wolne, "czeka na darczyńcę"],
  ];
  if (termin) pozycje.push([termin, "ostatni dzień na prezent"]);

  return (
    <dl className="licznik" aria-live="polite">
      {pozycje.map(([wartosc, opis]) => (
        <div key={opis}>
          <dd>{wartosc}</dd>
          <dt>{opis}</dt>
        </div>
      ))}
    </dl>
  );
}
