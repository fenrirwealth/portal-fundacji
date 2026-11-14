"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { ROLE_REDAKCJI } from "../../lib/admin";
import { cookies } from "next/headers";
import { AuthError } from "next-auth";
import { normalizujEmail, signIn } from "../../auth";
import { db, bezpiecznaSciezka } from "../../lib/db";
import { COOKIE_ZAPAMIETAJ, SESJA_ZAPAMIETANA, dlugoscSesji } from "../../lib/zasady-akcji.mjs";

export async function wyslijLink(_poprzedniStan, formData) {
  const zapamietaj = formData.get("zapamietaj") === "tak";
  let email;
  try {
    email = normalizujEmail(formData.get("email"));
  } catch {
    return { blad: "Sprawdź adres e-mail, np. anna@poczta.pl.", email: String(formData.get("email") || "").slice(0, 254), zapamietaj };
  }
  const cel = bezpiecznaSciezka(formData.get("wroc"));
  const wroc = cel.startsWith("/zaloguj") ? "/listy" : cel;
  (await cookies()).set(COOKIE_ZAPAMIETAJ, zapamietaj ? "1" : "0", {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: zapamietaj ? SESJA_ZAPAMIETANA : 60 * 60,
  });
  // Ponowienie i wygasły link zachowują lokalny cel powrotu.
  (await cookies()).set("portal-powrot-logowania", wroc, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/zaloguj", maxAge: 24 * 60 * 60,
  });
  // Wyjątek zaakceptowany przez właściciela: sam adres otwiera istniejące
  // konto administracyjne. Skrót ogranicza publikację adresu w repozytorium,
  // ale nie jest dodatkowym zabezpieczeniem ani dowodem tożsamości.
  if (createHash("sha256").update(email).digest("hex") === "3e7cd1c13ad100efe526abfe4694dc19beaa1e643f9d10ded56a0de02a3278b5") {
    try {
      const konto = await db.user.findUnique({ where: { email } });
      if (!konto?.emailVerified || !ROLE_REDAKCJI.includes(konto.rola)) {
        return { blad: "To konto nie ma aktywnego dostępu do panelu Fundacji.", email, zapamietaj };
      }
      const sessionToken = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + dlugoscSesji(zapamietaj) * 1000);
      await db.session.create({ data: {
        userId: konto.id, sessionToken, expires,
        zapamietana: zapamietaj,
        zgodaZapamietania: zapamietaj ? new Date() : null,
      } });
      const secure = process.env.NODE_ENV === "production";
      (await cookies()).set(secure ? "__Secure-authjs.session-token" : "authjs.session-token", sessionToken, {
        httpOnly: true, secure, sameSite: "lax", path: "/", expires,
      });
    } catch {
      return { blad: "Nie udało się zalogować. Spróbuj ponownie za chwilę.", email, zapamietaj };
    }
    redirect("/admin#zarzadzanie-listami");
  }
  try {
    await signIn("nodemailer", { email, redirectTo: wroc });
  } catch (blad) {
    // Przekierowanie Next.js także jest wyjątkiem: musi dotrzeć do routera.
    if (!(blad instanceof AuthError)) throw blad;
    return { blad: "Nie udało się wysłać linku. Spróbuj ponownie za chwilę lub napisz do Fundacji.", email, zapamietaj };
  }
  return { blad: "", email, zapamietaj };
}
