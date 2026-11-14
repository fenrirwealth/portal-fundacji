"use server";

import { cookies } from "next/headers";
import { AuthError } from "next-auth";
import { normalizujEmail, signIn } from "../../auth";
import { bezpiecznaSciezka } from "../../lib/db";
import { COOKIE_ZAPAMIETAJ, SESJA_ZAPAMIETANA } from "../../lib/zasady-akcji.mjs";

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
  try {
    await signIn("nodemailer", { email, redirectTo: wroc });
  } catch (blad) {
    // Przekierowanie Next.js także jest wyjątkiem: musi dotrzeć do routera.
    if (!(blad instanceof AuthError)) throw blad;
    return { blad: "Nie udało się wysłać linku. Spróbuj ponownie za chwilę lub napisz do Fundacji.", email, zapamietaj };
  }
  return { blad: "", email, zapamietaj };
}
