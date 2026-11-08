import test from 'node:test';
import assert from 'node:assert/strict';
import { uporzadkujListy, OKRES_ROTACJI_LISTOW } from '../lib/kolejnosc-listow.mjs';

const list = (numer, status = 'OPUBLIKOWANY') => ({ id: String(numer), numer, status });

test('wolne listy poprzedzają wszystkie zajęte, a wejściowa tablica nie zmienia się', () => {
  const dane = [list(1, 'OPLACONY'), list(4), list(2, 'ZAREZERWOWANY'), list(3)];
  assert.deepEqual(uporzadkujListy(dane, 0).map((l) => l.numer), [3, 4, 1, 2]);
  assert.deepEqual(dane.map((l) => l.numer), [1, 4, 2, 3]);
});

test('każdy wolny list jest pierwszy raz w pełnym cyklu, bez braków i duplikatów', () => {
  const dane = [list(3), list(7), list(9), list(2, 'ZAREZERWOWANY')];
  const pierwsze = [];
  for (let i = 0; i < 3; i++) {
    const wynik = uporzadkujListy(dane, i * OKRES_ROTACJI_LISTOW);
    pierwsze.push(wynik[0].numer);
    assert.deepEqual(wynik.map((l) => l.numer).sort((a, b) => a - b), [2, 3, 7, 9]);
    assert.equal(wynik.at(-1).status, 'ZAREZERWOWANY');
    assert.deepEqual(uporzadkujListy(dane, i * OKRES_ROTACJI_LISTOW + 1000), wynik);
  }
  assert.deepEqual(pierwsze, [3, 7, 9]);
});

test('filtr, pojedynczy wynik i brak wolnych listów zachowują komplet wyników', () => {
  assert.deepEqual(uporzadkujListy([], 0), []);
  assert.deepEqual(uporzadkujListy([list(4)], OKRES_ROTACJI_LISTOW), [list(4)]);
  const zajete = [list(5, 'OPLACONY'), list(1, 'ZAREZERWOWANY')];
  assert.deepEqual(uporzadkujListy(zajete), zajete);
});
