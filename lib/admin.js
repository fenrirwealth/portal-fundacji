import { redirect } from "next/navigation";
import { auth } from "../auth";
import { db } from "./db";

export const ROLE_REDAKCJI = ["REDAKCJA", "ZARZAD"];

// Roli z sesji nie traktujemy jako jedynego zrodla prawdy. Kazda strona
// i kazda akcja administracyjna ponownie odczytuje role z bazy.
export async function wymagajRedakcji(wroc = "/admin") {
  const sesja = await auth();
  if (!sesja?.user?.id) {
    redirect("/zaloguj?wroc=" + encodeURIComponent(wroc));
  }

  const konto = await db.user.findUnique({
    where: { id: sesja.user.id },
    select: { id: true, email: true, rola: true },
  });

  if (!konto || !ROLE_REDAKCJI.includes(konto.rola)) redirect("/");
  return konto;
}
