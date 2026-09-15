import "./globals.css";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/dm-sans";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/600.css";
import { auth } from "../auth";
import { wyloguj } from "./akcje-sesji";
import { ToastProvider } from "./ui/Toast";
import Link from "next/link";
import PlynnyScroll from "./ui/PlynnyScroll";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.fundacjalepszydomlepszejutro.pl"),
  title: {
    default: "Listy do Świętego Mikołaja",
    template: "%s — Fundacja Lepszy Dom Lepsze Jutro",
  },
  description:
    "Listy do Świętego Mikołaja — bezpieczna akcja Fundacji Lepszy Dom Lepsze Jutro. Wybierz list i podaruj dziecku magiczne święta.",
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "Listy do Świętego Mikołaja",
    title: "Każdy list czeka na swojego Mikołaja",
    description: "Wybierz zweryfikowany list dziecka i zostań jego Mikołajem.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport = {
  themeColor: "#09152F",
  width: "device-width",
  initialScale: 1,
};

export default async function Layout({ children }) {
  const sesja = await auth();

  return (
    <html lang="pl">
      <body>
        <PlynnyScroll />
        <ToastProvider>
          <a className="skip" href="#tresc">Przejdź do treści</a>

          <header className="naglowek">
            <div className="wrap naglowek-tresc">
              <Link className="znak" href="/">
                <b>Listy do Mikołaja</b>
                <span>Lepszy Dom Lepsze Jutro</span>
              </Link>

              <nav className="menu" aria-label="Główna">
                <Link href="/listy">Listy dzieci</Link>
                <Link href="/#jak-to-dziala">Jak to działa</Link>
                <Link href="/o-akcji">O akcji</Link>
                {sesja?.user ? (
                  <>
                    <Link href="/moje-rezerwacje">Moje listy</Link>
                    <span className="konto" title={sesja.user.email}>{sesja.user.email}</span>
                    {/* Wylogowanie jako formularz, nie odnośnik: zmienia stan,
                        więc nie może wykonać się przez samo wejście na adres.
                        Akcja jest nazwana i leży w osobnym module — łatwiej
                        ją wtedy wskazać w testach i nie powiela się w układzie. */}
                    <form action={wyloguj}>
                      <button type="submit" className="btn btn-tekstowy">Wyloguj</button>
                    </form>
                  </>
                ) : (
                  <Link href="/zaloguj">Moje listy / Zaloguj się</Link>
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
