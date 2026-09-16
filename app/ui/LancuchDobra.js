"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { normalizujLicznik } from "../../lib/licznik-widok.mjs";
import LiczbaAnimowana from "./LiczbaAnimowana";

/** @param {{poczatkowy: {wszystkie:number, wolne:number, majaMikolaja?:number, procent?:number}|null}} props */
export default function LancuchDobra({ poczatkowy }) {
  const [stan, setStan] = useState(poczatkowy);
  const [polaczenie, setPolaczenie] = useState("Łączenie z aktualizacjami…");
  const mniej = useReducedMotion();

  useEffect(() => {
    let zrodlo;
    const podlacz = () => {
      zrodlo?.close();
      if (document.hidden) return;
      zrodlo = new EventSource("/api/licznik");
      zrodlo.onmessage = (zdarzenie) => {
        try {
          const dane = normalizujLicznik(JSON.parse(zdarzenie.data));
          if (dane) { setStan(dane); setPolaczenie("Aktualizacja na żywo"); }
        } catch {}
      };
      zrodlo.onerror = () => setPolaczenie("Ponawiamy połączenie. Widoczne są ostatnie odebrane dane.");
    };
    podlacz();
    document.addEventListener("visibilitychange", podlacz);
    return () => { zrodlo?.close(); document.removeEventListener("visibilitychange", podlacz); };
  }, []);

  const dane = normalizujLicznik(stan);

  if (!dane || dane.wszystkie === 0) {
    return (
      <div className="lancuch-pusty">
        <span className="lancuch-gwiazda" aria-hidden="true">✦</span>
        <p><b>{dane ? "Listy są właśnie weryfikowane." : "Statystyki są chwilowo niedostępne."}</b><br />{dane ? "Opublikujemy je, gdy każdy będzie bezpieczny i gotowy." : "Ponawiamy połączenie — możesz nadal poznawać akcję."}</p>
      </div>
    );
  }

  const liczby = [
    [dane.wszystkie, "listów w akcji"],
    [dane.majaMikolaja, "ma już Mikołaja"],
    [dane.wolne, "wciąż czeka"],
    [dane.procent, "marzeń zaopiekowanych"],
  ];

  return (
    <div className="lancuch" aria-live="polite">
      <div className="lancuch-linia" aria-hidden="true">
        <motion.span style={{ width: "100%", transformOrigin: "left" }} initial={false} animate={{ scaleX: dane.procent / 100 }} transition={{ duration: mniej ? 0 : 1.2, ease: [.22,1,.36,1] }} />
      </div>
      <dl>
        {liczby.map(([wartosc, opis]) => (
          <div key={opis}>
            <dd><LiczbaAnimowana wartosc={wartosc} suffix={opis === "marzeń zaopiekowanych" ? "%" : ""} /></dd>
            <dt>{opis}</dt>
          </div>
        ))}
      </dl>
      <p className="drobny lancuch-opis">{polaczenie}. Dane zweryfikowanych listów aktywnej edycji.</p>
    </div>
  );
}
