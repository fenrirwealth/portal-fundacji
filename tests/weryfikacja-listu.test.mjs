import test from 'node:test';
import assert from 'node:assert/strict';
import { POLA_WERYFIKACJI, brakujacePozycje } from '../lib/weryfikacja-listu.mjs';
const pelna = Object.fromEntries(POLA_WERYFIKACJI.map(p => [p, true]));
test('dane w pelnym skanie wymagaja odrebnych zgod', () => {
 const w = {...pelna, brakNazwiska:false, brakDanychWrazliwych:false};
 assert.deepEqual(brakujacePozycje(w), ['brakNazwiska','brakDanychWrazliwych']);
 assert.deepEqual(brakujacePozycje({...w,zgodaNaNazwisko:true}), ['brakDanychWrazliwych']);
 assert.deepEqual(brakujacePozycje({...w,zgodaNaNazwisko:true,zgodaNaDaneZdrowotne:true}), []);
 assert.deepEqual(brakujacePozycje({...w,zgodaNaNazwisko:true,zgodaNaDaneZdrowotne:true,zgodaDolaczona:false}), ['zgodaDolaczona']);
 assert.deepEqual(brakujacePozycje({...pelna,brakMiejscowosci:false,zgodaNaNazwisko:true,zgodaNaDaneZdrowotne:true}), ['brakMiejscowosci']);
});
