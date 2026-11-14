import test from 'node:test';
import assert from 'node:assert/strict';
import { uporzadkujListy, OKRES_ROTACJI_LISTOW } from '../lib/kolejnosc-listow.mjs';

const list = (numer, status = 'OPUBLIKOWANY') => ({ id: String(numer), numer, status });

test('sześć najnowszych listów jest na górze bez względu na status', () => {
  const dane = [list(1), list(7, 'ZAREZERWOWANY'), list(4), list(2), list(5), list(3), list(6)];
  assert.deepEqual(uporzadkujListy(dane, OKRES_ROTACJI_LISTOW).map((l) => l.numer), [7, 6, 5, 4, 3, 2, 1]);
  assert.deepEqual(dane.map((l) => l.numer), [1, 7, 4, 2, 5, 3, 6]);
});

test('każdy starszy list trafia na pierwsze miejsce pod najnowszymi', () => {
  const dane = [list(1, 'ZAREZERWOWANY'), ...Array.from({ length: 8 }, (_, i) => list(i + 2))];
  const pierwsze = [];
  for (let i = 0; i < 3; i++) {
    const czas = i * OKRES_ROTACJI_LISTOW;
    const wynik = uporzadkujListy(dane, czas);
    assert.deepEqual(wynik.slice(0, 6).map((l) => l.numer), [9, 8, 7, 6, 5, 4]);
    pierwsze.push(wynik[6].numer);
    assert.equal(new Set(wynik.map((l) => l.id)).size, dane.length);
    assert.deepEqual(uporzadkujListy(dane, czas + 1000), wynik);
  }
  assert.deepEqual(pierwsze, [3, 2, 1]);
});

test('puste i krótkie wyniki zachowują komplet listów', () => {
  assert.deepEqual(uporzadkujListy([], 0), []);
  assert.deepEqual(uporzadkujListy([list(2), list(4)], 0), [list(4), list(2)]);
});
