import { db } from "../../../lib/db";

// Zgloszenie placowki do akcji. Formularz jest publiczny, wiec musi byc
// odporny na boty i na przypadkowe podwojne wyslanie.

const WOJEWODZTWA = [
  "dolnoslaskie","kujawsko-pomorskie","lubelskie","lubuskie","lodzkie",
  "malopolskie","mazowieckie","opolskie","podkarpackie","podlaskie",
  "pomorskie","slaskie","swietokrzyskie","warminsko-mazurskie",
  "wielkopolskie","zachodniopomorskie",
];

export async function POST(request) {
  const dane = await request.json();

  // Pulapka na boty: pole ukryte w CSS, ktorego czlowiek nie widzi.
  // Automat wypelnia wszystko, wiec zdradza sie sam. Odpowiadamy
  // sukcesem, zeby nie podpowiadac, ze zostal wykryty.
  if (dane.strona) return Response.json({ ok: true });

  const nazwa = (dane.nazwa || "").trim();
  const wojewodztwo = (dane.wojewodztwo || "").trim().toLowerCase();
  const email = (dane.email || "").trim();
  const osoba = (dane.osoba || "").trim();
  const telefon = (dane.telefon || "").trim();
  const liczbaDzieci = (dane.liczbaDzieci || "").trim();
  const uwagi = (dane.uwagi || "").trim();

  if (nazwa.length < 3) {
    return Response.json({ blad: "Podaj nazwe placowki." }, { status: 400 });
  }
  if (!WOJEWODZTWA.includes(wojewodztwo)) {
    return Response.json({ blad: "Wybierz wojewodztwo z listy." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ blad: "Podaj poprawny adres e-mail." }, { status: 400 });
  }

  // Te same dane wyslane dwa razy w ciagu doby to zwykle podwojne
  // klikniecie, nie druga placowka. Nie tworzymy duplikatu.
  const doba = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const juzJest = await db.placowka.findFirst({
    where: { email, nazwa, utworzona: { gte: doba } },
    select: { id: true },
  });
  if (juzJest) return Response.json({ ok: true, powtorzone: true });

  await db.placowka.create({
    data: {
      nazwa,
      wojewodztwo,
      email,
      osobaKontaktowa: osoba || null,
      telefon: telefon || null,
      status: "ZGLOSZONA",
      notatki: [
        liczbaDzieci ? "Deklarowana liczba dzieci: " + liczbaDzieci : null,
        uwagi ? "Uwagi placowki: " + uwagi : null,
      ].filter(Boolean).join("\n") || null,
    },
  });

  return Response.json({ ok: true });
}
