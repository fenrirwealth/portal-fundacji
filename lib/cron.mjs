import { timingSafeEqual } from "node:crypto";

export function poprawnyTokenCron(naglowek, sekret) {
  if (!sekret || typeof naglowek !== "string" || !naglowek.startsWith("Bearer ")) {
    return false;
  }
  const otrzymany = Buffer.from(naglowek.slice(7), "utf8");
  const oczekiwany = Buffer.from(sekret, "utf8");
  return otrzymany.length === oczekiwany.length && timingSafeEqual(otrzymany, oczekiwany);
}
