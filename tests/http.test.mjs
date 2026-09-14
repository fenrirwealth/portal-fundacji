import test from "node:test";
import assert from "node:assert/strict";
import { BladHttp, jsonZLimitem } from "../lib/http.mjs";

test("czyta maly obiekt JSON", async () => {
  const request = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ok: true }),
  });
  assert.deepEqual(await jsonZLimitem(request, 1024), { ok: true });
});

test("odrzuca uszkodzony JSON kontrolowanym bledem 400", async () => {
  const request = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  await assert.rejects(() => jsonZLimitem(request, 1024), (e) => e instanceof BladHttp && e.status === 400);
});

test("odrzuca zadanie przekraczajace limit", async () => {
  const request = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tekst: "x".repeat(200) }),
  });
  await assert.rejects(() => jsonZLimitem(request, 64), (e) => e instanceof BladHttp && e.status === 413);
});

test("odrzuca inny typ tresci", async () => {
  const request = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "{}",
  });
  await assert.rejects(() => jsonZLimitem(request, 1024), (e) => e instanceof BladHttp && e.status === 415);
});
