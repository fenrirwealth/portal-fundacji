import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buffer } from "node:stream/consumers";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { wiekPL } from "./wiek.mjs";

export const ID_HARMONOGRAMU_KOPII = "kopia-listow-2300";
export const TYP_KOPII = "KOPIA_LISTOW_PDF";
export const STREFA_KOPII = "Europe/Warsaw";
const ODBIORCA = "k.skuza@wp.pl";
const STATUSY = {
  SZKIC: "Szkic",
  DO_POPRAWY: "Do poprawy",
  OPUBLIKOWANY: "Opublikowany",
  ZAREZERWOWANY: "Zarezerwowany",
  OPLACONY: "Prezent przyjęty",
  PRZEKAZANY: "Prezent przekazany",
  WYCOFANY: "Wycofany",
};
const REZERWACJE = {
  OCZEKUJE: "Czeka na kontakt",
  POTWIERDZONA: "Potwierdzona",
  DOSTARCZONA: "Prezent dostarczony",
};
const KATEGORIE = { ZABAWKI: "Zabawki", SPORT: "Sport", KSIAZKI: "Książki", NAUKA: "Nauka", UBRANIA: "Ubrania", INNE: "Inne" };
const datownik = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: STREFA_KOPII });
const dataPliku = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: STREFA_KOPII });

const katalogSkanow = () => process.env.SKANY_PRIVATE_DIR || "/data/skany";
const tekst = (wartosc) => wartosc ?? "—";
const data = (wartosc) => wartosc ? datownik.format(wartosc) : "—";

export async function wczytajHasloKopii() {
  const haslo = (await readFile(path.join(katalogSkanow(), ".haslo-kopii-pdf"), "utf8")).trim();
  if (haslo.length < 20) throw new Error("Hasło kopii PDF jest nieprawidłowe.");
  return haslo;
}

export async function pobierzListyDoKopii(db) {
  return db.list.findMany({
    where: { edycja: { aktywna: true } },
    orderBy: { numer: "asc" },
    select: {
      id: true, numer: true, imie: true, wiek: true, wojewodztwo: true,
      kategoria: true, marzenie: true, opis: true, rozmiar: true, status: true,
      zdjecieUrl: true, utworzony: true, zaktualizowany: true,
      rezerwacjaReczna: true, rezerwacjaRecznaDarczynca: true, rezerwacjaRecznaNotatka: true,
      edycja: { select: { nazwa: true, terminDostarczenia: true } },
      placowka: { select: { nazwa: true, ulica: true, kodPocztowy: true, miejscowosc: true } },
      skan: { select: { plik: true } },
      notatka: { select: { tresc: true } },
      rezerwacje: {
        where: { status: { in: ["OCZEKUJE", "POTWIERDZONA", "DOSTARCZONA"] } },
        orderBy: { utworzona: "desc" },
        take: 1,
        select: {
          status: true, utworzona: true, wygasa: true, kontaktTelefoniczny: true,
          telefonKontaktowy: true, darczyncaEtykieta: true,
          user: { select: { name: true, email: true } },
          prezent: { select: { stan: true, dataPrzyjecia: true, opisZawartosci: true, powodOdrzucenia: true } },
        },
      },
    },
  });
}

