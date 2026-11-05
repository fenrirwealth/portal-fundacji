"use server";

import { wymagajRedakcji } from "../../lib/admin";
import { db } from "../../lib/db";

export async function zapiszUwagiListu(listId, poprzedni, formData) {
  const konto = await wymagajRedakcji();
  if (konto.rola !== "ZARZAD") {
    return { ...poprzedni, zapisano: false, blad: "Nie masz dostępu do uwag wewnętrznych." };
  }

  const tresc = formData.get("uwagi");
  const wersja = poprzedni.wersja;
  if (typeof tresc !== "string" || tresc.length > 2000) {
    return { ...poprzedni, zapisano: false, blad: "Uwagi mogą zawierać do 2000 znaków." };
  }

  if (!Number.isInteger(wersja) || wersja < 0 || wersja >= 2147483647) {
    return { ...poprzedni, zapisano: false, blad: "Odśwież panel przed zapisaniem uwag." };
  }

  const uwagi = tresc.trim();
  const konflikt = { ...poprzedni, zapisano: false, blad: "Ktoś zmienił uwagi. Skopiuj swój tekst i odśwież panel, aby zobaczyć ostatni zapis." };
  try {
    if (wersja === 0) {
      await db.notatkaListu.create({ data: { listId, tresc: uwagi } });
    } else {
      const wynik = await db.notatkaListu.updateMany({
        where: { listId, wersja },
        data: { tresc: uwagi, wersja: { increment: 1 } },
      });
      if (wynik.count !== 1) return konflikt;
    }
  } catch (blad) {
    if (blad?.code === "P2002") return konflikt;
    if (blad?.code === "P2003") return { ...poprzedni, zapisano: false, blad: "Tego listu nie ma już w panelu." };
    throw blad;
  }

  return { tresc: uwagi, wersja: wersja + 1, zapisano: true, blad: "" };
}
