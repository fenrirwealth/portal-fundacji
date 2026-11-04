import test from 'node:test';
import assert from 'node:assert/strict';
import { terminKontaktu, dlugoscSesji, SESJA_KROTKA, SESJA_ZAPAMIETANA, EMAIL_FUNDACJI } from '../lib/zasady-akcji.mjs';

test('kontakt ma dokładnie 48 godzin również przy zmianie czasu', () => {
  for (const data of ['2026-10-24T12:00:00Z', '2026-03-28T12:00:00Z']) {
    const teraz = new Date(data);
    assert.equal(terminKontaktu(teraz).getTime() - teraz.getTime(), 48 * 3600000);
  }
});
test('30 dni sesji wymaga jawnej zgody, a brak zgody daje 8 godzin', () => {
  assert.equal(dlugoscSesji(true), SESJA_ZAPAMIETANA);
  assert.equal(dlugoscSesji(false), SESJA_KROTKA);
  assert.equal(dlugoscSesji(undefined), SESJA_KROTKA);
  assert.equal(dlugoscSesji('tak'), SESJA_KROTKA);
  assert.equal(SESJA_ZAPAMIETANA, 30 * 24 * 3600);
});
test('powiadomienia rezerwacyjne trafiają na potwierdzony adres Fundacji', () => {
  assert.equal(EMAIL_FUNDACJI, 'kontakt@fundacjalepszydomlepszejutro.pl');
});
