"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { wyloguj } from "../akcje-sesji";

/** @param {{email?: string | null}} props */
export default function Naglowek({ email }) {
  const sciezka = usePathname();
  const [przewiniety, setPrzewiniety] = useState(false);
  const stronaGlowna = sciezka === "/";

  useEffect(() => {
    if (!stronaGlowna) return;
    const sprawdz = () => setPrzewiniety(window.scrollY > 50);
    const klatka = requestAnimationFrame(sprawdz);
    window.addEventListener("scroll", sprawdz, { passive: true });
    return () => {
      cancelAnimationFrame(klatka);
      window.removeEventListener("scroll", sprawdz);
    };
  }, [stronaGlowna]);

  const wariant = stronaGlowna
    ? `naglowek-na-hero ${przewiniety ? "naglowek-przewiniety" : ""}`
    : "naglowek-jasny";

  return (
    <header className={`naglowek ${wariant}`}>
      <div className="wrap naglowek-tresc">
        <Link className="znak" href="/">
          <b>Listy do Mikołaja</b>
          <span>Lepszy Dom Lepsze Jutro</span>
        </Link>

        <nav className="menu" aria-label="Główna">
          <Link href="/listy">Listy dzieci</Link>
          <Link href="/#jak-to-dziala">Jak to działa</Link>
          <Link href="/o-akcji">O akcji</Link>
          <Link href="/fundusz-ostatniej-gwiazdki">Fundusz</Link>
          {email ? (
            <>
              <Link href="/moje-rezerwacje">Moje listy</Link>
              <span className="konto" title={email}>{email}</span>
              <form action={wyloguj}>
                <button type="submit" className="btn btn-tekstowy">Wyloguj</button>
              </form>
            </>
          ) : (
            <Link href="/zaloguj">Moje listy / Zaloguj się</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
