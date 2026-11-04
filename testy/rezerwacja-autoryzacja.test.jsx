import { beforeEach, it, expect, vi } from 'vitest';
const { auth, findFirst, updateMany } = vi.hoisted(() => ({ auth: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() }));
vi.mock('../auth', () => ({ auth }));
vi.mock('../lib/db', () => ({ db: { rezerwacja: { findFirst, updateMany } } }));
vi.mock('../lib/cache', () => ({ KLUCZ_LICZNIKA: 'licznik', usunCache: vi.fn() }));
import { PATCH } from '../app/api/rezerwacja/[id]/route';
beforeEach(() => vi.clearAllMocks());
it('darczyńca nie może sam potwierdzić kontaktu telefonicznego', async () => {
  auth.mockResolvedValue({ user: { id: 'darczyńca' } });
  findFirst.mockResolvedValue({ id: 'r1', status: 'OCZEKUJE', listId: 'l1' });
  const odp = await PATCH(new Request('https://test.invalid/api/rezerwacja/r1', { method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({akcja:'potwierdz'}) }), { params: Promise.resolve({id:'r1'}) });
  expect(odp.status).toBe(403);
  expect(updateMany).not.toHaveBeenCalled();
});
it('brak sesji nie daje dostępu do zmiany rezerwacji', async () => {
  auth.mockResolvedValue(null);
  const odp = await PATCH(new Request('https://test.invalid/api/rezerwacja/r1', {method:'PATCH'}), {params:Promise.resolve({id:'r1'})});
  expect(odp.status).toBe(401);
  expect(findFirst).not.toHaveBeenCalled();
});
