// @vitest-environment node
import { it, expect, vi } from "vitest";
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
vi.mock("../lib/db", () => ({ listPubliczny: vi.fn(async (id) => id === "public-test" ? { id, numer: 1, imie: "Przykład", wiek: 8, opis: "Marzę o książce o gwiazdach.", status: "OPUBLIKOWANY" } : null) }));
import { GET } from "../app/api/listy/[id]/story/route.js";
it("renders real 1080 × 1920 PNG with the campaign background", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Generator must not fetch fonts or textures externally"); }));
  const result = await GET(new Request("https://portal.example/api/listy/public-test/story"), { params: Promise.resolve({ id: "public-test" }) });
  expect(result.status).toBe(200);
  const png = Buffer.from(await result.arrayBuffer());
  const meta = await sharp(png).metadata();
  if (process.env.STORY_TEST_PREVIEW) await writeFile(process.env.STORY_TEST_PREVIEW, png);
  expect([meta.width,meta.height,meta.format]).toEqual([1080,1920,"png"]);
  expect(result.headers.get("cache-control")).toBe("no-store");
  expect(fetch.mock.calls.filter(([url]) => /^https?:/.test(String(url))).map(([url]) => url)).toEqual([]);
});
it("does not generate cards for an unpublished or unknown letter", async () => {
  const result = await GET(new Request("https://portal.example/api/listy/private/story"), { params: Promise.resolve({ id: "private" }) });
  expect(result.status).toBe(404);
});
