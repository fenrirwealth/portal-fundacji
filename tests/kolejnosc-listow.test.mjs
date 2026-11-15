import test from 'node:test';
import assert from 'node:assert/strict';
import { uporzadkujListy, OKRES_ROTACJI_LISTOW } from '../lib/kolejnosc-listow.mjs';

const list = (numer, status = 'OPUBLIKOWANY') => ({ id: String(numer), numer, status });

test('wszystkie wolne listy są na górze, od najnowszego', () => {
  const wolne = Array.from({ length: 7 }, (_, i) => list(i + 1));
  const dane = [list(8, 'ZAREZERWOWANY'), ...wolne];
  const wynik = uporzadkujListy(dane, OKRES_ROTACJI_LISTOW);

  assert.deepEqual(wynik.map((l) => l.numer), [7, 6, 5, 4, 3, 2, 1, 8]);
  assert.deepEqual(dane.map((l) => l.numer), [8, 1, 2, 3, 4, 5, 6, 7]);
});

test('zajęte listy rotują co 15 minut pod wolnymi', () => {
  const dane = [list(3, 'ZAREZERWOWANY'), list(2, 'OPLACONY'), list(4), list(5, 'PRZEKAZANY'), list(1)];
  const kolejnosci = [[5, 3, 2], [3, 2, 5], [2, 5, 3], [5, 3, 2]];
  for (const [okres, zajete] of kolejnosci.entries()) {
    const czas = okres * OKRES_ROTACJI_LISTOW;
    const wynik = uporzadkujListy(dane, czas);
    assert.deepEqual(wynik.map((l) => l.numer), [4, 1, ...zajete]);
    assert.deepEqual(uporzadkujListy(dane, czas + 1000), wynik);
  }
});

test('pusty katalog i katalog zawierający wyłącznie wolne lub zajęte listy', () => {
  assert.deepEqual(uporzadkujListy([], 0), []);
  assert.deepEqual(uporzadkujListy([list(2), list(4)], 0), [list(4), list(2)]);
  const zajete = [list(4, 'ZAREZERWOWANY'), list(2, 'ZAREZERWOWANY')];
  assert.deepEqual(uporzadkujListy(zajete, OKRES_ROTACJI_LISTOW), [zajete[1], zajete[0]]);
});
