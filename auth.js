import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./lib/db";
import { konfiguracjaSmtp, nadawca } from "./lib/poczta";

// ------------------------------------------------------------
//  Logowanie linkiem jednorazowym
//
//  Brak hasel jest decyzja, nie uproszczeniem: nie ma czego wykrasc
//  i nie ma czego resetowac w grudniu. Darczynca i tak musi podac
//  dzialajacy adres, bo na niego ida przypomnienia o 3-dniowym
//  terminie rezerwacji.
// ------------------------------------------------------------

// Adres e-mail jest tozsamoscia konta. Normalizujemy i sprawdzamy go
// PRZY KAZDYM wejsciu, nie tylko w formularzu. Walidacja po stronie
// przegladarki nie chroni endpointu Auth.js przed bezposrednim zadaniem.
// Przyjmujemy celowo tylko proste adresy ASCII: usuwa to komentarze,
// znaki sterujace i niejednoznaczne domeny IDN, ktore sa niepotrzebne
// w tej akcji, a bywaja zrodlem wstrzykniec do polecen SMTP.
export function normalizujEmail(email) {
  const wartosc = String(email || "").trim().toLowerCase();
  const czesci = wartosc.split("@");

  if (wartosc.length > 254 || czesci.length !== 2) {
    throw new Error("Nieprawidlowy adres e-mail.");
  }

  const [lokalna, domena] = czesci;
  const poprawnaLokalna =
    lokalna.length > 0 &&
    lokalna.length <= 64 &&
    /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(lokalna) &&
    !lokalna.startsWith(".") &&
    !lokalna.endsWith(".") &&
    !lokalna.includes("..");

  const etykiety = domena.split(".");
  const poprawnaDomena =
    domena.length <= 253 &&
    etykiety.length >= 2 &&
    etykiety.every(
      (etykieta) =>
        etykieta.length > 0 &&
        etykieta.length <= 63 &&
        /^[a-z0-9-]+$/.test(etykieta) &&
        !etykieta.startsWith("-") &&
        !etykieta.endsWith("-")
    );

  if (!poprawnaLokalna || !poprawnaDomena) {
    throw new Error("Nieprawidlowy adres e-mail.");
  }

  return wartosc;
}

const bazowy = PrismaAdapter(db);

const adapter = {
  ...bazowy,
  async createUser(dane) {
    return bazowy.createUser({ ...dane, email: normalizujEmail(dane.email) });
  },
  async getUserByEmail(email) {
    return bazowy.getUserByEmail(normalizujEmail(email));
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/zaloguj",
    verifyRequest: "/zaloguj/sprawdz-poczte",
    error: "/zaloguj/blad",
  },
  providers: [
    Nodemailer({
      server: konfiguracjaSmtp(),
      from: nadawca(),
      // 30 minut, nie domyslne 24 godziny. Link daje pelny dostep do
      // konta i lezy w skrzynce — doba to za dlugo, zwlaszcza przy
      // komputerach wspoldzielonych.
      maxAge: 30 * 60,
      normalizeIdentifier: normalizujEmail,
    }),
  ],
  callbacks: {
    // Laczenie kont po adresie e-mail jest WYLACZONE. Gdy dodamy Google,
    // wlaczymy je swiadomie i wylacznie dla niego, pod warunkiem ze
    // zwroci email_verified: dostawca, ktory nie weryfikuje adresow,
    // pozwolilby przejac cudze konto przez samo podanie adresu.
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email_verified !== true) {
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.rola = user.rola;
      return session;
    },
  },
});
