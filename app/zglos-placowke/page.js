"use client";

import { useState } from "react";

const WOJ = ["dolnoslaskie","kujawsko-pomorskie","lubelskie","lubuskie","lodzkie",
"malopolskie","mazowieckie","opolskie","podkarpackie","podlaskie","pomorskie",
"slaskie","swietokrzyskie","warminsko-mazurskie","wielkopolskie","zachodniopomorskie"];

const stylPola = {
  width: "100%", border: "1px solid var(--linia2)", borderRadius: 3,
  padding: "10px 12px", font: "15px 'IBM Plex Sans', sans-serif",
  marginBottom: 14, background: "var(--biel)", color: "var(--atrament)",
};

export default function ZglosPlacowke() {
  const [stan, setStan] = useState("formularz");
  const [blad, setBlad] = useState(null);

  async function wyslij(e) {
    e.preventDefault();
    setStan("wysylam");
    setBlad(null);
    const dane = Object.fromEntries(new FormData(e.target).entries());
    try {
      const odp = await fetch("/api/placowka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dane),
      });
      const wynik = await odp.json();
      if (!odp.ok) {
        setBlad(wynik.blad || "Nie udalo sie wyslac zgloszenia.");
        setStan("formularz");
        return;
      }
      setStan("wyslane");
    } catch {
      setBlad("Brak polaczenia. Sprobuj jeszcze raz.");
      setStan("formularz");
    }
  }

  if (stan === "wyslane") {
    return (
      <div className="wrap sekcja">
        <h1 className="tytul">Zgloszenie przyjete</h1>
        <p className="wstep">
          Odezwiemy sie w ciagu kilku dni roboczych. Przeslemy blankiety listow
          do wydruku, wzor zgody na publikacje oraz regulamin akcji.
        </p>
        <p className="wstep">
          Jesli sprawa jest pilna, zadzwon: <a href="tel:+48570747779">+48 570 747 779</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="wrap sekcja">
      <h1 className="tytul">Zglos placowke do akcji</h1>
      <p className="wstep">
        Formularz dla placowek opiekunczo-wychowawczych, ktore chca wziac udzial
        w akcji "Listy do Swietego Mikolaja". Po zgloszeniu przesylamy komplet
        dokumentow: blankiety listow, wzor zgody dyrektora i regulamin.
      </p>

      <form onSubmit={wyslij} style={{ maxWidth: 560, marginTop: 28 }}>
        <input type="text" name="strona" tabIndex={-1} autoComplete="off"
               aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />

        <label htmlFor="nazwa">Nazwa placowki *</label>
        <input id="nazwa" name="nazwa" required style={stylPola} />

        <label htmlFor="wojewodztwo">Wojewodztwo *</label>
        <select id="wojewodztwo" name="wojewodztwo" required defaultValue="" style={stylPola}>
          <option value="" disabled>wybierz</option>
          {WOJ.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>

        <label htmlFor="osoba">Osoba do kontaktu</label>
        <input id="osoba" name="osoba" style={stylPola} />

        <label htmlFor="email">Adres e-mail *</label>
        <input id="email" name="email" type="email" required style={stylPola} />

        <label htmlFor="telefon">Telefon</label>
        <input id="telefon" name="telefon" style={stylPola} />

        <label htmlFor="liczbaDzieci">Ile dzieci wezmie udzial</label>
        <input id="liczbaDzieci" name="liczbaDzieci" placeholder="orientacyjnie, np. 12" style={stylPola} />

        <label htmlFor="uwagi">Uwagi</label>
        <textarea id="uwagi" name="uwagi" rows={4} style={stylPola}
                  placeholder="Rzeczy zakazane regulaminem placowki, ograniczenia wiekowe, inne istotne informacje" />

        <p style={{ fontSize: 13, color: "var(--atrament2)" }}>
          Danych dzieci nie podawaj w tym formularzu. Przy liscie publikujemy
          imie, wiek, wojewodztwo, opis marzenia i kategorie prezentu, w razie potrzeby rozmiar ubrania lub buta, oraz zdjecie listu przygotowane przez Fundacje. Nie publikujemy nazwisk, nazwy placowki, miejscowosci, adresu ani wizerunku dziecka. Kazdy list
          wymaga pisemnej zgody dyrektora.
        </p>

        <button className="btn" type="submit" disabled={stan === "wysylam"} style={{ marginTop: 14 }}>
          {stan === "wysylam" ? "Wysylam…" : "Wyslij zgloszenie"}
        </button>

        {blad && (
          <p role="alert" style={{ color: "var(--czerwien)", fontSize: 13.5, marginTop: 10 }}>
            {blad}
          </p>
        )}
      </form>
    </div>
  );
}
