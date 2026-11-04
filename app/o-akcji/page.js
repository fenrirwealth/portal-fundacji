import Link from "next/link";
import Image from "next/image";
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
            Pomagamy dzieciom z domów dziecka, placówek opiekuńczych i rodzin zastępczych spotkać osoby, które chcą spełnić ich świąteczne marzenia.
            Fundacja prowadzi list przez cały proces: od sprawdzenia treści, przez rezerwację, aż po bezpieczne przekazanie podarunku.
          </p>
        </header>

        <section className="akcja-plakat" aria-labelledby="akcja-plakat-tytul">
          <div className="akcja-plakat-tekst">
            <p className="akcja-plakat-edycja">5. Świąteczna Zbiórka Pełna Miłości</p>
            <h2 id="akcja-plakat-tytul">Podaruj magię Świąt <em>prosto z serca.</em></h2>
            <p>Jeden prezent, jeden wybrany list, jedna dobra wiadomość: ktoś pamięta. Dołącz do naszej piątej edycji i pomóż przygotować świąteczne podarunki dla dzieci i młodzieży.</p>
            <div className="akcja-plakat-termin"><span>Prezenty przyjmujemy do</span><strong>11 grudnia 2026</strong></div>
            <h3>Co możesz podarować?</h3>
            <ul className="akcja-plakat-dary"><li>Klocki LEGO, gry planszowe i puzzle</li><li>Książki, zabawki i zestawy kreatywne</li><li>Kosmetyki i upominki dla młodzieży</li></ul>
            <p className="akcja-plakat-dopisek">Wybierz list, aby poznać konkretne marzenia. Możesz też pomóc dotrzeć do kolejnych darczyńców — wydrukuj plakat i powieś go w sklepie, biurze lub miejscu spotkań.</p>
            <div className="akcja-plakat-przyciski"><Link className="btn btn-magiczny btn-duzy" href="/listy">Wybierz list <ArrowUpRight aria-hidden="true" /></Link><a className="btn o-akcji-btn-szklany btn-duzy" href="/api/dekoracje/plakat" download>Pobierz plakat</a></div>
            <p className="akcja-plakat-kontakt">Chcesz przekazać dary lub zorganizować zbiórkę?<br /><a href="tel:+48570747779">570 747 779</a><span aria-hidden="true"> · </span><a href="mailto:kontakt@fundacjalepszydomlepszejutro.pl">Napisz do Fundacji</a></p>
          </div>
          <figure className="akcja-plakat-figura"><a href="https://fundacjalepszydomlepszejutro.pl/assets/kampanie/plakat-swieta-2026.png" target="_blank" rel="noopener noreferrer" aria-label="Otwórz plakat w pełnej rozdzielczości"><Image src="https://fundacjalepszydomlepszejutro.pl/assets/kampanie/plakat-swieta-2026.webp" alt="Czerwono-złoty plakat piątej Świątecznej Zbiórki Pełnej Miłości. Termin: 11 grudnia 2026." width={930} height={1311} sizes="(max-width: 800px) 90vw, 480px" unoptimized /></a><figcaption>Udostępnij plakat. Zaproś innych do pomagania.</figcaption></figure>
        </section>

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
            <li><span aria-hidden="true"><Check /></span>w ciągu 48 godzin zadzwoń do Fundacji — administrator musi potwierdzić rozmowę w portalu,</li>
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
