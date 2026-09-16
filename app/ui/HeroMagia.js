"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import Koperta3D from "./Koperta3D";
import KinoweWejscie from "./KinoweWejscie";

/** @param {{etykieta:string, saListy:boolean, termin:string|null}} props */
export default function HeroMagia({ etykieta, saListy, termin }) {
  const [otwarta, setOtwarta] = useState(false);
  const mniejRuchu = useReducedMotion();
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function losuj(e) {
    // Preserve normal browser semantics for modifiers and new tabs.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || mniejRuchu) return;
    e.preventDefault();
    if (otwarta) return;
    setOtwarta(true);
    // This is a redirecting Route Handler, not an RSC page. Fetch it once,
    // after the gesture, without Next prefetch caching a random selection.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    timer.current = setTimeout(() => window.location.assign("/listy/losowy"), 1450);
  }
  return <>
    <KinoweWejscie />
    <section className="hero-swieta hero-kino">
      <Image className="hero-tlo" src="/magia/noc.webp" alt="" fill sizes="100vw" priority />
      <div className="wrap hero-siatka">
        <div className="hero-copy">
          <p className="nadtytul"><span /> {etykieta}</p>
          <h1>Każdy list czeka na swojego <em>Mikołaja.</em></h1>
          <p className="hero-lead">Być może właśnie na Ciebie.</p>
          <p className="hero-opis">Dzieci napisały, o czym marzą. Ty możesz dopisać do tej historii piękne zakończenie. My zadbamy o bezpieczną drogę prezentu.</p>
          <div className="hero-akcje">
            <Link className="btn btn-magiczny btn-duzy" href={saListy ? "/listy" : "#jak-to-dziala"}>{saListy ? "Zostań Mikołajem tego listu" : "Poznaj akcję"}<span aria-hidden="true">↗</span></Link>
            {saListy && <Link prefetch={false} className="btn btn-szklany btn-duzy" href="/listy/losowy" onClick={losuj} aria-busy={otwarta}>{otwarta ? "Otwieramy Twoją historię…" : "Niech list wybierze mnie"}</Link>}
          </div>
          {termin && <p className="hero-termin">Prezenty przyjmujemy do {termin}.</p>}
          <p className="hero-zaufanie"><span aria-hidden="true">✧</span> Zweryfikowane listy. Chroniona prywatność. Prawdziwa pomoc.</p>
        </div>
        <Koperta3D otwarta={otwarta} />
      </div>
      <a className="hero-przewin" href="#jak-to-dziala"><span /> Poznaj drogę prezentu ↓</a>
    </section>
  </>;
}
