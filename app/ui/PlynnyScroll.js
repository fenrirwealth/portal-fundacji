"use client";

import { useEffect } from "react";

// Lenis jest uruchamiany wyłącznie na urządzeniach z precyzyjnym
// wskaźnikiem. Na telefonie pozostaje natywny scroll, a ustawienie
// ograniczenia ruchu wyłącza całą warstwę animacji.
export default function PlynnyScroll() {
  useEffect(() => {
    const desktop = window.matchMedia("(pointer: fine) and (min-width: 900px)");
    const mniejRuchu = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis;
    let klatka = 0;
    let aktywny = true;
    let wersja = 0;
    const raf = (czas) => { lenis?.raf(czas); klatka = requestAnimationFrame(raf); };
    const konfiguruj = async () => {
      const biezaca = ++wersja;
      cancelAnimationFrame(klatka);
      lenis?.destroy(); lenis = null;
      if (!desktop.matches || mniejRuchu.matches || document.hidden) return;
      try {
        const { default: Lenis } = await import("lenis");
        if (!aktywny || biezaca !== wersja) return;
        lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false, wheelMultiplier: .9, anchors: true, prevent: (node) => Boolean(node.closest("dialog")) });
        klatka = requestAnimationFrame(raf);
      } catch { /* Native scrolling remains available on a failed chunk. */ }
    };
    konfiguruj();
    desktop.addEventListener("change", konfiguruj);
    mniejRuchu.addEventListener("change", konfiguruj);
    document.addEventListener("visibilitychange", konfiguruj);

    return () => {
      aktywny = false;
      cancelAnimationFrame(klatka);
      lenis?.destroy();
      desktop.removeEventListener("change", konfiguruj);
      mniejRuchu.removeEventListener("change", konfiguruj);
      document.removeEventListener("visibilitychange", konfiguruj);
    };
  }, []);

  return null;
}
