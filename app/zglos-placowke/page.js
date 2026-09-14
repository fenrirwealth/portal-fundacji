"use client";

import { useState } from "react";
import Pole from "../ui/Pole";
import { useToast } from "../ui/Toast";
import Link from "next/link";

const WOJ = ["dolnoslaskie","kujawsko-pomorskie","lubelskie","lubuskie","lodzkie",
"malopolskie","mazowieckie","opolskie","podkarpackie","podlaskie","pomorskie",
"slaskie","swietokrzyskie","warminsko-mazurskie","wielkopolskie","zachodniopomorskie"];

// Walidacja po stronie przeglądarki jest WYŁĄCZNIE dla wygody — serwer
// sprawdza wszystko jeszcze raz. Tutaj chodzi o to, żeby użytkownik
// zobaczył błąd przy konkretnym polu, zanim wyśle formularz.
/**
 * @param {Record<string, any>} dane
 * @returns {{nazwa?: string, wojewodztwo?: string, email?: string, telefon?: string,
 *            osoba?: string, liczbaDzieci?: string, uwagi?: string}}
 */
function sprawdz(dane) {
  /** @type {Record<string, string>} */
  const bledy = {};
  if (!dane.nazwa || dane.nazwa.trim().length < 3) {
    bledy.nazwa = "Podaj nazwę placówki — co najmniej 3 znaki.";
  }
  if (!WOJ.includes((dane.wojewodztwo || "").toLowerCase())) {
    bledy.wojewodztwo = "Wybierz województwo z listy.";
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dane.email || "")) {
    bledy.email = "Podaj poprawny adres e-mail, np. dyrektor@placowka.pl";
  }
  if (dane.liczbaDzieci && !/\d/.test(dane.liczbaDzieci)) {
    bledy.liczbaDzieci = "Podaj liczbę, np. 12.";
  }
  return bledy;
}

export default function ZglosPlacowke() {
  const [stan, setStan] = useState("formularz");
  const [bledy, setBledy] = useState(/** @type {Record<string, string>} */ ({}));
  const toast = useToast();

  async function wyslij(e) {
    e.preventDefault();
    const dane = Object.fromEntries(new FormData(e.target).entries());

    const znalezione = sprawdz(dane);
    setBledy(znalezione);
    if (Object.keys(znalezione).length) {
      // Przenosimy uwagę na pierwsze błędne pole — przy siedmiu polach
      // sam czerwony tekst gdzieś na stronie łatwo przeoczyć.
      const pierwsze = document.getElementById(Object.keys(znalezione)[0]);
      pierwsze?.focus();
      pierwsze?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setStan("wysylam");
    try {
      const odp = await fetch("/api/placowka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dane),
      });
      const wynik = await odp.json();
      if (!odp.ok) {
        toast(wynik.blad || "Nie udało się wysłać zgłoszenia.", "blad");
        setStan("formularz");
        return;
      }
      setStan("wyslane");
    } catch {
      toast("Brak połączenia. Spróbuj jeszcze raz.", "blad");
      setStan("formularz");
    }
  }

  if (stan === "wyslane") {
    return (
      <div className="wrap sekcja">
        <div className="waski" style={{ marginInline: "auto" }}>
          <div className="komunikat komunikat-sukces" style={{ marginBottom: "var(--o-5)" }}>
            <span aria-hidden="true">✓</span>
            <span><b>Zgłoszenie przyjęte.</b></span>
          </div>
          <h1 style={{ fontSize: "var(--t-2xl)" }}>Dziękujemy</h1>
          <p className="cichy" style={{ marginTop: "var(--o-3)" }}>
            Odezwiemy się w ciągu kilku dni roboczych. Prześlemy blankiety listów
            do wydruku, wzór zgody na publikację oraz regulamin akcji.
          </p>
          <p className="cichy">
            Jeśli sprawa jest pilna, zadzwoń: <a href="tel:+48570747779">+48 570 747 779</a>.
          </p>
          <Link className="btn btn-cichy" href="/" style={{ marginTop: "var(--o-4)" }}>Wróć na stronę główną</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap sekcja">
      <div className="waski" style={{ marginInline: "auto" }}>
        <h1 style={{ fontSize: "var(--t-2xl)" }}>Zgłoś placówkę do akcji</h1>
        <p className="cichy" style={{ marginTop: "var(--o-3)" }}>
          Formularz dla placówek opiekuńczo-wychowawczych. Po zgłoszeniu przesyłamy
          komplet dokumentów: blankiety listów, wzór zgody dyrektora i regulamin.
        </p>

        <form onSubmit={wyslij} noValidate style={{ marginTop: "var(--o-6)" }}>
          <input type="text" name="strona" tabIndex={-1} autoComplete="off"
                 aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />

          <Pole id="nazwa" name="nazwa" etykieta="Nazwa placówki" wymagane blad={bledy.nazwa} />

          <Pole id="wojewodztwo" etykieta="Województwo" wymagane blad={bledy.wojewodztwo}
                dzieci={(props) => (
                  <select {...props} name="wojewodztwo" defaultValue="">
                    <option value="" disabled>wybierz z listy</option>
                    {WOJ.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                )} />

          <Pole id="osoba" name="osoba" etykieta="Osoba do kontaktu" blad={bledy.osoba} />

          <Pole id="email" name="email" typ="email" etykieta="Adres e-mail" wymagane
                blad={bledy.email} autoComplete="email"
                podpowiedz="Na ten adres wyślemy dokumenty." />

          <Pole id="telefon" name="telefon" typ="tel" etykieta="Telefon" blad={bledy.telefon} />

          <Pole id="liczbaDzieci" name="liczbaDzieci" etykieta="Ile dzieci weźmie udział"
                blad={bledy.liczbaDzieci} placeholder="orientacyjnie, np. 12"
                podpowiedz="Liczba pomaga nam zaplanować skalę akcji. Można ją później skorygować." />

          <Pole id="uwagi" etykieta="Uwagi" blad={bledy.uwagi}
                podpowiedz="Rzeczy zakazane regulaminem placówki, ograniczenia wiekowe, inne istotne informacje."
                dzieci={(props) => <textarea {...props} name="uwagi" rows={4} />} />

          <p className="komunikat komunikat-info maly" style={{ marginBottom: "var(--o-5)" }}>
            Danych dzieci nie podawaj w tym formularzu. Przy liście publikujemy imię,
            wiek, województwo, opis marzenia i kategorię prezentu, w razie potrzeby
            rozmiar, oraz zdjęcie listu przygotowane przez Fundację. Nie publikujemy
            nazwisk, nazwy placówki, miejscowości, adresu ani wizerunku dziecka.
            Każdy list wymaga pisemnej zgody dyrektora.
          </p>

          <button className="btn btn-pelny btn-duzy" type="submit"
                  disabled={stan === "wysylam"} aria-busy={stan === "wysylam"}>
            {stan === "wysylam" ? "Wysyłam…" : "Wyślij zgłoszenie"}
          </button>
        </form>
      </div>
    </div>
  );
}
