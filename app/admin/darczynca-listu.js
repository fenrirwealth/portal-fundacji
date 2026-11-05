"use server";

import { revalidatePath } from "next/cache";
import { wymagajRedakcji } from "../../lib/admin";
import { db } from "../../lib/db";

export async function zapiszDarczynce({ listId, rezerwacjaId, recznaOd }, stan, formData) {
  await wymagajRedakcji();
  const wartosc = formData.get("darczynca");
  if (typeof wartosc !== "string" || wartosc.length > 120) {
    return { ...stan, zapisano: false, blad: "Wpisz nazwę o długości do 120 znaków." };
  }

  if (stan?.etykieta !== null && typeof stan?.etykieta !== "string") {
    return { ...stan, zapisano: false, blad: "Odśwież panel przed zapisaniem darczyńcy." };
  }

  const etykieta = wartosc.trim() || null;
  const wynik = rezerwacjaId
    ? await db.rezerwacja.updateMany({
        where: {
          id: rezerwacjaId, listId,
          OR: [
            { status: "OCZEKUJE", wygasa: { gt: new Date() } },
            { status: { in: ["POTWIERDZONA", "DOSTARCZONA"] } },
          ],
          darczyncaEtykieta: stan.etykieta,
        },
        data: { darczyncaEtykieta: etykieta },
      })
    : await db.list.updateMany({
        where: {
          id: listId, status: "ZAREZERWOWANY",
          rezerwacjaReczna: { not: null, equals: new Date(recznaOd) },
          rezerwacjaRecznaDarczynca: stan.etykieta,
        },
        data: { rezerwacjaRecznaDarczynca: etykieta },
      });

  if (wynik.count !== 1) {
    return { ...stan, zapisano: false, blad: "Rezerwacja lub nazwa darczyńcy uległa zmianie. Odśwież panel przed ponownym zapisem." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/listy/" + listId);
  return { etykieta, zapisano: true, blad: "" };
}
