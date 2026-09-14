import { licznik, aktywnaEdycja, formatujTermin } from "../lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const KROKI = [
  ["Zakładasz konto", "Bez hasła. Wysyłamy link na e-mail, którego użyjemy też do kontaktu w sprawie akcji."],
  ["Rezerwujesz list", "Jeden list naraz. Masz 3 dni na potwierdzenie, potem wraca do puli i wybierze go ktoś inny."],
  ["Kupujesz prezent", "Nie musisz spełniać całego marzenia. Paczkę przywozisz nieowiniętą — sprawdzamy zawartość."],
  ["My przekazujemy", "Pakujemy i wieziemy do placówki. Dziecko nie dowiaduje się, że ktoś się rozmyślił."],
];

export default async function Start() {
  // Strona główna celowo pobiera z bazy tylko licznik i to w bloku
  // obsługi błędów. Gdyby baza padła, treść i wezwanie do działania
  // nadal się wyświetlą — zniknie wyłącznie jedno zdanie z liczbami.
  let stan = null;
  let termin = null;
  try {
    stan = await licznik();
    const edycja = await aktywnaEdycja();
    termin = formatujTermin(edycja?.terminDostarczenia);
  } catch {}

  const saNaListy = stan && stan.wszystkie > 0;

  return (
    <>
      <section style={{ background: "var(--tlo-odwrocone)", color: "var(--tekst-odwrocony)" }}>
        <div className="wrap" style={{ paddingBlock: "var(--o-9)" }}>
          <div style={{ maxWidth: "20ch" }}>
            <h1 style={{ fontSize: "var(--t-4xl)", color: "var(--papier-50)" }}>
              Listy do Świętego Mikołaja
            </h1>
          </div>

          <p className="czytanie" style={{ fontSize: "var(--t-lg)", color: "color-mix(in srgb, var(--papier-100) 78%, transparent)", marginTop: "var(--o-5)" }}>
            Dzieci z placówek opiekuńczo-wychowawczych napisały, o czym marzą.
            Wybierz list, kup prezent i przywieź go do nas — resztą zajmiemy się my.
          </p>

          <div style={{ display: "flex", gap: "var(--o-3)", flexWrap: "wrap", marginTop: "var(--o-6)" }}>
            <Link className="btn btn-duzy" href="/listy">
              {saNaListy ? "Zobacz listy dzieci" : "Zobacz akcję"}
            </Link>
            <Link className="btn btn-duzy btn-cichy" href="/zglos-placowke"
               style={/** @type {any} */ ({ "--btn-tekst": "var(--papier-100)", "--btn-krawedz": "color-mix(in srgb, var(--papier-100) 35%, transparent)" })}>
              Zgłoś placówkę
            </Link>
          </div>

          {/* Liczby pokazujemy TYLKO gdy są prawdziwe. Pusty licznik
              w dniu startu kampanii jest uczciwszy niż wymyślona statystyka. */}
          {saNaListy && (
            <p style={{ marginTop: "var(--o-6)", color: "color-mix(in srgb, var(--papier-100) 65%, transparent)", fontSize: "var(--t-sm)" }}>
              W akcji jest {stan.wszystkie}{" "}
              {stan.wszystkie === 1 ? "list" : "listów"}, z czego {stan.wolne}{" "}
              {stan.wolne === 1 ? "czeka" : "czeka"} na darczyńcę
              {termin ? ` · prezenty przyjmujemy do ${termin}` : ""}.
            </p>
          )}
        </div>
      </section>

      <section className="wrap sekcja">
        <h2 style={{ fontSize: "var(--t-2xl)" }}>Jak to działa</h2>
        <p className="czytanie cichy" style={{ marginTop: "var(--o-3)" }}>
          Prezenty przechodzą przez Fundację. Dzięki temu żadne dziecko nie zostaje
          z pustymi rękami, jeśli darczyńca się rozmyśli albo nie zdąży.
        </p>

        <ol className="siatka siatka-4" style={{ marginTop: "var(--o-6)", listStyle: "none", padding: 0, counterReset: "krok" }}>
          {KROKI.map(([tytul, opis], i) => (
            <li key={tytul} className="karta karta-tresc" style={{ background: "transparent", borderColor: "var(--linia)" }}>
              <span aria-hidden="true" style={{
                fontFamily: "var(--krój-tytuł)", fontSize: "var(--t-2xl)",
                color: "var(--bursztyn-400)", lineHeight: 1, display: "block", marginBottom: "var(--o-3)",
              }}>
                {i + 1}
              </span>
              <h3 style={{ fontSize: "var(--t-lg)", marginBottom: "var(--o-2)" }}>{tytul}</h3>
              <p className="maly cichy">{opis}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap" style={{ paddingBottom: "var(--o-9)" }}>
        <div className="karta karta-tresc pasek-zachety">
          <div>
            <h2 style={{ fontSize: "var(--t-xl)", marginBottom: "var(--o-2)" }}>Prowadzisz placówkę?</h2>
            <p className="maly cichy czytanie" style={{ margin: 0 }}>
              Zgłoś udział, a prześlemy blankiety listów, wzór zgody dyrektora
              i regulamin akcji. Danych dzieci nie podaje się w formularzu.
            </p>
          </div>
          <Link className="btn btn-cichy" href="/zglos-placowke">Formularz zgłoszenia</Link>
        </div>
      </section>
    </>
  );
}
