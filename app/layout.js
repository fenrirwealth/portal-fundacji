import "./globals.css";
import "lenis/dist/lenis.css";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/dm-sans";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/600.css";
import { auth } from "../auth";
import { ToastProvider } from "./ui/Toast";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Mail, Phone } from "lucide-react";
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

          <footer className="portal-footer">
            <div className="portal-footer-blask" aria-hidden="true" />
            <div className="wrap portal-footer-tresc">
              <div className="portal-footer-glowna">
                <div className="portal-footer-marka">
                  <p className="portal-footer-etykieta">Fundacja Lepszy Dom Lepsze Jutro</p>
                  <h2>Każde marzenie zasługuje na uważnego Mikołaja.</h2>
                  <p>
                    Łączymy darczyńców ze zweryfikowanymi listami dzieci, chroniąc ich
                    prywatność i dbając o bezpieczną drogę każdego prezentu.
                  </p>
                  <Link className="portal-footer-link-glowny" href="/listy">
                    Zobacz listy dzieci <ArrowUpRight aria-hidden="true" />
                  </Link>
                </div>

                <div className="portal-footer-kolumna">
                  <p className="portal-footer-tytul">Portal</p>
                  <Link href="/listy">Listy dzieci</Link>
                  <Link href="/#jak-to-dziala">Jak to działa</Link>
                  <Link href="/o-akcji">O akcji</Link>
                  <Link href="/fundusz-ostatniej-gwiazdki">Fundusz Ostatniej Gwiazdki</Link>
                  <Link href="/zglos-placowke">Zgłoś placówkę</Link>
                </div>

                <div className="portal-footer-kolumna portal-footer-kontakt">
                  <p className="portal-footer-tytul">Kontakt</p>
                  <a href="tel:+48570747779"><Phone aria-hidden="true" /> +48 570 747 779</a>
                  <a href="mailto:kontakt@fundacjalepszydomlepszejutro.pl"><Mail aria-hidden="true" /> Napisz do Fundacji</a>
                  <a href="https://www.facebook.com/LEPSZYDOMLEPSZEJUTRO" target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /> Facebook</a>
                  <p>Złota 75A/7<br />00-819 Warszawa</p>
                </div>
              </div>

              <div className="portal-footer-prywatnosc">
                <span aria-hidden="true">✦</span>
                <p>
                  Publikujemy wyłącznie informacje potrzebne do wyboru prezentu. Nie
                  ujawniamy nazwisk, adresów, nazw placówek ani wizerunków dzieci.
                </p>
              </div>

              <div className="portal-footer-dol">
                <p>© {new Date().getFullYear()} Fundacja Lepszy Dom Lepsze Jutro</p>
                <p>KRS 0000971976 · NIP 5273002294 · REGON 522030190</p>
                <Link href="/regulamin">Regulamin portalu</Link>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
