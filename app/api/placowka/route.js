import { db } from "../../../lib/db";

// Zgloszenie placowki do akcji. Formularz jest publiczny, wiec musi byc
// odporny na boty i na przypadkowe podwojne wyslanie.
//
// Placowka jest rekordem STALYM — instytucja moze wracac co roku.
// Udzial w konkretnej akcji to osobny rekord UdzialPlacowki.

const WOJEWODZTWA = [
  "dolnoslaskie","kujawsko-pomorskie","lubelskie","lubuskie","lodzkie",
  "malopolskie","mazowieckie","opolskie","podkarpackie","podlaskie",
  "pomorskie","slaskie","swietokrzyskie","warminsko-mazurskie",
  "wielkopolskie","zachodniopomorskie",
];

export async function POST(request) {
  const dane = await request.json();

  // Pulapka na boty: pole ukryte w CSS, ktorego czlowiek nie widzi.
  // Automat wypelnia wszystko i zdradza sie sam. Odpowiadamy sukcesem,
  // zeby nie podpowiadac, ze zostal wykryty.
  if (dane.strona) return Response.json({ ok: true });

  // Przycinamy do gornych limitow, zeby pojedyncze zgloszenie nie moglo
  // wpisac do bazy megabajta tekstu. Nadmiar obcinamy zamiast odrzucac —
  // dyrektor placowki nie ma wracac do formularza przez licznik znakow.
  const przytnij = (w, ile) => String(w || "").trim().slice(0, ile);

  const nazwa = przytnij(dane.nazwa, 200);
  const wojewodztwo = przytnij(dane.wojewodztwo, 40).toLowerCase();
  // Adres normalizujemy tak samo jak przy logowaniu — inaczej ta sama
  // placowka zglaszalaby sie dwa razy przez wielkosc liter.
  const email = przytnij(dane.email, 254).toLowerCase();
  const osoba = przytnij(dane.osoba, 120);
  const telefon = przytnij(dane.telefon, 40);
  const uwagi = przytnij(dane.uwagi, 2000);

  // Liczba dzieci idzie do pola liczbowego UdzialPlacowki, nie do notatki
  // — inaczej nie da sie tego zsumowac przy planowaniu skali akcji.
  const surowa = przytnij(dane.liczbaDzieci, 20).replace(/[^0-9]/g, "");
  const dzieci = surowa ? Math.min(parseInt(surowa, 10), 10000) : null;

  if (nazwa.length < 3) {
    return Response.json({ blad: "Podaj nazwe placowki (min. 3 znaki)." }, { status: 400 });
  }
  if (!WOJEWODZTWA.includes(wojewodztwo)) {
    return Response.json({ blad: "Wybierz wojewodztwo z listy." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ blad: "Podaj poprawny adres e-mail." }, { status: 400 });
  }

  const edycja = await db.edycjaAkcji.findFirst({
    where: { aktywna: true },
    select: { id: true },
  });
  if (!edycja) {
    return Response.json(
      { blad: "Nie prowadzimy teraz naboru. Zajrzyj pozniej albo zadzwon do nas." },
      { status: 409 }
    );
  }

  // Tozsamosc placowki wymusza baza, nie sprawdzenie w kodzie.
  //
  // Wczesniej bylo findFirst() i warunkowe create() — dwa rownoczesne
  // zgloszenia tej samej placowki przechodzily przez odczyt zanim
  // ktorekolwiek zapisalo, i powstawaly dwa rekordy tej samej
  // instytucji. Unikalnosc UdzialPlacowki tego nie lapala, bo dotyczy
  // pary placowka-edycja, a placowki byly dwie.
  //
  // Klucz NIE zawiera adresu e-mail. Dyrektor moze sie zmienic miedzy
  // edycjami, a placowka pozostaje ta sama instytucja — klucz oparty
  // na kontakcie tworzylby co roku nowy rekord i rozbijal historie.
  //
  // Normalizacja nazwy sprawia, ze "Dom Dziecka" i "dom dziecka"
  // w tym samym wojewodztwie to jedna placowka.
  const klucz = nazwa.toLowerCase() + "|" + wojewodztwo;

  // Zgloszenie z publicznego formularza to WNIOSEK, nie zrodlo prawdy.
  //
  // Rekord Placowka dostaje WYLACZNIE dane identyfikujace: klucz, nazwe
  // i wojewodztwo. Kontaktu tu nie zapisujemy nawet przy zakladaniu
  // nowej placowki — bo w tym momencie nikt jeszcze nie sprawdzil, czy
  // osoba wypelniajaca formularz ma cokolwiek wspolnego z ta instytucja.
  // Niezweryfikowany numer telefonu w trwalym rekordzie wygladalby
  // pozniej jak dane potwierdzone.
  //
  // Kontakt zyje w UdzialPlacowki (zgloszonaOsoba, zgloszonyTelefon,
  // zgloszonyEmail). Administrator przenosi go do Placowka swiadomie,
  // przy zatwierdzaniu wniosku.
  //
  // Upsert z pustym "update" daje atomowosc bez modyfikacji: przy dwoch
  // rownoczesnych zgloszeniach powstaje jeden rekord, a istniejacy
  // pozostaje nietkniety.
  const placowka = await db.placowka.upsert({
    where: { klucz },
    update: {},
    create: { klucz, nazwa, wojewodztwo },
    select: { id: true },
  });

  // Udzial zakladamy, jesli go nie ma. Powtorne zgloszenie tej samej
  // placowki w tej samej edycji to zwykle podwojne klikniecie —
  // unikalnosc pary placowka-edycja pilnuje baza.
  await db.udzialPlacowki.upsert({
    where: { placowkaId_edycjaId: { placowkaId: placowka.id, edycjaId: edycja.id } },
    update: {},
    create: {
      placowkaId: placowka.id,
      edycjaId: edycja.id,
      status: "ZGLOSZONA",
      deklarowaneDzieci: dzieci,
      uwagi: uwagi || null,
      zgloszonaOsoba: osoba || null,
      zgloszonyTelefon: telefon || null,
      zgloszonyEmail: email,
    },
  });

  // Wniosek aktualizujemy WYLACZNIE dopoki czeka na rozpatrzenie.
  // Gdy fundacja go potwierdzila, odmowila albo zamknela, publiczny
  // formularz nie moze juz nic zmienic — inaczej ktos podmienilby
  // liczbe dzieci albo kontakt w potwierdzonej placowce w srodku
  // kampanii.
  //
  // Dane kontaktowe ida do pol wniosku, nie do rekordu placowki.
  // Dzieki temu dyrektor moze poprawic literowke w numerze telefonu,
  // a dane zweryfikowanej instytucji pozostaja nietkniete.
  await db.udzialPlacowki.updateMany({
    where: { placowkaId: placowka.id, edycjaId: edycja.id, status: "ZGLOSZONA" },
    data: {
      ...(dzieci !== null ? { deklarowaneDzieci: dzieci } : {}),
      ...(uwagi ? { uwagi } : {}),
      ...(osoba ? { zgloszonaOsoba: osoba } : {}),
      ...(telefon ? { zgloszonyTelefon: telefon } : {}),
      zgloszonyEmail: email,
    },
  });

  return Response.json({ ok: true });
}
