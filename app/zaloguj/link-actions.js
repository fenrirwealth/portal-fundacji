"use server";

import { cookies } from "next/headers";
import { AuthError } from "next-auth";
import { normalizujEmail, signIn } from "../../auth";
import { bezpiecznaSciezka } from "../../lib/db";

export async function wyslijLink(_poprzedniStan, formData) {
  let email;
  try {
    email = normalizujEmail(formData.get("email"));
  } catch {
    return { blad: "Sprawdź adres e-mail, np. anna@poczta.pl.", email: String(formData.get("email") || "").slice(0, 254) };
  }
  const wroc = bezpiecznaSciezka(formData.get("wroc"));
  // Ponowienie i wygasły link zachowują lokalny cel powrotu.
  (await cookies()).set("portal-powrot-logowania", wroc, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/zaloguj", maxAge: 30 * 60,
  });
  try {
    await signIn("nodemailer", { email, redirectTo: wroc });
  } catch (blad) {
    // Przekierowanie Next.js także jest wyjątkiem: musi dotrzeć do routera.
    if (!(blad instanceof AuthError)) throw blad;
    return { blad: "Nie udało się wysłać linku. Spróbuj ponownie za chwilę lub napisz do Fundacji.", email };
  }
  return { blad: "", email };
}
