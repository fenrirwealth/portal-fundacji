import Link from "next/link";
import { ArrowUpRight, Check, Star } from "lucide-react";
import KopiujKonto from "./KopiujKonto";

export const metadata = {
  title: "Fundusz Ostatniej Gwiazdki",
  description: "Pomóż Fundacji zabezpieczyć prezenty dla listów, które nie znalazły swojego Mikołaja przed końcem akcji.",
  alternates: { canonical: "/fundusz-ostatniej-gwiazdki" },
};

export const dynamic = "force-dynamic";

export default function Fundusz() {
  const konto = process.env.NEXT_PUBLIC_DONATION_ACCOUNT || "";
  return (
    <main className="fundusz-premium">
      <div className="fundusz-blask" aria-hidden="true" />
      <Star className="fundusz-gwiazda-tlo" aria-hidden="true" />
      <div className="fundusz-pyl" aria-hidden="true" />

      <div className="fundusz-premium-wrap">
        <header className="fundusz-premium-hero">
          <span className="fundusz-gwiazda-znak" aria-hidden="true"><Star fill="currentColor" /></span>
          <p className="fundusz-premium-nadtytul">Nikt nie zostaje bez odpowiedzi</p>
          <h1>Fundusz <em>Ostatniej Gwiazdki</em></h1>
          <p>Gdy do końca akcji zostają pojedyncze listy, Fundacja wykorzystuje ten fundusz, aby uzupełnić brakujące prezenty i bezpiecznie domknąć pomoc.</p>
        </header>

        <div className="fundusz-moduly">
          <article className="fundusz-misja fundusz-szklo">
            <p className="fundusz-etykieta">Misja Funduszu</p>
            <h2>Na co przeznaczamy wpłaty?</h2>
            <ul>
              <li><span aria-hidden="true"><Check /></span>prezenty dla listów, które nadal czekają,</li>
              <li><span aria-hidden="true"><Check /></span>uzupełnienie niekompletnych lub niedostarczonych paczek,</li>
              <li><span aria-hidden="true"><Check /></span>bezpieczne pakowanie i przekazanie prezentów placówkom.</li>
            </ul>
          </article>

          <article className="fundusz-wplata fundusz-szklo">
            <span className="fundusz-wplata-gwiazda" aria-hidden="true"><Star fill="currentColor" /></span>
            <p className="fundusz-etykieta">Darowizna przelewem</p>
            <h2>Zostań Ostatnią Gwiazdką</h2>
            {konto ? <>
              <div className="fundusz-konto-panel">
                <p>Numer konta do wpłat</p>
                <p className="fundusz-numer-konta">{konto}</p>
                <p className="fundusz-tytul">Tytuł: <b>Fundusz Ostatniej Gwiazdki</b></p>
              </div>
              <KopiujKonto konto={konto} />
            </> : <p className="fundusz-brak-konta">Numer rachunku pojawi się po uruchomieniu funduszu. Do tego czasu skontaktuj się z Fundacją.</p>}
          </article>

          <section className="fundusz-wybor fundusz-szklo">
            <div>
              <h2>Wolisz wybrać konkretny list?</h2>
              <p>Każde marzenie ma swoją historię. Zobacz listy, które aktualnie czekają.</p>
            </div>
            <Link className="btn btn-magiczny btn-duzy" href="/listy">Zobacz listy <ArrowUpRight aria-hidden="true" /></Link>
          </section>
        </div>
      </div>
    </main>
  );
}
