"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import Koperta3D from "./Koperta3D";
import KinoweWejscie from "./KinoweWejscie";
import styl from "./HeroKontakt.module.css";
import { TELEFON_FUNDACJI, TELEFON_HREF, ZBIORKA_SIEPOMAGA_HREF } from "../../lib/zasady-akcji.mjs";

/** @param {{etykieta:string, saListy:boolean, termin:string|null, brakWolnychListow?:boolean}} props */
export default function HeroMagia({ etykieta, saListy, termin, brakWolnychListow = false }) {
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
    timer.current = setTimeout(() => window.location.assign("/listy/losowy"), 2850);
  }
  return <>
    <KinoweWejscie />
    <section className="hero-swieta hero-kino">
      <Image className="hero-tlo" src="/magia/noc.webp" alt="" fill sizes="100vw" priority />
      <div className="wrap hero-siatka">
        <div className="hero-copy">
          <p className="nadtytul"><span /> {etykieta}</p>
          {brakWolnychListow ? (
            <>
              <h1>Świąteczne paczki dla <em>naszych podopiecznych</em></h1>
              <p className="hero-opis">Wszystkie dostępne listy mają już swoich Mikołajów. Przygotujemy również paczki zbiorcze dla dzieci z domów dziecka i rodzin zastępczych. Twoja wpłata na Siepomaga pomoże nam kupić prezenty, które trafią do tych paczek.</p>
            </>
          ) : (
            <>
              <h1>Każdy list czeka na swojego <em>Mikołaja.</em></h1>
              <p className="hero-lead">Być może właśnie na Ciebie.</p>
              <p className="hero-opis">Dzieci napisały, o czym marzą. Ty możesz dopisać do tej historii piękne zakończenie. My zadbamy o bezpieczną drogę prezentu.</p>
            </>
          )}
          <div className="hero-akcje">
            {brakWolnychListow ? (
              <a className="btn btn-magiczny btn-duzy" href={ZBIORKA_SIEPOMAGA_HREF}>
                Wesprzyj zbiórkę na Siepomaga <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <Link className="btn btn-magiczny btn-duzy" href={saListy ? "/listy" : "#jak-to-dziala"}>
                {saListy ? "Zostań Mikołajem tego listu" : "Poznaj akcję"}<span aria-hidden="true">↗</span>
              </Link>
            )}
            {saListy && (
              <Link className="btn btn-szklany btn-duzy" href="/listy#katalog-listow">
                Przeglądaj listy dzieci
              </Link>
            )}
            {saListy && !brakWolnychListow && <Link prefetch={false} className="btn btn-szklany btn-duzy" href="/listy/losowy" onClick={losuj} aria-busy={otwarta}>{otwarta ? "Magia wybiera Twój list…" : "Niech list wybierze mnie"}</Link>}
          </div>
          {brakWolnychListow && <p className={styl.kontakt}>Więcej informacji pod numerem <a href={TELEFON_HREF}>{TELEFON_FUNDACJI}</a>.</p>}
          {termin && <p className="hero-termin">Prezenty przyjmujemy do {termin}.</p>}
          <p className="hero-zaufanie"><span aria-hidden="true">✧</span> Zweryfikowane listy. Chroniona prywatność. Prawdziwa pomoc.</p>
        </div>
        <Koperta3D otwarta={otwarta} />
      </div>
      <a className="hero-przewin" href="#jak-to-dziala"><span /> Poznaj drogę prezentu ↓</a>
    </section>
  </>;
}
