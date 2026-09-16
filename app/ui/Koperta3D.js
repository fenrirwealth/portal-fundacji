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
  const [przechyl, setPrzechyl] = useState(null);
  const [czujnik, setCzujnik] = useState(false);
  const [komunikat, setKomunikat] = useState("");
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
  useEffect(() => {
    if (!czujnik) return;
    const zmiana = (e) => {
      if (e.gamma === null || e.beta === null) return;
      setPrzechyl({ x: Math.max(-1, Math.min(1, e.gamma / 35)), y: Math.max(-1, Math.min(1, (e.beta - 45) / 35)) });
    };
    window.addEventListener("deviceorientation", zmiana, { passive: true });
    return () => window.removeEventListener("deviceorientation", zmiana);
  }, [czujnik]);
  async function wlaczCzujnik() {
    try {
      const Sensor = /** @type {any} */ (window).DeviceOrientationEvent;
      if (!Sensor) { setKomunikat("To urządzenie nie udostępnia czujnika ruchu."); return; }
      if (Sensor.requestPermission && await Sensor.requestPermission() !== "granted") {
        setKomunikat("Możesz nadal poruszać kopertą palcem."); return;
      }
      setCzujnik(true); setKomunikat("Delikatnie przechyl telefon.");
    } catch { setKomunikat("Czujnik niedostępny. Użyj dotyku."); }
  }
  const czyOtwarta = otwarta || podglad;
  return <div className={`koperta-prezentacja ${czyOtwarta ? "koperta-prezentacja-otwarta" : ""}`} ref={kontener}>
    <div className="koperta-scena" aria-hidden="true">
      <div className="koperta-aura" />
      <div className="koperta-gwiazdy">{Array.from({ length: 16 }, (_, i) => <span key={i} style={/** @type {import("react").CSSProperties & Record<string, number>} */ ({ "--i": i })} />)}</div>
      <Image src="/magia/koperta.webp" alt="" fill sizes="(max-width: 760px) 90vw, 48vw" priority className={`koperta-fotografia ${czyOtwarta ? "koperta-fotografia-otwarta" : ""} ${webgl && gotowa ? "koperta-fotografia-ukryta" : ""}`} />
      {webgl && <BezpiecznaScena onFailure={() => setWebgl(false)}><Scena otwarta={czyOtwarta} aktywna={widoczna && ruch} przechyl={przechyl} onReady={() => setGotowa(true)} onFailure={() => { setWebgl(false); setGotowa(false); }} /></BezpiecznaScena>}
      <div className="koperta-reveal-copy"><small>Ten list czeka</small><strong>na swojego Mikołaja</strong><span>✦</span></div>
    </div>
    <p className="koperta-podpis">Mały list. <span>Wielka historia.</span></p>
    {webgl && gotowa && <div className="scena-kontrolki">
      <button type="button" aria-expanded={podglad} onClick={() => setPodglad(!podglad)}>{podglad ? "Zamknij kopertę" : "Zajrzyj do środka"}</button>
      <button type="button" aria-pressed={!ruch} onClick={() => setRuch(!ruch)}>{ruch ? "Zatrzymaj animację" : "Wznów animację"}</button>
      <button type="button" className="czujnik-przycisk" disabled={czujnik} onClick={wlaczCzujnik}>{czujnik ? "Czujnik włączony" : "Steruj przechyleniem"}</button>
    </div>}
    <span className="sr-only" role="status">{komunikat}</span>
  </div>;
}
