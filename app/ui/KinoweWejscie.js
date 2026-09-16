"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Szron = dynamic(() => import("./SzronWebGL"), { ssr: false });
const KLUCZ = "portal-intro-v1";
const TEKSTY = ["Każda wielka magia zaczyna się od małego gestu.", "Za chwilę poznasz marzenia, które mogą się spełnić.", "Być może właśnie dzięki Tobie."];

// Intro is a short welcome, not a fictitious network-progress indicator.
// Native dialog supplies focus containment, Escape and inert background.
export default function KinoweWejscie() {
  const dialog = useRef(null);
  const [etap, setEtap] = useState(0);
  const [grafika, setGrafika] = useState(false);
  useEffect(() => {
    const mniej = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Nie przejmuj przewijania, gdy użytkownik wszedł bezpośrednio do
    // konkretnej sekcji. Modal potrafił wtedy zostawić stronę w połowie hero.
    if (window.location.hash || mniej.matches || (/** @type {any} */ (navigator)).connection?.saveData) return;
    try {
      if (sessionStorage.getItem(KLUCZ)) return;
      sessionStorage.setItem(KLUCZ, "1");
    } catch { return; } // Unavailable storage must not repeat the introduction.
    const el = dialog.current;
    const poprzedni = document.activeElement;
    el.showModal();
    const tlo = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const zamknij = () => {
      el.close();
      document.documentElement.style.overflow = tlo;
      setGrafika(false);
      if (poprzedni instanceof HTMLElement) poprzedni.focus({ preventScroll: true });
    };
    const klatka = requestAnimationFrame(() => setGrafika(true));
    const zmiany = [setTimeout(() => setEtap(1), 1200), setTimeout(() => setEtap(2), 2400), setTimeout(zamknij, 3600)];
    el.addEventListener("close", zamknij);
    mniej.addEventListener("change", zamknij);
    return () => {
      cancelAnimationFrame(klatka);
      zmiany.forEach(clearTimeout);
      el.removeEventListener("close", zamknij);
      mniej.removeEventListener("change", zamknij);
      zamknij();
    };
  }, []);
  return (
    <dialog ref={dialog} className="kino-intro" aria-labelledby="intro-tytul">
      {grafika && <Szron />}
      <div className="intro-szron-css" aria-hidden="true" />
      <div className="intro-tresc">
        <span className="intro-pieczec" aria-hidden="true">✦</span>
        <p className="nadtytul">Fundacja Lepszy Dom Lepsze Jutro</p>
        <h2 id="intro-tytul">Otwórz się<br />na <em>magię dobra.</em></h2>
        <p className="intro-zdanie" key={etap}>{TEKSTY[etap]}</p>
        <span className="intro-postep" aria-hidden="true"><span /></span>
        <button autoFocus className="intro-pomin" onClick={() => dialog.current.close()}>Pomiń animację <span aria-hidden="true">↗</span></button>
      </div>
    </dialog>
  );
}
