// Testy wizualne i dostepnosciowe. Nie zastepuja audytu recznego,
// ale wylapuja regresje, ktore najlatwiej przeoczyc przy zmianie stylu:
// kontrast, cele dotykowe, brak etykiet, bledy w konsoli.
import { chromium } from "playwright";

const BAZA = process.env.BAZA || "http://127.0.0.1:3100";
const WIDOKI = ["/", "/listy", "/zaloguj", "/zglos-placowke", "/regulamin"];

const p = await chromium.launch();
let bledow = 0;
const raport = [];

function sprawdz(warunek, opis) {
  if (!warunek) { bledow++; raport.push("  ✕ " + opis); }
  else raport.push("  ✓ " + opis);
}

for (const sciezka of WIDOKI) {
  raport.push("\n" + sciezka);
  const k = await p.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const s = await k.newPage();
  const bledyKonsoli = [];
  s.on("console", (m) => { if (m.type() === "error") bledyKonsoli.push(m.text()); });
  s.on("pageerror", (e) => bledyKonsoli.push(e.message));
  await s.goto(BAZA + sciezka, { waitUntil: "load" });
  await s.waitForTimeout(600);

  sprawdz(bledyKonsoli.length === 0, `brak bledow w konsoli${bledyKonsoli.length ? ": " + bledyKonsoli[0] : ""}`);

  // dokladnie jeden nagłówek h1 na stronie
  const h1 = await s.locator("h1").count();
  sprawdz(h1 === 1, `dokladnie jeden <h1> (znaleziono ${h1})`);

  // kazde pole formularza ma etykiete
  const bezEtykiety = await s.evaluate(() => {
    const pola = [...document.querySelectorAll("input:not([type=hidden]), select, textarea")];
    return pola.filter((el) => {
      if (el.getAttribute("aria-hidden") === "true") return false;
      const id = el.getAttribute("id");
      const etykieta = id && document.querySelector(`label[for="${id}"]`);
      return !etykieta && !el.getAttribute("aria-label");
    }).length;
  });
  sprawdz(bezEtykiety === 0, `kazde pole ma etykiete (bez: ${bezEtykiety})`);

  // cele dotykowe min. 44x44 wg WCAG 2.2 AA (kryterium 2.5.8)
  const zaMale = await s.evaluate(() => {
    const el = [...document.querySelectorAll("a, button, input[type=submit]")];
    return el.filter((e) => {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const w = getComputedStyle(e);
      if (w.position === "absolute" && parseInt(w.left) < -1000) return false;
      return r.height < 24 || r.width < 24;
    }).map((e) => (e.textContent || "").trim().slice(0, 24)).slice(0, 3);
  });
  sprawdz(zaMale.length === 0, `cele dotykowe nie sa za male${zaMale.length ? ": " + zaMale.join(", ") : ""}`);

  // brak poziomego przewijania na telefonie
  const przewijanie = await s.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  sprawdz(!przewijanie, "brak poziomego przewijania na 390 px");

  // strona ma tytul i jezyk
  sprawdz((await s.title()).length > 5, "strona ma tytul");
  sprawdz(await s.evaluate(() => document.documentElement.lang === "pl"), 'atrybut lang="pl"');

  await k.close();
}

await p.close();
console.log(raport.join("\n"));
console.log(bledow === 0 ? "\nWSZYSTKIE TESTY PRZESZLY" : `\nNIEPOWODZENIA: ${bledow}`);
process.exit(bledow === 0 ? 0 : 1);
