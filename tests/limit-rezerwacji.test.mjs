import test from 'node:test';
import assert from 'node:assert/strict';
import { wolneMiejsceNaKoncie } from '../lib/rezerwacje.mjs';
import { LIMIT_AKTYWNYCH_LISTOW } from '../lib/zasady-akcji.mjs';

function konto(miejsca) {
  let zablokowane = false;
  return {
    async $queryRaw(sql, userId) {
      assert.match(sql.join('?'), /FROM "User".*FOR UPDATE/);
      assert.equal(userId, 'konto-testowe');
      zablokowane = true;
      return [{ id: userId }];
    },
    rezerwacja: {
      async findMany({ where, select }) {
        assert.ok(zablokowane, 'odczyt zajętych miejsc dopiero po blokadzie konta');
        assert.deepEqual(where, { userId: 'konto-testowe', status: { in: ['OCZEKUJE', 'POTWIERDZONA'] } });
        assert.deepEqual(select, { miejsceNaKoncie: true });
        return miejsca.map((miejsceNaKoncie) => ({ miejsceNaKoncie }));
      },
    },
  };
}

test('konto może zająć wszystkie 20 miejsc, w tym drugie i dwudzieste', async () => {
  assert.equal(LIMIT_AKTYWNYCH_LISTOW, 20);
  for (let liczba = 0; liczba < 20; liczba++) {
    const zajete = Array.from({ length: liczba }, (_, i) => i + 1);
    assert.equal(await wolneMiejsceNaKoncie(konto(zajete), 'konto-testowe'), liczba + 1);
  }
});

test('dwudziesta pierwsza aktywna rezerwacja jest odrzucana', async () => {
  await assert.rejects(wolneMiejsceNaKoncie(konto(Array.from({ length: 20 }, (_, i) => i + 1)), 'konto-testowe'), /LIMIT_REZERWACJI/);
});

test('po zwolnieniu rezerwacji można ponownie wykorzystać jej miejsce', async () => {
  const zajete = Array.from({ length: 20 }, (_, i) => i + 1).filter((i) => i !== 7);
  assert.equal(await wolneMiejsceNaKoncie(konto(zajete.reverse()), 'konto-testowe'), 7);
});
