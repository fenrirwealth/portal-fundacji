// Szkielety ladowania. Wymiary odpowiadaja docelowej tresci, zeby
// uklad nie skakal w momencie podmiany — to wazniejsze niz sam efekt
// migotania, bo przeskok zawartosci jest odbierany jako blad strony.

export function SzkieletKarty() {
  return (
    <div className="karta" aria-hidden="true">
      <div className="szkielet" style={{ aspectRatio: "4 / 3", borderRadius: 0 }} />
      <div className="karta-tresc">
        <div className="szkielet szkielet-tekst" style={{ width: "55%", height: "1.2em" }} />
        <div className="szkielet szkielet-tekst" style={{ width: "35%" }} />
        <div className="szkielet szkielet-tekst" style={{ width: "85%", marginTop: 16 }} />
        <div className="szkielet szkielet-tekst" style={{ width: "70%" }} />
      </div>
    </div>
  );
}

export function SzkieletListy({ ile = 6 }) {
  return (
    <div className="siatka siatka-listy">
      {Array.from({ length: ile }, (_, i) => <SzkieletKarty key={i} />)}
      <span className="tylko-dla-czytnika" role="status">Wczytuje listy dzieci…</span>
    </div>
  );
}
