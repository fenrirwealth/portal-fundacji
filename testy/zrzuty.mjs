// Generator zrzutow do przegladu wizualnego.
// Uruchamiac przy dzialajacym serwerze: npm run zrzuty
import { chromium } from "playwright";
const BAZA = process.env.BAZA || "http://127.0.0.1:3100";
const KAT = process.env.KAT || "/mnt/user-data/outputs/zrzuty";
const p = await chromium.launch(); const bledy = [];
async function zrzut(n, sc, urz) {
  const k = await p.newContext(urz === "mobile"
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const s = await k.newPage();
  s.on("console", (m) => { if (m.type() === "error") bledy.push(`${urz} ${sc}: ${m.text()}`); });
  s.on("pageerror", (e) => bledy.push(`${urz} ${sc}: ${e.message}`));
  await s.goto(BAZA + sc, { waitUntil: "load", timeout: 30000 });
  await s.waitForTimeout(1000);
  await s.screenshot({ path: `${KAT}/${urz}-${n}.png`, fullPage: true });
  await k.close();
}
const k = await p.newContext({ viewport: { width: 1440, height: 900 } });
const s = await k.newPage();
await s.goto(BAZA + "/listy", { waitUntil: "load" });
const href = await s.locator("a.karta-listu").first().getAttribute("href");
await k.close();
for (const [n, sc] of [["start", "/"], ["listy", "/listy"], ["list-szczegol", href],
  ["zglos-placowke", "/zglos-placowke"], ["zaloguj", "/zaloguj"],
  ["listy-puste", "/listy?szukaj=zzzz"], ["listy-filtr", "/listy?kategoria=SPORT&wolne=1"],
  ["regulamin", "/regulamin"]]) {
  await zrzut(n, sc, "desktop"); await zrzut(n, sc, "mobile"); process.stdout.write(".");
}
await p.close();
console.log("\n" + (bledy.length ? "BLEDY:\n" + bledy.join("\n") : "Brak bledow w konsoli przegladarki"));
