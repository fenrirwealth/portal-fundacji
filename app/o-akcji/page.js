import Link from "next/link";
import { ArrowUpRight, Check, Gift, ShieldCheck, Sparkles } from "lucide-react";

export const metadata = {
  title: "O akcji",
  description: "Poznaj zasady i standardy bezpieczeństwa akcji Listy do Świętego Mikołaja.",
  alternates: { canonical: "/o-akcji" },
};

export default function OAkcji() {
  return (
    <main className="o-akcji-premium">
      <div className="o-akcji-swiatlo o-akcji-swiatlo-gorne" aria-hidden="true" />
      <div className="o-akcji-swiatlo o-akcji-swiatlo-boczne" aria-hidden="true" />
      <div className="o-akcji-gwiazdy" aria-hidden="true" />

      <div className="o-akcji-wrap">
        <header className="o-akcji-hero">
          <span className="o-akcji-znak" aria-hidden="true"><Sparkles /></span>
          <p className="o-akcji-nadtytul">Fundacja Lepszy Dom Lepsze Jutro</p>
          <h1>Magia świąt, <em>za którą stoi odpowiedzialność.</em></h1>
          <p className="o-akcji-wstep">
            Łączymy zweryfikowane placówki z osobami, które chcą przygotować prezent dla konkretnego dziecka.
            Fundacja prowadzi list przez cały proces: od sprawdzenia treści, przez rezerwację, aż po bezpieczne przekazanie podarunku.
          </p>
        </header>

        <section className="o-akcji-karty" aria-label="Standardy akcji">
          <article className="o-akcji-karta">
            <div className="o-akcji-karta-ikona" aria-hidden="true"><ShieldCheck /></div>
            <p className="o-akcji-karta-numer" aria-hidden="true">01</p>
            <h2>Chronimy prywatność dzieci</h2>
            <p>
              Nie publikujemy nazwisk, adresów, nazw placówek, miejscowości ani wizerunku dzieci.
              Pokazujemy wyłącznie ręcznie zweryfikowany zakres informacji potrzebny do przygotowania prezentu.
            </p>
          </article>
          <article className="o-akcji-karta">
            <div className="o-akcji-karta-ikona" aria-hidden="true"><Gift /></div>
            <p className="o-akcji-karta-numer" aria-hidden="true">02</p>
            <h2>Nie zostawiamy dziecka bez prezentu</h2>
            <p>
              Rezerwacja ma termin, a Fundacja kontroluje jej realizację. Jeśli ktoś nie może dokończyć pomocy,
              list wraca do puli i może znaleźć kolejnego Mikołaja.
            </p>
          </article>
        </section>

        <section className="o-akcji-zasady">
          <div className="o-akcji-zasady-wstep">
            <p className="o-akcji-sekcja-etykieta">Bezpieczna droga prezentu</p>
            <h2>Najważniejsze zasady</h2>
            <p>Każdy etap ma jasne reguły, dzięki którym pomoc pozostaje bezpieczna, odpowiedzialna i naprawdę trafia tam, gdzie jest potrzebna.</p>
          </div>
          <ul>
            <li><span aria-hidden="true"><Check /></span>jedna osoba może mieć jeden aktywny list naraz,</li>
            <li><span aria-hidden="true"><Check /></span>na potwierdzenie rezerwacji są 3 dni,</li>
            <li><span aria-hidden="true"><Check /></span>prezent trafia najpierw do Fundacji, gdzie jest sprawdzany i pakowany,</li>
            <li><span aria-hidden="true"><Check /></span>nie trzeba kupować wszystkich rzeczy wymienionych w liście,</li>
            <li><span aria-hidden="true"><Check /></span>liczy się bezpieczeństwo, adekwatność prezentu i dotrzymanie terminu.</li>
          </ul>
          <div className="o-akcji-akcje">
            <Link className="btn btn-magiczny btn-duzy" href="/listy">Zobacz listy dzieci <ArrowUpRight aria-hidden="true" /></Link>
            <Link className="btn o-akcji-btn-szklany btn-duzy" href="/regulamin">Przeczytaj regulamin</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
