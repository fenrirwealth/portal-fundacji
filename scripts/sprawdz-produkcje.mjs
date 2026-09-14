import net from "node:net";

const portal = new URL(process.env.PORTAL_URL || "https://portal.fundacjalepszydomlepszejutro.pl");
const strona = new URL(process.env.STRONA_URL || "https://fundacjalepszydomlepszejutro.pl");

if (portal.protocol !== "https:" || strona.protocol !== "https:") {
  throw new Error("PORTAL_URL i STRONA_URL musza zaczynac sie od https://");
}

const wyniki = [];

async function sprawdz(nazwa, operacja) {
  try {
    await operacja();
    wyniki.push({ nazwa, ok: true });
    console.log(`OK   ${nazwa}`);
  } catch (blad) {
    wyniki.push({ nazwa, ok: false });
    console.error(`BLAD ${nazwa}: ${blad.message}`);
  }
}

async function pobierz(url, opcje = {}) {
  const odpowiedz = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    ...opcje,
  });
  return odpowiedz;
}

function wymagaj(warunek, komunikat) {
  if (!warunek) throw new Error(komunikat);
}

function sprawdzNaglowki(odpowiedz) {
  wymagaj(odpowiedz.headers.get("x-content-type-options") === "nosniff", "brak X-Content-Type-Options");
  wymagaj(odpowiedz.headers.get("x-frame-options") === "DENY", "brak X-Frame-Options");
  wymagaj(Boolean(odpowiedz.headers.get("strict-transport-security")), "brak HSTS");
  wymagaj(Boolean(odpowiedz.headers.get("referrer-policy")), "brak Referrer-Policy");
}

async function sprawdzPrzekierowanieHttps(adres) {
  const http = new URL(adres);
  http.protocol = "http:";
  const odpowiedz = await pobierz(http, { redirect: "manual" });
  wymagaj([301, 302, 307, 308].includes(odpowiedz.status), `HTTP ${odpowiedz.status} zamiast przekierowania`);
  const cel = odpowiedz.headers.get("location");
  wymagaj(cel?.startsWith("https://"), "przekierowanie nie prowadzi do HTTPS");
}

async function sprawdzZamknietyPostgres(host) {
  await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: 5432 });
    const zakoncz = () => {
      socket.destroy();
      resolve();
    };
    socket.setTimeout(3_000, zakoncz);
    socket.once("error", zakoncz);
    socket.once("connect", () => {
      socket.destroy();
      reject(new Error("publiczny port 5432 jest otwarty"));
    });
  });
}

await sprawdz("portal odpowiada i widzi PostgreSQL", async () => {
  const odpowiedz = await pobierz(new URL("/api/zdrowie", portal));
  wymagaj(odpowiedz.status === 200, `HTTP ${odpowiedz.status}`);
  const dane = await odpowiedz.json();
  wymagaj(dane.stan === "ok" && dane.baza === "ok", "nieprawidlowy stan aplikacji lub bazy");
  sprawdzNaglowki(odpowiedz);
});

await sprawdz("publiczna lista jest dostepna", async () => {
  const odpowiedz = await pobierz(new URL("/listy", portal));
  wymagaj(odpowiedz.status === 200, `HTTP ${odpowiedz.status}`);
});

await sprawdz("zadanie przypomnien wymaga sekretu", async () => {
  const odpowiedz = await pobierz(new URL("/api/zadania/przypomnienia", portal), { method: "POST" });
  wymagaj(odpowiedz.status === 401, `HTTP ${odpowiedz.status} zamiast 401`);
});

await sprawdz("strona fundacji i jej healthcheck dzialaja", async () => {
  const [glowna, zdrowie] = await Promise.all([
    pobierz(strona),
    pobierz(new URL("/healthz", strona)),
  ]);
  wymagaj(glowna.status === 200, `strona: HTTP ${glowna.status}`);
  wymagaj(zdrowie.status === 200 && (await zdrowie.text()).trim() === "ok", `healthcheck: HTTP ${zdrowie.status}`);
  sprawdzNaglowki(glowna);
});

await sprawdz("HTTP przekierowuje na HTTPS", async () => {
  await Promise.all([sprawdzPrzekierowanieHttps(portal), sprawdzPrzekierowanieHttps(strona)]);
});

await sprawdz("PostgreSQL nie jest publicznie dostepny", () => sprawdzZamknietyPostgres(portal.hostname));

const bledy = wyniki.filter((wynik) => !wynik.ok).length;
console.log(`\nWynik: ${wyniki.length - bledy}/${wyniki.length} kontroli poprawnych.`);
if (bledy) process.exitCode = 1;
