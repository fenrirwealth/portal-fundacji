"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState } from "react";

const Scena = dynamic(() => import("./ScenaKoperty"), { ssr: false });

const SKANY_LISTOW = Array.from(
  { length: 9 },
  (_, i) => `/archiwum/listy/list-${String(i + 1).padStart(2, "0")}.webp`,
);

export class BezpiecznaScena extends Component {
  state = { blad: false };
  static getDerivedStateFromError() { return { blad: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  render() { return this.state.blad ? null : this.props.children; }
}

/** @param {{otwarta?: boolean}} props */
export default function Koperta3D({ otwarta = false }) {
  const kontener = useRef(null);
  const poprzednioOtwarta = useRef(otwarta);
  const [webgl, setWebgl] = useState(false);
  const [widoczna, setWidoczna] = useState(true);
  const [podglad, setPodglad] = useState(false);
  const [aktywnyList, setAktywnyList] = useState(SKANY_LISTOW[0]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sprawdz = () => {
      let dostepny = false;
      if (!media.matches && !(/** @type {any} */ (navigator)).connection?.saveData) {
        try {
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
          dostepny = Boolean(gl);
          gl?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch {}
      }
      setWebgl(dostepny);
    };
    const klatka = requestAnimationFrame(sprawdz);
    media.addEventListener("change", sprawdz);
    const obserwator = new IntersectionObserver(([wpis]) => setWidoczna(wpis.isIntersecting && !document.hidden));
    obserwator.observe(kontener.current);
    const widok = () => setWidoczna(!document.hidden && kontener.current.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", widok);
    return () => { cancelAnimationFrame(klatka); media.removeEventListener("change", sprawdz); obserwator.disconnect(); document.removeEventListener("visibilitychange", widok); };
  }, []);
  useEffect(() => {
    if (otwarta && !poprzednioOtwarta.current) {
      setAktywnyList(SKANY_LISTOW[Math.floor(Math.random() * SKANY_LISTOW.length)]);
    }
    poprzednioOtwarta.current = otwarta;
  }, [otwarta]);

  function przelaczKoperte() {
    if (!podglad && !otwarta) {
      setAktywnyList(SKANY_LISTOW[Math.floor(Math.random() * SKANY_LISTOW.length)]);
    }
    if (!otwarta) setPodglad((stan) => !stan);
  }

  const czyOtwarta = otwarta || podglad;
  return <div className={`koperta-prezentacja ${czyOtwarta ? "koperta-prezentacja-otwarta" : ""}`} ref={kontener}>
    <button
      className="koperta-scena koperta-interakcja"
      type="button"
      aria-label={czyOtwarta ? "Schowaj list w kopercie" : "Otwórz magiczną kopertę"}
      aria-expanded={czyOtwarta}
      onClick={przelaczKoperte}
    >
      <div className="koperta-aura" aria-hidden="true" />
      <div className="koperta-gwiazdy" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} style={/** @type {import("react").CSSProperties & Record<string, number>} */ ({ "--i": i })} />)}</div>
      <div className="koperta-list-skan" aria-hidden="true">
        <Image src={aktywnyList} alt="" fill sizes="(max-width: 760px) 72vw, 360px" className="koperta-list-obraz" />
      </div>
      <Image src="/magia/koperta.webp" alt="" fill sizes="(max-width: 760px) 90vw, 48vw" priority className={`koperta-fotografia ${czyOtwarta ? "koperta-fotografia-otwarta" : ""}`} />
      {webgl && <BezpiecznaScena onFailure={() => setWebgl(false)}><Scena otwarta={czyOtwarta} aktywna={widoczna} onReady={() => {}} onFailure={() => setWebgl(false)} /></BezpiecznaScena>}
      <span className="koperta-instrukcja" aria-hidden="true">Kliknij kopertę, aby ją otworzyć <i>✦</i></span>
    </button>
    <p className="koperta-podpis">Mały list. <span>Wielka historia.</span></p>
  </div>;
}
