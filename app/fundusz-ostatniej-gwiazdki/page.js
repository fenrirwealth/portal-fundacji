import Link from "next/link";
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
    <div className="wrap sekcja"><div className="fundusz-hero">
      <p className="nadtytul"><span /> Nikt nie zostaje bez odpowiedzi</p>
      <h1>Fundusz Ostatniej Gwiazdki</h1>
      <p className="czytanie">Gdy do końca akcji zostają pojedyncze listy, Fundacja wykorzystuje ten fundusz, aby uzupełnić brakujące prezenty i bezpiecznie domknąć pomoc.</p>
    </div>

    <section className="siatka siatka-2 fundusz-tresc">
      <article className="karta karta-tresc">
        <h2>Na co przeznaczamy wpłaty?</h2>
        <ul className="czytanie cichy">
          <li>prezenty dla listów, które nadal czekają,</li>
          <li>uzupełnienie niekompletnych lub niedostarczonych paczek,</li>
          <li>bezpieczne pakowanie i przekazanie prezentów placówkom.</li>
        </ul>
      </article>
      <article className="karta karta-tresc konto-funduszu">
        <p className="nadtytul nadtytul-ciemny"><span /> Darowizna przelewem</p>
        {konto ? <>
          <p className="numer-konta">{konto}</p>
          <p className="maly cichy">Tytuł: <b>Fundusz Ostatniej Gwiazdki</b></p>
          <KopiujKonto konto={konto} />
        </> : <p className="maly cichy">Numer rachunku pojawi się po uruchomieniu funduszu. Do tego czasu skontaktuj się z Fundacją.</p>}
      </article>
    </section>

    <section className="pasek-finalowy" style={{ marginTop: "var(--o-7)" }}>
      <div><h2>Wolisz wybrać konkretny list?</h2><p>Każde marzenie ma swoją historię. Zobacz listy, które aktualnie czekają.</p></div>
      <Link className="btn btn-magiczny btn-duzy" href="/listy">Zobacz listy</Link>
    </section></div>
  );
}
