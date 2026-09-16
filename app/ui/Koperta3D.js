"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState } from "react";

const Scena = dynamic(() => import("./ScenaKoperty"), { ssr: false });

export class BezpiecznaScena extends Component {
  state = { blad: false };
  static getDerivedStateFromError() { return { blad: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  render() { return this.state.blad ? null : this.props.children; }
}

/** @param {{otwarta?: boolean}} props */
export default function Koperta3D({ otwarta = false }) {
  const kontener = useRef(null);
  const [webgl, setWebgl] = useState(false);
  const [gotowa, setGotowa] = useState(false);
  const [widoczna, setWidoczna] = useState(true);
  const [ruch, setRuch] = useState(true);
  const [podglad, setPodglad] = useState(false);
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
  const czyOtwarta = otwarta || podglad;
  return <div className={`koperta-prezentacja ${czyOtwarta ? "koperta-prezentacja-otwarta" : ""}`} ref={kontener}>
    <div className="koperta-scena">
      <div className="koperta-aura" aria-hidden="true" />
      <div className="koperta-gwiazdy" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} style={/** @type {import("react").CSSProperties & Record<string, number>} */ ({ "--i": i })} />)}</div>
      <div className="koperta-list-dom" aria-hidden="true">
        <span>Każde marzenie</span>
        <strong>zasługuje na magię</strong>
        <i>✦</i>
      </div>
      <Image src="/magia/koperta.webp" alt="" fill sizes="(max-width: 760px) 90vw, 48vw" priority className={`koperta-fotografia ${czyOtwarta ? "koperta-fotografia-otwarta" : ""}`} />
      {webgl && <BezpiecznaScena onFailure={() => setWebgl(false)}><Scena otwarta={czyOtwarta} aktywna={widoczna && ruch} onReady={() => setGotowa(true)} onFailure={() => { setWebgl(false); setGotowa(false); }} /></BezpiecznaScena>}
      <div className="scena-kontrolki">
        <button className="scena-otworz" type="button" aria-expanded={podglad} onClick={() => setPodglad(!podglad)}>
          <span aria-hidden="true">{podglad ? "×" : "✦"}</span>
          {podglad ? "Zamknij kopertę" : "Zajrzyj do środka"}
        </button>
        {webgl && gotowa && <button className="scena-ruch" type="button" aria-pressed={!ruch} onClick={() => setRuch(!ruch)}>{ruch ? "Zatrzymaj śnieg" : "Wznów śnieg"}</button>}
      </div>
    </div>
    <p className="koperta-podpis">Mały list. <span>Wielka historia.</span></p>
  </div>;
}
