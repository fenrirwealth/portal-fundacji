import Link from "next/link";

export const metadata = {
  title: "O akcji",
  description: "Poznaj zasady i standardy bezpieczeństwa akcji Listy do Świętego Mikołaja.",
  alternates: { canonical: "/o-akcji" },
};

export default function OAkcji() {
  return (
    <div className="wrap sekcja">
      <header className="waski stos">
        <p className="nadtytul nadtytul-ciemny"><span /> O akcji</p>
        <h1 style={{ fontSize: "var(--t-3xl)" }}>Magia świąt, za którą stoi odpowiedzialność.</h1>
        <p className="czytanie cichy">
          Łączymy zweryfikowane placówki z osobami, które chcą przygotować prezent dla konkretnego dziecka.
          Fundacja prowadzi list przez cały proces: od sprawdzenia treści, przez rezerwację, aż po bezpieczne przekazanie podarunku.
        </p>
      </header>

      <section className="siatka siatka-2" style={{ marginTop: "var(--o-7)" }}>
        <article className="karta karta-tresc">
          <h2 style={{ fontSize: "var(--t-xl)" }}>Chronimy prywatność dzieci</h2>
          <p className="maly cichy" style={{ marginTop: "var(--o-3)" }}>
            Nie publikujemy nazwisk, adresów, nazw placówek, miejscowości ani wizerunku dzieci.
            Pokazujemy wyłącznie ręcznie zweryfikowany zakres informacji potrzebny do przygotowania prezentu.
          </p>
        </article>
        <article className="karta karta-tresc">
          <h2 style={{ fontSize: "var(--t-xl)" }}>Nie zostawiamy dziecka bez prezentu</h2>
          <p className="maly cichy" style={{ marginTop: "var(--o-3)" }}>
            Rezerwacja ma termin, a Fundacja kontroluje jej realizację. Jeśli ktoś nie może dokończyć pomocy,
            list wraca do puli i może znaleźć kolejnego Mikołaja.
          </p>
        </article>
      </section>

      <section className="karta karta-tresc" style={{ marginTop: "var(--o-6)" }}>
        <h2 style={{ fontSize: "var(--t-xl)" }}>Najważniejsze zasady</h2>
        <ul className="czytanie cichy">
          <li>jedna osoba może mieć jeden aktywny list naraz,</li>
          <li>na potwierdzenie rezerwacji są 3 dni,</li>
          <li>prezent trafia najpierw do Fundacji, gdzie jest sprawdzany i pakowany,</li>
          <li>nie trzeba kupować wszystkich rzeczy wymienionych w liście,</li>
          <li>liczy się bezpieczeństwo, adekwatność prezentu i dotrzymanie terminu.</li>
        </ul>
        <div style={{ display: "flex", gap: "var(--o-3)", flexWrap: "wrap", marginTop: "var(--o-5)" }}>
          <Link className="btn btn-duzy" href="/listy">Zobacz listy dzieci</Link>
          <Link className="btn btn-cichy btn-duzy" href="/regulamin">Przeczytaj regulamin</Link>
        </div>
      </section>
    </div>
  );
}
