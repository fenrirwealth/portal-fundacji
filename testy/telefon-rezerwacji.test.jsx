import { beforeEach, expect, it, vi } from "vitest";

const { auth, db, kolejkujEmail, kolejkujPowiadomienieRezerwacji, wolneMiejsceNaKoncie } = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    user: { findUnique: vi.fn() },
    rezerwacja: { findMany: vi.fn(), updateMany: vi.fn() },
    edycjaAkcji: { findFirst: vi.fn() },
    skanListu: { findMany: vi.fn() },
    udzialPlacowki: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
  kolejkujEmail: vi.fn(),
  kolejkujPowiadomienieRezerwacji: vi.fn(),
  wolneMiejsceNaKoncie: vi.fn(),
}));

vi.mock("../auth", () => ({ auth }));
vi.mock("../lib/db", () => ({ db, WARUNKI_PUBLIKACJI: {}, WERSJA_REGULAMINU: "test" }));
vi.mock("../lib/cache", () => ({ KLUCZ_LICZNIKA: "licznik", usunCache: vi.fn() }));
vi.mock("../lib/kolejka-email", () => ({ kolejkujEmail, kolejkujPowiadomienieRezerwacji }));
vi.mock("../lib/rezerwacje.mjs", () => ({ wygasRezerwacje: async () => [], wolneMiejsceNaKoncie }));
vi.mock("../lib/skany", () => ({ usunPrywatnySkan: vi.fn() }));

import { POST as rezerwuj } from "../app/api/rezerwacja/route";
import { POST as przypomnij } from "../app/api/zadania/przypomnienia/route";

function rezerwacja(telefon) {
  return new Request("https://test.invalid/api/rezerwacja", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listId: "list-7", telefon }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  auth.mockResolvedValue({ user: { id: "darczyńca" } });
  db.user.findUnique.mockResolvedValue({ zgodaRegulamin: new Date(), wersjaRegulaminu: "test" });
  kolejkujEmail.mockResolvedValue(true);
  kolejkujPowiadomienieRezerwacji.mockResolvedValue(undefined);
  wolneMiejsceNaKoncie.mockResolvedValue(20);
});

it.each([undefined, "", "123", "+48 ABC", { numer: "123456789" }])(
  "odrzuca brak lub błędny telefon przed zajęciem listu (%j)",
  async (telefon) => {
    expect((await rezerwuj(rezerwacja(telefon))).status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(kolejkujEmail).not.toHaveBeenCalled();
  }
);

it("zapisuje znormalizowany telefon przy rezerwacji bez ujawniania go w odpowiedzi", async () => {
  const create = vi.fn().mockResolvedValue({ id: "rezerwacja-7" });
  db.edycjaAkcji.findFirst.mockResolvedValue({ id: "edycja" });
  db.$transaction.mockImplementation((akcja) => akcja({
    list: { updateMany: async () => ({ count: 1 }) },
    rezerwacja: { create },
  }));
  const odpowiedz = await rezerwuj(rezerwacja("123 456 789"));
  expect(odpowiedz.status).toBe(200);
  expect(create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ listId: "list-7", telefonKontaktowy: "+48123456789", miejsceNaKoncie: 20 }),
  }));
  expect(kolejkujPowiadomienieRezerwacji).toHaveBeenCalledWith(db, "REZERWACJA", "rezerwacja-7");
  expect(await odpowiedz.json()).not.toHaveProperty("telefonKontaktowy");
});

it("ustawia oddzielne terminy przypomnień i nie kolejkuje ponownie zajętego rekordu", async () => {
  const teraz = new Date("2026-11-05T18:00:00Z");
  vi.useFakeTimers();
  vi.setSystemTime(teraz);
  vi.stubEnv("CRON_SECRET", "testowy-token");
  try {
    db.rezerwacja.findMany.mockResolvedValueOnce([{ id: "pierwszy" }])
      .mockResolvedValueOnce([{ id: "ostatni" }, { id: "zajety" }]).mockResolvedValue([]);
    db.rezerwacja.updateMany.mockImplementation(async ({ where }) => ({ count: where.id === "zajety" ? 0 : 1 }));
    db.skanListu.findMany.mockResolvedValue([]);

    const odpowiedz = await przypomnij(new Request("https://test.invalid/api/zadania/przypomnienia", {
      method: "POST", headers: { authorization: "Bearer testowy-token" },
    }));
    expect(odpowiedz.status).toBe(200);
    expect(db.rezerwacja.findMany.mock.calls[0][0].where).toMatchObject({
      status: "OCZEKUJE", przypomnienieWyslane: null,
      wygasa: { gt: teraz, lte: new Date("2026-11-06T18:00:00Z") },
      OR: [{ telefonKontaktowy: { not: null } }, { wygasa: { gt: new Date("2026-11-05T21:00:00Z") } }],
    });
    expect(db.rezerwacja.findMany.mock.calls[1][0].where).toMatchObject({
      status: "OCZEKUJE", telefonKontaktowy: null, przypomnienieKoncoweWyslane: null,
      wygasa: { gt: teraz, lte: new Date("2026-11-05T21:00:00Z") },
    });
    expect(kolejkujEmail.mock.calls).toEqual([
      ["PRZYPOMNIENIE", { rezerwacjaId: "pierwszy", ostatnie: false }, "przypomnienie-pierwszy"],
      ["PRZYPOMNIENIE", { rezerwacjaId: "ostatni", ostatnie: true }, "przypomnienie-koncowe-ostatni"],
    ]);
  } finally {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  }
});


it("przy limicie 20 zwraca czytelny błąd i nie zajmuje kolejnego listu", async () => {
  const updateMany = vi.fn();
  db.edycjaAkcji.findFirst.mockResolvedValue({ id: "edycja" });
  wolneMiejsceNaKoncie.mockRejectedValue(new Error("LIMIT_REZERWACJI"));
  db.$transaction.mockImplementation((akcja) => akcja({ list: { updateMany } }));
  const odpowiedz = await rezerwuj(rezerwacja("123456789"));
  expect(odpowiedz.status).toBe(429);
  expect((await odpowiedz.json()).blad).toContain("20 aktywnych rezerwacji");
  expect(updateMany).not.toHaveBeenCalled();
  expect(kolejkujEmail).not.toHaveBeenCalled();
});
