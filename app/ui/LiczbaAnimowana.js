"use client";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

export default function LiczbaAnimowana({ wartosc, suffix = "" }) {
  const ref = useRef(null);
  const liczba = useRef(wartosc);
  const widoczna = useInView(ref, { once: true });
  const mniej = useReducedMotion();
  useEffect(() => {
    if (!widoczna || mniej) { ref.current.textContent = `${wartosc.toLocaleString("pl-PL")}${suffix}`; liczba.current = wartosc; return; }
    const animacja = animate(liczba.current, wartosc, { duration: 1.1, ease: [.22,1,.36,1], onUpdate: (n) => { liczba.current = n; if (ref.current) ref.current.textContent = `${Math.round(n).toLocaleString("pl-PL")}${suffix}`; } });
    return () => animacja.stop();
  }, [wartosc, suffix, widoczna, mniej]);
  return <><span aria-hidden="true" ref={ref}>{wartosc.toLocaleString("pl-PL")}{suffix}</span><span className="sr-only">{wartosc}{suffix}</span></>;
}
