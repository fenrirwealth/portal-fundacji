import { Worker } from "bullmq";
import Redis from "ioredis";
import sharp from "sharp";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const NAZWA = "portal-email-v1";
const db = new PrismaClient();
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("[email-worker] Brak REDIS_URL — worker zakończony.");
  process.exit(1);
}

const polaczenie = new Redis(redisUrl, { maxRetriesPerRequest: null });
const port = Number(process.env.SMTP_PORT || 587);
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
  disableFileAccess: true, disableUrlAccess: true,
});
const nadawca = () => process.env.SMTP_FROM || process.env.SMTP_USER;
const portal = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.AUTH_URL || "https://portal.fundacjalepszydomlepszejutro.pl";

function esc(wartosc) {
  return String(wartosc || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function htmlEmail(tytul, tresc, cta, href) {
  return `<!doctype html><html lang="pl"><body style="margin:0;background:#09152f;color:#fff9f0;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:48px 28px"><p style="color:#d5ae62;letter-spacing:.12em;text-transform:uppercase;font-size:12px">Fundacja Lepszy Dom Lepsze Jutro</p><h1 style="font-family:Georgia,serif;font-size:36px;line-height:1.1">${esc(tytul)}</h1><div style="font-size:17px;line-height:1.65;color:#e9e4dc">${tresc}</div>${href ? `<p style="margin-top:30px"><a href="${esc(href)}" style="display:inline-block;background:#d5ae62;color:#09152f;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:700">${esc(cta)}</a></p>` : ""}<p style="margin-top:42px;color:#a9b3c5;font-size:13px">Ta wiadomość dotyczy akcji „Listy do Świętego Mikołaja”.</p></div></body></html>`;
}

async function daneRezerwacji(id) {
  return db.rezerwacja.findUnique({
    where: { id },
    include: { user: { select: { email: true } }, list: { select: { id: true, numer: true, imie: true, marzenie: true, edycja: { select: { terminDostarczenia: true } } } } },
  });
}

async function kartkaPodziekowania(imie) {
  const svg = `<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" fill="#09152f"/><circle cx="850" cy="180" r="250" fill="#123d32" opacity=".8"/><rect x="70" y="70" width="940" height="940" rx="48" fill="none" stroke="#d5ae62" stroke-width="4"/><text x="100" y="170" fill="#d5ae62" font-family="Arial" font-size="34" letter-spacing="5">LEPSZY DOM • LEPSZE JUTRO</text><text x="100" y="430" fill="#fff9f0" font-family="Georgia" font-size="88" font-weight="bold">Zostałem</text><text x="100" y="535" fill="#fff9f0" font-family="Georgia" font-size="88" font-weight="bold">Mikołajem.</text><text x="100" y="665" fill="#f3e5cb" font-family="Arial" font-size="42">Prezent dla ${esc(imie)}</text><text x="100" y="725" fill="#f3e5cb" font-family="Arial" font-size="42">jest już w drodze.</text><text x="100" y="915" fill="#d5ae62" font-family="Arial" font-size="28">portal.fundacjalepszydomlepszejutro.pl</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const worker = new Worker(NAZWA, async (zadanie) => {
  if (["REZERWACJA", "PRZYPOMNIENIE", "PRZYPOMNIENIE_DOSTARCZENIA", "PODZIEKOWANIE"].includes(zadanie.name)) {
    const r = await daneRezerwacji(zadanie.data.rezerwacjaId);
    if (!r?.user?.email) return;
    const panel = `${portal}/moje-rezerwacje`;
    if (zadanie.name === "REZERWACJA") {
      await transport.sendMail({ from: nadawca(), to: r.user.email,
        subject: `List nr ${r.list.numer} czeka na Twoje potwierdzenie`,
        text: `List od ${r.list.imie} został zarezerwowany. Potwierdź rezerwację w ciągu 3 dni: ${panel}`,
        html: htmlEmail("List czeka na Twoje potwierdzenie", `<p>List od <b>${esc(r.list.imie)}</b> został dla Ciebie zarezerwowany.</p><p>Potwierdź decyzję w ciągu 3 dni. Po tym czasie niepotwierdzony list automatycznie wróci do puli.</p>`, "Otwórz moje rezerwacje", panel) });
    } else if (zadanie.name === "PRZYPOMNIENIE") {
      await transport.sendMail({ from: nadawca(), to: r.user.email,
        subject: `Przypomnienie: potwierdź list nr ${r.list.numer}`,
        text: `Rezerwacja listu od ${r.list.imie} wkrótce wygaśnie. Potwierdź ją tutaj: ${panel}`,
        html: htmlEmail("Twoja rezerwacja wkrótce wygaśnie", `<p>List od <b>${esc(r.list.imie)}</b> nadal czeka na potwierdzenie.</p><p>Jeśli chcesz przygotować prezent, potwierdź rezerwację przed upływem terminu.</p>`, "Potwierdź rezerwację", panel) });
    } else if (zadanie.name === "PRZYPOMNIENIE_DOSTARCZENIA") {
      const termin = new Date(r.list.edycja.terminDostarczenia).toLocaleDateString("pl-PL");
      await transport.sendMail({ from: nadawca(), to: r.user.email,
        subject: `Dwa dni do terminu przekazania prezentu dla ${r.list.imie}`,
        text: `Termin przekazania prezentu mija ${termin}. Szczegóły znajdziesz tutaj: ${panel}`,
        html: htmlEmail("Zostały dwa dni", `<p>Termin przekazania prezentu dla <b>${esc(r.list.imie)}</b> mija <b>${termin}</b>.</p><p>Jeśli potrzebujesz pomocy lub nie zdążysz, skontaktuj się z Fundacją — dzięki temu list będzie można bezpiecznie domknąć.</p>`, "Otwórz moje rezerwacje", panel) });
    } else {
      const kartka = await kartkaPodziekowania(r.list.imie);
      await transport.sendMail({ from: nadawca(), to: r.user.email,
        subject: `Dziękujemy — prezent dla ${r.list.imie} został przekazany`,
        text: `Prezent dla ${r.list.imie} został przekazany placówce. Dziękujemy, że zostałeś Mikołajem.`,
        html: htmlEmail("Dziękujemy, Mikołaju!", `<p>Prezent dla <b>${esc(r.list.imie)}</b> został sprawdzony i przekazany placówce.</p><p>W załączniku znajdziesz kartkę, którą możesz udostępnić i zaprosić kolejne osoby do pomagania.</p>`, "Zobacz kolejne listy", `${portal}/listy`),
        attachments: [{ filename: "zostalem-mikolajem.png", content: kartka, contentType: "image/png" }] });
    }
    return;
  }

  if (zadanie.name === "LINK_PLACOWKI") {
    const { email, nazwa, link } = zadanie.data;
    await transport.sendMail({ from: nadawca(), to: email, subject: "Bezpieczny link do przesłania listów dzieci",
      text: `Placówka ${nazwa} została przyjęta do akcji. Prześlij skany listów przez bezpieczny link: ${link}`,
      html: htmlEmail("Możecie przesłać listy", `<p>Placówka <b>${esc(nazwa)}</b> została przyjęta do akcji.</p><p>Link jest prywatny i działa do zakończenia naboru. Każdy plik zostanie automatycznie oczyszczony z metadanych i trafi do moderacji Fundacji.</p>`, "Prześlij listy", link) });
    return;
  }

  if (zadanie.name === "NOWY_SKAN") {
    const { emailAdmina, nazwa, liczba } = zadanie.data;
    await transport.sendMail({ from: nadawca(), to: emailAdmina, subject: `Nowe listy do moderacji: ${nazwa}`,
      text: `${nazwa} przesłała nowy plik. Otwórz panel: ${portal}/admin`,
      html: htmlEmail("Nowy list czeka na moderację", `<p><b>${esc(nazwa)}</b> przesłała nowy skan. Łącznie w zgłoszeniu: ${Number(liczba) || 1}.</p>`, "Otwórz panel redakcji", `${portal}/admin`) });
  }
}, { connection: polaczenie, concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY || 4) });

worker.on("completed", (zadanie) => console.log(`[email-worker] Wysłano ${zadanie.name} (${zadanie.id}).`));
worker.on("failed", (zadanie, blad) => console.error(`[email-worker] Błąd ${zadanie?.name}:`, blad.message));

async function zakoncz() {
  await worker.close();
  await db.$disconnect();
  await polaczenie.quit();
  process.exit(0);
}
process.on("SIGTERM", zakoncz);
process.on("SIGINT", zakoncz);
