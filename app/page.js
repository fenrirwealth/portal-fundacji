import Link from "next/link";
import { Gift, MailOpen, ShieldCheck, Star } from "lucide-react";
import { aktywnaEdycja, formatujTermin, licznik } from "../lib/db";
import HeroMagia from "./ui/HeroMagia";
import LancuchDobra from "./ui/LancuchDobra";
import Wejscie from "./ui/Wejscie";
import ArchiwumListow from "./ui/ArchiwumListow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Listy do Świętego Mikołaja",
  description:
    "Wybierz zweryfikowany list dziecka i zostań jego Mikołajem. Fundacja bezpiecznie koordynuje prezenty dla placówek opiekuńczo-wychowawczych.",
  alternates: { canonical: "/" },
};

const KROKI = [
  { nr: "01", tytul: "Wybierz list", opis: "Poznaj marzenie bez nazwiska, adresu, nazwy placówki ani wizerunku dziecka.", Ikona: MailOpen },
  { nr: "02", tytul: "Zostań Mikołajem", opis: "Zaloguj się bez hasła i zarezerwuj list. Masz 3 dni na potwierdzenie.", Ikona: Star },
  { nr: "03", tytul: "Przygotuj prezent", opis: "Nie musisz kupować wszystkiego. Liczy się gest, uważność i bezpieczny podarunek.", Ikona: Gift },
  { nr: "04", tytul: "My go przekażemy", opis: "Sprawdzamy, pakujemy i dostarczamy prezenty do zweryfikowanych placówek.", Ikona: ShieldCheck },
];

function trybAkcji(edycja) {
  if (!edycja) return "OCZEKIWANIE";
  const teraz = Date.now();
  if (teraz < new Date(edycja.dataStart).getTime()) return "ODLICZANIE";
  if (teraz > new Date(edycja.dataKoniec).getTime()) return "ZAKONCZENIE";
  return "TRWA";
}

export default async function Start() {
  let stan = null;
  let edycja = null;
  try {
    [stan, edycja] = await Promise.all([licznik(), aktywnaEdycja()]);
  } catch {}

  const tryb = trybAkcji(edycja);
  const saListy = Boolean(stan?.wszystkie);
  const termin = formatujTermin(edycja?.terminDostarczenia);
  const etykieta = tryb === "TRWA" ? "Akcja trwa" : tryb === "ODLICZANIE" ? "Już wkrótce" : tryb === "ZAKONCZENIE" ? "Edycja zakończona" : "Przygotowujemy kolejną edycję";

  return (
    <>
      <HeroMagia etykieta={etykieta} saListy={saListy} termin={termin} />

      <section className="sekcja-lancucha">
        <div className="wrap">
          <Wejscie>
            <p className="nadtytul nadtytul-ciemny"><span /> Żywy Łańcuch Dobra</p>
            <div className="naglowek-sekcji">
              <h2>Magia rośnie z każdym wybranym listem.</h2>
              <p>Każda rezerwacja wydłuża złotą linię. Nie pokazujemy liczb marketingowych — tylko aktualny stan zweryfikowanych listów.</p>
            </div>
          </Wejscie>
          <Wejscie opoznienie={0.1}><LancuchDobra poczatkowy={stan} /></Wejscie>
        </div>
      </section>

      <section className="sekcja jak-dziala" id="jak-to-dziala">
        <div className="jak-dziala-swiatlo jak-dziala-swiatlo-lewe" aria-hidden="true" />
        <div className="jak-dziala-swiatlo jak-dziala-swiatlo-prawe" aria-hidden="true" />
        <div className="wrap jak-dziala-tresc">
          <Wejscie>
            <p className="nadtytul"><span /> Prosto i bezpiecznie</p>
            <div className="naglowek-sekcji">
              <h2>Ty wybierasz marzenie. <em>My czuwamy nad całą drogą prezentu.</em></h2>
              <p>Jedna przejrzysta ścieżka od listu do dziecka, z kontrolą Fundacji na każdym etapie.</p>
            </div>
          </Wejscie>
          <ol className="kroki-magiczne">
            {KROKI.map(({ nr, tytul, opis, Ikona }, i) => (
              <Wejscie as="li" key={nr} opoznienie={i * 0.08}>
                <span className="krok-numer" aria-hidden="true">{nr}</span>
                <span className="krok-ikona" aria-hidden="true"><Ikona strokeWidth={1.45} /></span>
                <div className="krok-tresc"><h3>{tytul}</h3><p>{opis}</p></div>
              </Wejscie>
            ))}
          </ol>
        </div>
      </section>

      <section className="sekcja archiwum-sekcja">
        <div className="wrap">
          <Wejscie>
            <p className="nadtytul"><span /> Poprzednie edycje</p>
            <div className="naglowek-sekcji archiwum-naglowek">
              <h2>Tak wyglądają marzenia pisane dziecięcą ręką.</h2>
              <p>Każda kartka to osobna historia. Te listy znalazły już swoich Mikołajów — dziś przypominają, jak wiele może zmienić jeden uważny gest.</p>
            </div>
          </Wejscie>
        </div>
        <Wejscie opoznienie={0.1}><ArchiwumListow /></Wejscie>
        <div className="wrap archiwum-dopisek"><span aria-hidden="true">✦</span><p>Materiały z archiwum Fundacji. Galeria nie zawiera aktywnych listów do rezerwacji.</p></div>
      </section>

      <section className="wrap sekcja">
        <Wejscie className="fundusz-zaproszenie">
          <div><p className="nadtytul nadtytul-ciemny"><span /> Fundusz Ostatniej Gwiazdki</p><h2>Pomóż nam domknąć ostatnie marzenia.</h2><p>Wpłaty wykorzystujemy, gdy list nie znajdzie Mikołaja albo dostarczony prezent wymaga uzupełnienia.</p></div>
          <Link className="btn btn-cichy btn-duzy" href="/fundusz-ostatniej-gwiazdki">Poznaj fundusz</Link>
        </Wejscie>
      </section>

      <section className="wrap sekcja">
        <Wejscie className="pasek-finalowy">
          <div>
            <p className="nadtytul"><span /> Jeden gest uruchamia kolejny</p>
            <h2>Znajdź list, który poruszy właśnie Ciebie.</h2>
            <p>Możesz go wybrać świadomie albo pozwolić, by to marzenie znalazło swojego Mikołaja.</p>
          </div>
          <div className="pasek-finalowy-akcje">
            <Link className="btn btn-magiczny btn-duzy" href="/listy">Zobacz listy</Link>
            {edycja && (
              <Link className="btn btn-szklany btn-duzy" href="/zglos-placowke">Zgłoś placówkę</Link>
            )}
          </div>
        </Wejscie>
      </section>
    </>
  );
}
