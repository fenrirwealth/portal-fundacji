"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { wyloguj } from "../akcje-sesji";

/** @param {{email?: string | null}} props */
export default function Naglowek({ email }) {
  const sciezka = usePathname();
  const [przewiniety, setPrzewiniety] = useState(false);
  const [menuOtwarte, setMenuOtwarte] = useState(false);
  const stronaKinowa = sciezka === "/" || sciezka === "/o-akcji" || sciezka === "/fundusz-ostatniej-gwiazdki" || sciezka === "/listy";

  useEffect(() => {
    if (!stronaKinowa) return;
    const sprawdz = () => setPrzewiniety(window.scrollY > 50);
    const klatka = requestAnimationFrame(sprawdz);
    window.addEventListener("scroll", sprawdz, { passive: true });
    return () => {
      cancelAnimationFrame(klatka);
      window.removeEventListener("scroll", sprawdz);
    };
  }, [stronaKinowa]);

  useEffect(() => {
    if (!menuOtwarte) return;
    const poprzedniOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const zamknijEscape = (event) => {
      if (event.key === "Escape") setMenuOtwarte(false);
    };
    window.addEventListener("keydown", zamknijEscape);
    return () => {
      document.body.style.overflow = poprzedniOverflow;
      window.removeEventListener("keydown", zamknijEscape);
    };
  }, [menuOtwarte]);

  const wariant = stronaKinowa
    ? `naglowek-na-hero ${przewiniety ? "naglowek-przewiniety" : ""}`
    : "naglowek-jasny";

  return (
    <header className={`naglowek ${wariant}`}>
      <div className="wrap naglowek-tresc">
        <Link className="znak" href="/">
          <b>Listy do Mikołaja</b>
          <span>Lepszy Dom Lepsze Jutro</span>
        </Link>

        <button
          className="menu-przycisk"
          type="button"
          aria-label={menuOtwarte ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={menuOtwarte}
          aria-controls="menu-glowne"
          onClick={() => setMenuOtwarte((otwarte) => !otwarte)}
        >
          {menuOtwarte ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav id="menu-glowne" className={`menu ${menuOtwarte ? "menu-otwarte" : ""}`} aria-label="Główna">
          <Link href="/listy" onClick={() => setMenuOtwarte(false)} aria-current={sciezka === "/listy" ? "page" : undefined}>Listy dzieci</Link>
          <Link href="/#jak-to-dziala" onClick={() => setMenuOtwarte(false)}>Jak to działa</Link>
          <Link href="/o-akcji" onClick={() => setMenuOtwarte(false)} aria-current={sciezka === "/o-akcji" ? "page" : undefined}>O akcji</Link>
          <Link href="/fundusz-ostatniej-gwiazdki" onClick={() => setMenuOtwarte(false)} aria-current={sciezka === "/fundusz-ostatniej-gwiazdki" ? "page" : undefined}>Fundusz</Link>
          {email ? (
            <>
              <Link href="/moje-rezerwacje" onClick={() => setMenuOtwarte(false)}>Moje listy</Link>
              <span className="konto" title={email}>{email}</span>
              <form action={wyloguj}>
                <button type="submit" className="btn btn-tekstowy">Wyloguj</button>
              </form>
            </>
          ) : (
            <Link href="/zaloguj" onClick={() => setMenuOtwarte(false)}>Moje listy / Zaloguj się</Link>
          )}
        </nav>
        {menuOtwarte && <button className="menu-tlo" type="button" aria-label="Zamknij menu" onClick={() => setMenuOtwarte(false)} />}
      </div>
    </header>
  );
}
