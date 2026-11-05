import { beforeEach, expect, it, vi } from "vitest";

const { wymagajRedakcji, online, reczna } = vi.hoisted(() => ({
  wymagajRedakcji: vi.fn(),
  online: vi.fn(),
  reczna: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../lib/admin", () => ({ wymagajRedakcji }));
vi.mock("../lib/db", () => ({
  db: { rezerwacja: { updateMany: online }, list: { updateMany: reczna } },
}));

import { zapiszDarczynce } from "../app/admin/darczynca-listu";

function formularz(tekst) {
  const dane = new FormData();
  dane.set("darczynca", tekst);
  return dane;
}

beforeEach(() => {
  vi.resetAllMocks();
  wymagajRedakcji.mockResolvedValue({ rola: "ZARZAD" });
});

it("wymaga uprawnień panelu przed edycją etykiety", async () => {
  wymagajRedakcji.mockRejectedValue(new Error("Brak dostępu"));
  await expect(zapiszDarczynce({ listId: "l1", rezerwacjaId: "r1" }, { etykieta: null }, formularz("Firma")))
    .rejects.toThrow("Brak dostępu");
  expect(online).not.toHaveBeenCalled();
  expect(reczna).not.toHaveBeenCalled();
});

it("zmienia etykietę tylko dla wskazanej rezerwacji online", async () => {
  online.mockResolvedValue({ count: 1 });
  const wynik = await zapiszDarczynce({ listId: "l1", rezerwacjaId: "r1" }, { etykieta: null }, formularz("  Firma A "));
  expect(wynik).toMatchObject({ zapisano: true, etykieta: "Firma A" });
  expect(online).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ id: "r1", listId: "l1", darczyncaEtykieta: null }),
    data: { darczyncaEtykieta: "Firma A" },
  }));
  expect(reczna).not.toHaveBeenCalled();
});

it("nie zapisuje formularza otwartego przed zwolnieniem ręcznej rezerwacji", async () => {
  const od = "2026-11-05T15:00:00Z";
  reczna.mockResolvedValue({ count: 0 });
  const wynik = await zapiszDarczynce({ listId: "l1", recznaOd: od }, { etykieta: "Firma A" }, formularz("Firma B"));
  expect(wynik).toMatchObject({ zapisano: false, etykieta: "Firma A" });
  expect(reczna).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({
      id: "l1", status: "ZAREZERWOWANY",
      rezerwacjaReczna: { not: null, equals: new Date(od) },
      rezerwacjaRecznaDarczynca: "Firma A",
    }),
  }));
});
