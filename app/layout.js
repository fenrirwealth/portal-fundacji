import "./globals.css";
import { auth, signOut } from "../auth";

export const metadata = {
  title: {
    default: "Fundacja Lepszy Dom Lepsze Jutro",
    template: "%s — Fundacja Lepszy Dom Lepsze Jutro",
  },
  description:
    "Pomagamy osobom w trudnej sytuacji mieszkaniowej i wspieramy dzieci z placowek opiekunczo-wychowawczych.",
};

export default async function Layout({ children }) {
  const sesja = await auth();
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a className="skip" href="#tresc">Przejdz do tresci</a>

        <header>
          <div className="wrap nawig">
            <a className="logo" href="/">
              Lepszy Dom<span>Lepsze Jutro</span>
            </a>
            <nav>
              <a href="/listy">Listy dzieci</a>
              {sesja?.user ? (
                <>
                  <a href="/moje-rezerwacje">Moje rezerwacje</a>
                  {/* Wylogowanie musi byc widoczne, skoro prosimy o nie
                      przy komputerach wspoldzielonych. Jako formularz,
                      nie odnosnik — wylogowanie zmienia stan i nie moze
                      sie wykonac przez samo wejscie na adres. */}
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                    style={{ display: "inline" }}
                  >
                    <button
                      type="submit"
                      style={{ background: "none", border: 0, padding: 0,
                               font: "inherit", color: "var(--atrament2)", cursor: "pointer" }}
                    >
                      Wyloguj ({sesja.user.email})
                    </button>
                  </form>
                </>
              ) : (
                <a href="/zaloguj">Zaloguj sie</a>
              )}
              <a href="https://fundacjalepszydomlepszejutro.pl">Strona fundacji</a>
            </nav>
          </div>
        </header>

        <main id="tresc">{children}</main>

        <footer>
          <div className="wrap">
            <p className="nota">
              Fundacja Lepszy Dom Lepsze Jutro · Zlota 75A/7, 00-819 Warszawa ·
              KRS 0000971976 · NIP 5273002294 · REGON 522030190
            </p>
            <p className="nota">
              Przy kazdym liscie publikujemy imie, wiek, wojewodztwo, opis marzenia i kategorie prezentu, w razie potrzeby rozmiar ubrania lub buta, oraz zdjecie listu przygotowane przez Fundacje. Nie
              publikujemy nazwisk, nazwy placowki, miejscowosci, adresu ani wizerunku dziecka.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
