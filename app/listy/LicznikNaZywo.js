"use client";

import { useEffect, useState } from "react";

// Licznik odswiezany strumieniem Server-Sent Events.
// Gdy ktos nie potwierdzi rezerwacji w terminie, liczba wolnych listow
// rosnie na oczach osob, ktore akurat sa na stronie.
export default function LicznikNaZywo({ poczatkowy, termin }) {
  const [stan, setStan] = useState(poczatkowy);

  useEffect(() => {
    // Szanujemy ustawienie oszczedzania danych — bez tego strumien
    // trzymalby otwarte polaczenie takze na komorce w roamingu.
    if (navigator.connection && navigator.connection.saveData) return;

    const zrodlo = new EventSource("/api/licznik");
    zrodlo.onmessage = (e) => {
      try { setStan(JSON.parse(e.data)); } catch {}
    };
    // Przy bledzie NIE zamykamy strumienia. EventSource ponawia
    // polaczenie sam, z rosnacym odstepem; wywolanie close() wylaczaloby
    // ten mechanizm i licznik zamarzalby do konca wizyty. Zostawiamy
    // ostatnia znana wartosc na ekranie i czekamy na wznowienie.
    zrodlo.onerror = () => {};

    return () => zrodlo.close();
  }, []);

  return (
    <div className="licznik" aria-live="polite">
      <div>
        <b>{stan.wszystkie}</b>
        <span>{stan.wszystkie === 1 ? "list w akcji" : "listow w akcji"}</span>
      </div>
      <div>
        <b>{stan.wolne}</b>
        <span>czeka na darczynce</span>
      </div>
      {termin && (
        <div>
          <b>{termin}</b>
          <span>ostatni dzien na dostarczenie prezentu</span>
        </div>
      )}
    </div>
  );
}
