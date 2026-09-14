import "./globals.css";
import { auth, signOut } from "../auth";
import { ToastProvider } from "./ui/Toast";
import Link from "next/link";

export const metadata = {
  title: {
    default: "Fundacja Lepszy Dom Lepsze Jutro",
    template: "%s — Fundacja Lepszy Dom Lepsze Jutro",
  },
  description:
    "Pomagamy osobom w trudnej sytuacji mieszkaniowej i wspieramy dzieci z placowek opiekunczo-wychowawczych.",
};

export const viewport = {
  themeColor: "#F5F3EE",
  width: "device-width",
  initialScale: 1,
};

export default async function Layout({ children }) {
  const sesja = await auth();

  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Fraunces: krój o zmiennej optycznej wielkości — nagłówki mają
            inną proporcję niż tekst, tak jak w składzie książkowym.
            Inter do interfejsu, bo ma komplet polskich znaków i świetnie
            czyta się w małych rozmiarach. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <a className="skip" href="#tresc">Przejdź do treści</a>

          <header className="naglowek">
            <div className="wrap naglowek-tresc">
              <Link className="znak" href="/">
                <b>Lepszy Dom</b>
                <span>Lepsze Jutro</span>
              </Link>

              <nav className="menu" aria-label="Główna">
                <Link href="/listy">Listy dzieci</Link>
                {sesja?.user ? (
                  <>
                    <Link href="/moje-rezerwacje">Moje rezerwacje</Link>
                    <span className="konto" title={sesja.user.email}>{sesja.user.email}</span>
                    {/* Wylogowanie jako formularz, nie odnośnik: zmienia stan,
                        więc nie może wykonać się przez samo wejście na adres. */}
                    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                      <button type="submit" className="btn btn-tekstowy">Wyloguj</button>
                    </form>
                  </>
                ) : (
                  <Link href="/zaloguj">Zaloguj się</Link>
                )}
              </nav>
            </div>
          </header>

          <main id="tresc">{children}</main>

          <footer style={{ borderTop: "1px solid var(--linia)", marginTop: "var(--o-9)" }}>
            <div className="wrap sekcja-ciasna">
              <div className="siatka siatka-2" style={{ alignItems: "start" }}>
                <div>
                  <p style={{ fontFamily: "var(--krój-tytuł)", fontSize: "var(--t-lg)", fontWeight: 600, marginBottom: "var(--o-2)" }}>
                    Fundacja Lepszy Dom Lepsze Jutro
                  </p>
                  <p className="maly cichy">
                    Złota 75A/7, 00-819 Warszawa<br />
                    KRS 0000971976 · NIP 5273002294 · REGON 522030190
                  </p>
                </div>
                <p className="drobny cichy czytanie">
                  Przy każdym liście publikujemy imię, wiek, województwo, opis marzenia
                  i kategorię prezentu, w razie potrzeby rozmiar ubrania lub buta, oraz
                  zdjęcie listu przygotowane przez Fundację. Nie publikujemy nazwisk,
                  nazwy placówki, miejscowości, adresu ani wizerunku dziecka.
                </p>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
