"use server";
import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "../../lib/db";
import { limitOperacji } from "../../lib/limit";
import { kolejkujEmail } from "../../lib/kolejka-email";

export async function zapisz(form) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || form.get("zgoda") !== "tak") redirect("/powiadomienia?stan=blad");
  const key = createHash("sha256").update(email).digest("hex");
  if (!(await limitOperacji("nowe-listy-" + key, 2, 3600))) redirect("/powiadomienia?stan=sprawdz");
  const row = await db.powiadomienieListy.upsert({
    where: { email }, update: {},
    create: { email, token: randomBytes(32).toString("hex") },
  });
  if (!(await kolejkujEmail("POTWIERDZ_NOWE_LISTY", { id: row.id }, "zapis-" + row.id + "-" + Date.now()))) redirect("/powiadomienia?stan=blad");
  redirect("/powiadomienia?stan=sprawdz");
}

export async function potwierdz(form) {
  const token = String(form.get("token") || "");
  if (!/^[a-f0-9]{64}$/.test(token)) redirect("/powiadomienia?stan=blad");
  const wynik = await db.powiadomienieListy.updateMany({
    where: { token, OR: [{ potwierdzony: false }, { wyslano: { not: null } }] }, data: { potwierdzony: true, wyslano: null, utworzony: new Date() },
  });
  redirect("/powiadomienia?stan=" + (wynik.count ? "gotowe" : "blad"));
}

export async function wypisz(form) {
  const token = String(form.get("token") || "");
  if (/^[a-f0-9]{64}$/.test(token)) await db.powiadomienieListy.deleteMany({ where: { token } });
  redirect("/powiadomienia?stan=wypisano");
}
