import { beforeEach, expect, it, vi } from "vitest";

const { wymagajRedakcji, create, updateMany } = vi.hoisted(() => ({
  wymagajRedakcji: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("../lib/admin", () => ({ wymagajRedakcji }));
vi.mock("../lib/db", () => ({ db: { notatkaListu: { create, updateMany } } }));

import { zapiszUwagiListu } from "../app/admin/uwagi-listu";

function formularz(tresc) {
  const dane = new FormData();
  dane.set("uwagi", tresc);
  return dane;
}

beforeEach(() => {
  vi.resetAllMocks();
  wymagajRedakcji.mockResolvedValue({ rola: "ZARZAD" });
});

it("redakcja nie może zapisać prywatnej notatki, nawet wywołując akcję bezpośrednio", async () => {
  wymagajRedakcji.mockResolvedValue({ rola: "REDAKCJA" });
  const wynik = await zapiszUwagiListu("list-21", { wersja: 0 }, formularz("Uwaga"));
  expect(wynik.zapisano).toBe(false);
  expect(create).not.toHaveBeenCalled();
  expect(updateMany).not.toHaveBeenCalled();
});

it("zapisuje uwagi przy konkretnym liście i zwraca wersję do kolejnej edycji", async () => {
  const wynik = await zapiszUwagiListu("list-21", { wersja: 0 }, formularz("  Uwaga Fundacji  "));
  expect(create).toHaveBeenCalledWith({ data: { listId: "list-21", tresc: "Uwaga Fundacji" } });
  expect(wynik).toMatchObject({ zapisano: true, tresc: "Uwaga Fundacji", wersja: 1 });
});

it("nie nadpisuje notatki zmienionej w międzyczasie przez drugiego administratora", async () => {
  updateMany.mockResolvedValue({ count: 0 });
  const wynik = await zapiszUwagiListu("list-21", { wersja: 1 }, formularz("Późniejszy zapis"));
  expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { listId: "list-21", wersja: 1 } }));
  expect(wynik).toMatchObject({ zapisano: false, wersja: 1 });
  expect(wynik.blad).toContain("Ktoś zmienił uwagi");
  expect(create).not.toHaveBeenCalled();
});
