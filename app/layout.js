import "./globals.css";
import "lenis/dist/lenis.css";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/dm-sans";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/600.css";
import { auth } from "../auth";
import { ToastProvider } from "./ui/Toast";
import Link from "next/link";
import PlynnyScroll from "./ui/PlynnyScroll";
import Naglowek from "./ui/Naglowek";

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

const daneFundacji = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Fundacja Lepszy Dom Lepsze Jutro",
  url: "https://fundacjalepszydomlepszejutro.pl",
  email: "kontakt@fundacjalepszydomlepszejutro.pl",
  telephone: "+48 570 747 779",
  identifier: [
    { "@type": "PropertyValue", propertyID: "KRS", value: "0000971976" },
    { "@type": "PropertyValue", propertyID: "NIP", value: "5273002294" },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Złota 75A/7",
    postalCode: "00-819",
    addressLocality: "Warszawa",
    addressCountry: "PL",
  },
  sameAs: ["https://www.facebook.com/LEPSZYDOMLEPSZEJUTRO"],
};

export default async function Layout({ children }) {
  const sesja = await auth();

  return (
    <html lang="pl">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(daneFundacji).replace(/</g, "\\u003c"),
          }}
        />
        <PlynnyScroll />
        <ToastProvider>
          <a className="skip" href="#tresc">Przejdź do treści</a>

          <Naglowek email={sesja?.user?.email} />

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
                  <p className="drobny" style={{ marginTop: "var(--o-3)" }}><Link href="/fundusz-ostatniej-gwiazdki">Fundusz Ostatniej Gwiazdki</Link> · <Link href="/regulamin">Regulamin</Link></p>
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
