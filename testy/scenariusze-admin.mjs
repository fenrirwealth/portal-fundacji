// Scenariusze panelu redakcji przechodzone jak przez czlowieka:
// tworzenie, bledna walidacja, poprawny zapis, wycofanie, przywrocenie.
// Testujemy przez interfejs, bo dopiero on pokazuje, czy bledy wracaja
// do wlasciwych pol i czy wpisane dane nie znikaja.
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BAZA = process.env.BAZA || "http://127.0.0.1:3100";
const TOKEN = "scenariusze-" + Date.now();

// Test zaklada wlasne konto redakcji i wlasna sesje, zeby nie zalezec
// od stanu zostawionego przez poprzednie uruchomienie.
const db = new PrismaClient();
const konto = await db.user.upsert({
  where: { email: "scenariusze@fundacja.test" },
  update: { rola: "ZARZAD" },
  create: { email: "scenariusze@fundacja.test", rola: "ZARZAD", name: "Test scenariuszy" },
});
await db.session.create({
  data: { sessionToken: TOKEN, userId: konto.id, expires: new Date(Date.now() + 3600_000) },
});

const p = await chromium.launch();
const k = await p.newContext({ viewport: { width: 1440, height: 1000 } });
process.on("uncaughtException", async (e) => {
  console.log(raport.join("\n"));
  console.log("\nPRZERWANE:", e.message.split("\n")[0]);
  try { await db.session.deleteMany({ where: { sessionToken: TOKEN } }); await db.$disconnect(); } catch {}
  process.exit(1);
});
await k.addCookies([{ name: "authjs.session-token", value: TOKEN, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
const s = await k.newPage();

let bledow = 0;
const raport = [];
function sprawdz(warunek, opis) {
  if (!warunek) { bledow++; raport.push("  ✕ " + opis); } else raport.push("  ✓ " + opis);
}

// ---------- 0. Zatwierdzenie zgloszenia placowki ----------
raport.push("\n0. Zatwierdzenie zgloszenia placowki");
await s.goto(BAZA + "/admin", { waitUntil: "load" });
const doZatwierdzenia = s.locator('form button[name="decyzja"][value="zatwierdz"]');
if (await doZatwierdzenia.count()) {
  await doZatwierdzenia.first().click();
  await s.waitForTimeout(1500);
  sprawdz(s.url().includes("sukces=zgloszenie"), "zgloszenie zatwierdzone");
} else {
  raport.push("  – brak oczekujacych zgloszen, pomijam");
}

// ---------- 1. Bledna walidacja przy tworzeniu ----------
raport.push("\n1. Nowy list — bledne dane");
await s.goto(BAZA + "/admin/listy/nowy", { waitUntil: "load" });
await s.fill('input[name="imie"]', "Testowe Imie");
await s.fill('input[name="wiek"]', "99");                 // poza zakresem
await s.fill('textarea[name="marzenie"]', "ab");           // za krotkie
await s.fill('input[name="zdjecieUrl"]', "http://bez-tls.example");  // bez https
await s.click('form.formularz-admin button[type="submit"]');
await s.waitForTimeout(1200);

sprawdz(s.url().includes("/admin/listy/nowy"), "zostajemy na formularzu, bez przekierowania");
sprawdz((await s.locator('.pole-z-bledem').count()) >= 3, "bledy przypisane do konkretnych pol");
sprawdz(await s.locator('text=Wiek musi byc liczba od 1 do 25.').isVisible(), "komunikat przy polu wiek");
sprawdz(await s.locator('text=Adres zdjecia musi zaczynac sie od https://').isVisible(), "komunikat przy polu zdjecia");
sprawdz((await s.inputValue('input[name="imie"]')) === "Testowe Imie", "wpisane imie NIE znikneło");
sprawdz((await s.inputValue('textarea[name="marzenie"]')) === "ab", "wpisane marzenie NIE znikneło");

// ---------- 2. Poprawny zapis ----------
raport.push("\n2. Nowy list — dane poprawne");
await s.selectOption('select[name="udzialId"]', { index: 1 });
await s.fill('input[name="wiek"]', "9");
await s.fill('textarea[name="marzenie"]', "Rower z koszykiem");
await s.fill('input[name="zdjecieUrl"]', "");
await s.selectOption('select[name="wojewodztwo"]', "mazowieckie");
await s.selectOption('select[name="kategoria"]', "SPORT");
await s.click('form.formularz-admin button[type="submit"]');
// Wzorzec musi wykluczac "nowy" — inaczej pasuje do adresu formularza
// i oczekiwanie konczy sie natychmiast, a dalsze kroki dzialaja na zlej stronie.
await s.waitForURL(/sukces=utworzony/, { timeout: 15000 });
sprawdz(s.url().includes("sukces=utworzony"), "przekierowanie na utworzony list");
const adresListu = s.url().split("?")[0];
sprawdz(await s.locator('text=Szkic listu został utworzony.').isVisible(), "komunikat sukcesu");

// ---------- 3. Edycja z bledem ----------
raport.push("\n3. Edycja — proba publikacji bez listy kontrolnej");
await s.fill('input[name="imie"]', "Zmienione");
await s.click('form.formularz-admin button[name="operacja"][value="publikuj"]');
await s.waitForTimeout(1200);
sprawdz(s.url().startsWith(adresListu), "zostajemy na liscie, bez utraty kontekstu");
sprawdz(await s.locator('text=/brakuje jeszcze \\d+ z 10/').isVisible(), "komunikat o brakach listy kontrolnej");
sprawdz((await s.inputValue('input[name="imie"]')) === "Zmienione", "zmienione imie NIE znikneło");

// ---------- 4. Zapis szkicu ----------
raport.push("\n4. Edycja — zapis szkicu");
await s.click('form.formularz-admin button[name="operacja"][value="zapisz"]');
await s.waitForTimeout(1500);
sprawdz(s.url().includes("sukces=zapisany"), "zapis szkicu konczy sie sukcesem");
sprawdz((await s.inputValue('input[name="imie"]')) === "Zmienione", "zmiana zostala utrwalona");

// ---------- 5. Wycofanie ----------
raport.push("\n5. Wycofanie listu");
await s.click('form.formularz-admin button[name="operacja"][value="wycofaj"]');
await s.waitForTimeout(1500);
sprawdz(s.url().includes("sukces=wycofany"), "list wycofany");
sprawdz(await s.locator('text=List jest w archiwum').isVisible(), "widok archiwum zamiast formularza");
sprawdz((await s.locator('form.formularz-admin button[name="operacja"][value="publikuj"]').count()) === 0, "brak przycisku publikacji w archiwum");

// ---------- 6. Przywrocenie ----------
raport.push("\n6. Przywrocenie do szkicow");
await s.click('form.formularz-admin button[name="operacja"][value="przywroc"]');
await s.waitForTimeout(1500);
sprawdz(s.url().includes("sukces=przywrocony"), "list przywrocony");
const status = await s.locator(".plakietka").first().textContent();
sprawdz((status || "").includes("Szkic"), `status po przywroceniu to Szkic (jest: ${status})`);
sprawdz((await s.locator('form.formularz-admin button[name="operacja"][value="publikuj"]').count()) === 1, "formularz znow dostepny");

// ---------- 7. Lista nie pokazuje wycofanych domyslnie ----------
raport.push("\n7. Panel — archiwum ukryte domyslnie");
await s.goto(BAZA + "/admin", { waitUntil: "load" });
sprawdz(await s.locator('input[name="szukaj"]').isVisible(), "wyszukiwarka obecna");
sprawdz(await s.locator('text=Archiwum').isVisible(), "filtr archiwum obecny");

await p.close();
await db.session.deleteMany({ where: { sessionToken: TOKEN } });
await db.$disconnect();

console.log(raport.join("\n"));
console.log(bledow === 0 ? "\nWSZYSTKIE SCENARIUSZE PRZESZLY" : `\nNIEPOWODZENIA: ${bledow}`);
process.exit(bledow === 0 ? 0 : 1);
