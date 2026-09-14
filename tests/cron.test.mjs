import test from "node:test";
import assert from "node:assert/strict";
import { poprawnyTokenCron } from "../lib/cron.mjs";

test("akceptuje wylacznie dokladny token Bearer", () => {
  assert.equal(poprawnyTokenCron("Bearer bardzo-dlugi-sekret", "bardzo-dlugi-sekret"), true);
  assert.equal(poprawnyTokenCron("Bearer zly-sekret", "bardzo-dlugi-sekret"), false);
  assert.equal(poprawnyTokenCron("bardzo-dlugi-sekret", "bardzo-dlugi-sekret"), false);
  assert.equal(poprawnyTokenCron(null, "bardzo-dlugi-sekret"), false);
});
