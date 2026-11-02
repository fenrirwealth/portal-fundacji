import test from 'node:test';
import assert from 'node:assert/strict';
import { zakodujHaslo, sprawdzHaslo } from '../lib/haslo.mjs';
test('hasła mają losową sól, odrzucają błędne hasło i uszkodzony zapis', async () => {
 const a = await zakodujHaslo('Dlugie-haslo-testowe-123');
 const b = await zakodujHaslo('Dlugie-haslo-testowe-123');
 assert.notEqual(a,b);
 assert.equal(await sprawdzHaslo('Dlugie-haslo-testowe-123',a),true);
 assert.equal(await sprawdzHaslo('inne-haslo',a),false);
 assert.equal(await sprawdzHaslo('inne-haslo',null),false);
});