async function miniaturaListu(list, katalog) {
  const pliki = [];
  if (list.zdjecieUrl && /^[a-z0-9-]{1,80}$/i.test(list.id)) {
    pliki.push(path.join(katalog, "public-listy", list.id + ".png"));
  }
  if (list.skan?.plik && /^[0-9a-f-]{36}\.jpg$/i.test(list.skan.plik)) {
    pliki.push(path.join(katalog, list.skan.plik));
  }
  for (const plik of pliki) {
    try {
      return await sharp(plik, { limitInputPixels: 40_000_000 }).rotate()
        .resize(380, 500, { fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#fff9f0" }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    } catch (blad) {
      if (blad.code !== "ENOENT") console.warn("[kopia-pdf] Nie można odczytać miniatury listu nr", list.numer);
    }
  }
  return null;
}

export async function utworzKopieListow(listy, {
  haslo, planowanaData, wygenerowano = new Date(), katalog = katalogSkanow(),
  font = "/usr/share/fonts/dejavu/DejaVuSans.ttf",
  fontBold = "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
}) {
  if (!haslo || haslo.length < 20) throw new Error("Kopia PDF wymaga hasła.");
  const doc = new PDFDocument({
    size: "A4", margin: 44, bufferPages: true,
    pdfVersion: "1.7ext3", userPassword: haslo,
    ownerPassword: randomBytes(32).toString("hex"),
    permissions: { printing: "highResolution", copying: true, contentAccessibility: true },
    info: { Title: "Kopia listów Fundacji", Author: "Fundacja Lepszy Dom Lepsze Jutro" },
  });
  const wynik = buffer(doc);
  doc.registerFont("Tekst", font).registerFont("Tytul", fontBold);
  let miniatury = 0;
  const szerokosc = doc.page.width - 88;

  function opisPola(etykieta, wartosc) {
    doc.font("Tytul").fontSize(9).fillColor("#47536a").text(etykieta);
    doc.font("Tekst").fontSize(10).fillColor("#101b33").text(tekst(wartosc), { lineGap: 2 });
    doc.moveDown(.55);
  }

  doc.font("Tytul").fontSize(10).fillColor("#78551d").text("FUNDACJA LEPSZY DOM LEPSZE JUTRO");
  doc.moveDown(.8).fontSize(27).fillColor("#101b33").text("Kopia listów i rezerwacji");
  doc.moveDown(.4);
  opisPola("Edycja", listy[0]?.edycja.nazwa || "Brak listów w aktywnej edycji");
  opisPola("Zaplanowana kopia", data(planowanaData));
  opisPola("Stan danych z chwili wygenerowania", data(wygenerowano));
  opisPola("Termin dostarczenia", data(listy[0]?.edycja.terminDostarczenia));
  opisPola("Wolne listy", listy.filter(l => l.status === "OPUBLIKOWANY").map(l => l.numer).join(", ") || "Brak");
  opisPola("Zarezerwowane listy", listy.filter(l => l.status === "ZAREZERWOWANY").map(l => l.numer).join(", ") || "Brak");
  opisPola("Liczba listów w kopii", listy.length);
  doc.moveDown().font("Tekst").fontSize(10).text("Raport wewnętrzny Fundacji. Dane i miniatury są zapisane w pliku do wglądu bez dostępu do portalu.");

  for (const list of listy) {
    doc.addPage();
    doc.font("Tytul").fontSize(19).fillColor("#101b33").text(`List nr ${list.numer} · ${list.imie}, ${wiekPL(list.wiek)}`);
    doc.moveDown(.45);
    const obraz = await miniaturaListu(list, katalog);
    const gora = doc.y;
    if (obraz) {
      doc.image(obraz, 44, gora, { fit: [112, 130], align: "center", valign: "center" });
      miniatury++;
    } else {
      doc.roundedRect(44, gora, 112, 130, 6).fill("#f4efe5");
      doc.font("Tekst").fontSize(9).fillColor("#47536a")
        .text("Brak miniatury", 52, gora + 57, { width: 96, align: "center" });
    }
    doc.font("Tytul").fontSize(11).fillColor("#78551d")
      .text(list.status === "OPUBLIKOWANY" ? "Wolny · czeka na darczyńcę" : STATUSY[list.status] || list.status, 175, gora + 4, { width: szerokosc - 131 });
    doc.moveDown(.4).font("Tekst").fontSize(10).fillColor("#101b33")
      .text([KATEGORIE[list.kategoria] || list.kategoria, list.wojewodztwo, list.rozmiar].filter(Boolean).join(" · "), { width: szerokosc - 131 });
    doc.moveDown(.5).font("Tytul").fontSize(13).text(list.marzenie, { width: szerokosc - 131, lineGap: 2 });
    if (list.placowka) {
      const p = list.placowka;
      doc.moveDown(.5).font("Tekst").fontSize(9)
        .text([p.nazwa, p.ulica, [p.kodPocztowy, p.miejscowosc].filter(Boolean).join(" ")].filter(Boolean).join(" · "), { width: szerokosc - 131 });
    }
    doc.x = 44;
    doc.y = Math.max(gora + 143, doc.y + 12);
    if (list.opis) opisPola("Opis listu", list.opis);

    const r = list.rezerwacje[0];
    if (r) {
      const darczynca = r.darczyncaEtykieta || r.user.name || r.user.email || "Brak danych";
      const dane = [`${darczynca} · ${REZERWACJE[r.status] || r.status}`,
        `E-mail · ${tekst(r.user.email)}`, `Telefon · ${tekst(r.telefonKontaktowy)}`,
        `Rezerwacja · ${data(r.utworzona)}`];
      if (r.status === "OCZEKUJE") dane.push(`Kontakt do · ${data(r.wygasa)}`);
      if (r.kontaktTelefoniczny) dane.push(`Potwierdzona rozmowa · ${data(r.kontaktTelefoniczny)}`);
      opisPola("Darczyńca i rezerwacja online", dane.join("\n"));
      if (r.prezent) {
        const p = r.prezent;
        opisPola("Prezent", [p.stan, p.dataPrzyjecia && `Przyjęcie · ${data(p.dataPrzyjecia)}`, p.opisZawartosci, p.powodOdrzucenia].filter(Boolean).join("\n"));
      }
    } else if (list.rezerwacjaReczna) {
      opisPola("Darczyńca i rezerwacja ręczna", `${list.rezerwacjaRecznaDarczynca || "Darczyńca nieuzupełniony"}\nRezerwacja · ${data(list.rezerwacjaReczna)}`);
      if (list.rezerwacjaRecznaNotatka) opisPola("Notatka rezerwacji ręcznej", list.rezerwacjaRecznaNotatka);
    } else {
      opisPola("Rezerwacja", list.status === "OPUBLIKOWANY" ? "Brak · list wolny" : "Brak aktywnej rezerwacji w portalu");
    }
    if (list.notatka?.tresc) opisPola("Uwagi wewnętrzne Fundacji", list.notatka.tresc);
    opisPola("Ostatnia zmiana listu", data(list.zaktualizowany));
  }

  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    const dolnyMargines = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font("Tekst").fontSize(8).fillColor("#47536a").text(
      `Kopia wewnętrzna Fundacji  ·  ${dataPliku.format(planowanaData)}  ·  ${i + 1} / ${count}`,
      44, doc.page.height - 30, { width: szerokosc, lineBreak: false }
    );
    doc.page.margins.bottom = dolnyMargines;
  }
  doc.end();
  return { pdf: await wynik, miniatury, strony: count };
}

export async function zaplanujKopieListow(kolejka) {
  if (await kolejka.getJobScheduler(ID_HARMONOGRAMU_KOPII)) return;
  await wczytajHasloKopii();
  await kolejka.upsertJobScheduler(ID_HARMONOGRAMU_KOPII, {
    pattern: "0 0 23 * * *", tz: STREFA_KOPII,
  }, {
    name: TYP_KOPII,
    opts: { attempts: 5, backoff: { type: "exponential", delay: 60_000 }, removeOnComplete: 45, removeOnFail: 45 },
  });
}

export async function wyslijKopieListow({ db, transport, od, planowanaData }) {
  if (!(planowanaData instanceof Date) || Number.isNaN(planowanaData.getTime())) throw new Error("Brak zaplanowanej daty kopii.");
  const odbiorca = await db.user.findUnique({ where: { email: ODBIORCA }, select: { rola: true } });
  if (odbiorca?.rola !== "ZARZAD") throw new Error("Odbiorca kopii nie ma dostępu zarządu.");
  const haslo = await wczytajHasloKopii();
  const listy = await pobierzListyDoKopii(db);
  const { pdf, miniatury } = await utworzKopieListow(listy, { haslo, planowanaData });
  const dzien = dataPliku.format(planowanaData);
  const wysylka = await transport.sendMail({
    from: od, to: ODBIORCA,
    subject: `Kopia listów i rezerwacji · ${dzien}`,
    text: `W załączniku znajduje się kopia listów i rezerwacji. Raport obejmuje ${listy.length} listów i ${miniatury} miniatur. Do otwarcia PDF użyj hasła przekazanego osobno przez Fundację.`,
    attachments: [{ filename: `kopia-listow-${dzien}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  if (!wysylka.accepted?.includes(ODBIORCA)) throw new Error("Serwer pocztowy nie przyjął kopii.");
  console.log(`[kopia-pdf] Kopia ${dzien} przyjęta przez serwer pocztowy. Listy ${listy.length}, miniatury ${miniatury}.`);
}
