"use client";

import { useEffect } from "react";

// Lenis jest uruchamiany wyłącznie na urządzeniach z precyzyjnym
// wskaźnikiem. Na telefonie pozostaje natywny scroll, a ustawienie
// ograniczenia ruchu wyłącza całą warstwę animacji.
export default function PlynnyScroll() {
  useEffect(() => {
    const desktop = window.matchMedia("(pointer: fine) and (min-width: 900px)");
    const mniejRuchu = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!desktop.matches || mniejRuchu.matches) return undefined;

    let lenis;
    let klatka = 0;
    let aktywny = true;

    import("lenis").then(({ default: Lenis }) => {
      if (!aktywny) return;
      lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
      });

      const raf = (czas) => {
        lenis?.raf(czas);
        klatka = requestAnimationFrame(raf);
      };
      klatka = requestAnimationFrame(raf);
    });

    return () => {
      aktywny = false;
      cancelAnimationFrame(klatka);
      lenis?.destroy();
    };
  }, []);

  return null;
}
