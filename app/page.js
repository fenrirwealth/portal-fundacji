import { licznik } from "../lib/db";

export const dynamic = "force-dynamic";

export default async function Start() {
  // Strona glowna portalu celowo pobiera z bazy tylko licznik.
  // Gdyby baza padla, nadal wyswietli sie tresc i przycisk.
  let stan = null;
  try {
    stan = await licznik();
  } catch {}

  return (
    <>
      <div className="hero">
        <div className="wrap">
          <h1>Listy do Swietego Mikolaja</h1>
          <p>
            Dzieci z placowek opiekunczo-wychowawczych napisaly, o czym marza.
            Wybierz list, kup prezent i przywiez go do nas — reszta zajmiemy
            sie my.
          </p>
          <a className="btn-duzy" href="/listy">Zobacz listy</a>
        </div>
      </div>

      <div className="wrap sekcja">
        <h2 className="tytul">Cztery kroki</h2>
        <p className="wstep">
          Prezenty przechodza przez fundacje. Dzieki temu zadne dziecko nie
          zostaje z pustymi rekami, jesli darczynca sie rozmysli.
        </p>

        <div className="siatka" style={{ marginTop: 30 }}>
          <div className="list" style={{ padding: 22 }}>
            <h3>1. Zakladasz konto</h3>
            <p className="meta" style={{ marginTop: 8 }}>
              Potrzebujemy kontaktu, zeby przypomniec o terminie.
            </p>
          </div>
          <div className="list" style={{ padding: 22 }}>
            <h3>2. Rezerwujesz list</h3>
            <p className="meta" style={{ marginTop: 8 }}>
              Masz 3 dni na potwierdzenie, potem list wraca do puli.
            </p>
          </div>
          <div className="list" style={{ padding: 22 }}>
            <h3>3. Kupujesz prezent</h3>
            <p className="meta" style={{ marginTop: 8 }}>
              Dostarczasz go do siedziby fundacji do 7 grudnia, nieowiniety.
            </p>
          </div>
          <div className="list" style={{ padding: 22 }}>
            <h3>4. My przekazujemy</h3>
            <p className="meta" style={{ marginTop: 8 }}>
              Sprawdzamy zawartosc, pakujemy i wieziemy do placowki.
            </p>
          </div>
        </div>

        {stan && stan.wszystkie > 0 && (
          <p style={{ marginTop: 28, color: "var(--atrament2)" }}>
            W akcji jest teraz {stan.wszystkie} listow, z czego {stan.wolne}{" "}
            czeka na darczynce.
          </p>
        )}
      </div>
    </>
  );
}
