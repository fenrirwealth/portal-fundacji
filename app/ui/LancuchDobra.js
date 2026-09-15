"use client";

import { useEffect, useMemo, useState } from "react";

/** @param {{poczatkowy: {wszystkie:number, wolne:number, majaMikolaja?:number, procent?:number}|null}} props */
export default function LancuchDobra({ poczatkowy }) {
  const [stan, setStan] = useState(poczatkowy);

  useEffect(() => {
    if ((/** @type {any} */ (navigator)).connection?.saveData) return undefined;
    const zrodlo = new EventSource("/api/licznik");
    zrodlo.onmessage = (zdarzenie) => {
      try { setStan(JSON.parse(zdarzenie.data)); } catch {}
    };
    return () => zrodlo.close();
  }, []);

  const dane = useMemo(() => {
    if (!stan) return null;
    const maja = stan.majaMikolaja ?? Math.max(stan.wszystkie - stan.wolne, 0);
    const procent = stan.procent ?? (stan.wszystkie ? Math.round((maja / stan.wszystkie) * 100) : 0);
    return { ...stan, majaMikolaja: maja, procent };
  }, [stan]);

  if (!dane || dane.wszystkie === 0) {
    return (
      <div className="lancuch-pusty">
        <span className="lancuch-gwiazda" aria-hidden="true">✦</span>
        <p><b>Listy są właśnie weryfikowane.</b><br />Opublikujemy je, gdy każdy będzie bezpieczny i gotowy.</p>
      </div>
    );
  }

  const liczby = [
    [dane.wszystkie, "listów w akcji"],
    [dane.majaMikolaja, "ma już Mikołaja"],
    [dane.wolne, "wciąż czeka"],
    [`${dane.procent}%`, "marzeń zaopiekowanych"],
  ];

  return (
    <div className="lancuch" aria-live="polite">
      <div className="lancuch-linia" aria-hidden="true">
        <span style={{ width: `${Math.max(dane.procent, 2)}%` }} />
      </div>
      <dl>
        {liczby.map(([wartosc, opis]) => (
          <div key={opis}>
            <dd>{wartosc}</dd>
            <dt>{opis}</dt>
          </div>
        ))}
      </dl>
      <p className="drobny lancuch-opis">Liczby pochodzą bezpośrednio z aktywnej edycji i aktualizują się po zmianie statusu listu.</p>
    </div>
  );
}
