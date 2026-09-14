"use client";

import { useState } from "react";

// Podglad tego, co zobaczy darczynca.
//
// Redaktor zatwierdzal publikacje, nie widzac efektu — przy danych dzieci
// to zbyt duze ryzyko. Podglad pokazuje WYLACZNIE pola jawne, dokladnie
// te same, ktore zwracaja zapytania publiczne. Jesli czegos tu nie ma,
// to znaczy, ze nie trafi na strone.
export default function Podglad({ pola }) {
  const [otwarty, setOtwarty] = useState(false);
  const [dane, setDane] = useState(null);

  function pokaz() {
    const formularz = document.querySelector("form.formularz-admin");
    if (!formularz) return;
    const f = new FormData(formularz);
    setDane({
      imie: String(f.get("imie") || "").trim(),
      wiek: String(f.get("wiek") || "").trim(),
      wojewodztwo: String(f.get("wojewodztwo") || "").trim(),
      kategoria: String(f.get("kategoria") || "").trim(),
      marzenie: String(f.get("marzenie") || "").trim(),
      rozmiar: String(f.get("rozmiar") || "").trim(),
      opis: String(f.get("opis") || "").trim(),
      zdjecieUrl: String(f.get("zdjecieUrl") || "").trim(),
      numer: pola?.numer,
    });
    setOtwarty(true);
  }

  return (
    <>
      <button type="button" className="btn drugorzedny" onClick={pokaz}>
        Podejrzyj jak zobaczy darczyńca
      </button>

      {otwarty && dane && (
        <div className="podglad-tlo" role="dialog" aria-modal="true" aria-label="Podgląd publiczny listu">
          <div className="podglad-okno">
            <div className="naglowek-rzad" style={{ marginBottom: "var(--o-4)" }}>
              <h2 style={{ fontSize: "var(--t-xl)" }}>Tak zobaczy to darczyńca</h2>
              <button type="button" className="btn drugorzedny" onClick={() => setOtwarty(false)}>
                Zamknij
              </button>
            </div>

            <div className="karta" style={{ maxWidth: 320 }}>
              <div className="karta-listu-zdjecie">
                {dane.zdjecieUrl ? (
                  <img src={dane.zdjecieUrl} alt={"Zdjęcie listu napisanego przez " + dane.imie} />
                ) : (
                  <div className="karta-listu-zastepnik">
                    <span>{dane.numer ? "list nr " + dane.numer : "brak zdjęcia"}</span>
                  </div>
                )}
                <span className="plakietka plakietka-wolny" style={{ position: "absolute", top: "var(--o-3)", left: "var(--o-3)" }}>
                  Czeka na darczyńcę
                </span>
              </div>
              <div className="karta-tresc">
                <h3 style={{ fontSize: "var(--t-lg)" }}>
                  {dane.imie || "—"}, {dane.wiek || "?"} lat
                </h3>
                <p className="drobny cichy" style={{ margin: "var(--o-1) 0 var(--o-3)" }}>
                  woj. {(dane.wojewodztwo || "—").toLowerCase()} · {(dane.kategoria || "—").toLowerCase()}
                  {dane.rozmiar ? ` · rozmiar ${dane.rozmiar}` : ""}
                </p>
                <p className="maly" style={{ margin: 0 }}>{dane.marzenie || "—"}</p>
              </div>
            </div>

            {dane.opis && (
              <div style={{ marginTop: "var(--o-5)" }}>
                <p className="drobny cichy">Opis pod zdjęciem na stronie listu:</p>
                <p className="maly czytanie">{dane.opis}</p>
              </div>
            )}

            <p className="komunikat komunikat-info maly" style={{ marginTop: "var(--o-5)" }}>
              Widoczne są wyłącznie pola z tego podglądu. Nazwa placówki, dane
              kontaktowe i notatki wewnętrzne nie opuszczają panelu.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
