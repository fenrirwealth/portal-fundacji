import { it, expect, vi } from 'vitest';
const { addBulk, add } = vi.hoisted(() => ({ addBulk: vi.fn(async()=>{}), add: vi.fn(async()=>{}) }));
vi.mock('server-only', () => ({}));
vi.mock('bullmq', () => ({ Queue: class { addBulk=addBulk; add=add; } }));
vi.mock('ioredis', () => ({ default: class { on(){} } }));
import { kolejkujEmail } from '../lib/kolejka-email';
it('każda rezerwacja i oba przypomnienia mają oddzielne zadanie dla Fundacji', async () => {
  vi.stubEnv('REDIS_URL','redis://test.invalid');
  for(const typ of ['REZERWACJA','PRZYPOMNIENIE','PRZYPOMNIENIE_DOSTARCZENIA','KONTAKT_POTWIERDZONY']) {
    await kolejkujEmail(typ,{rezerwacjaId:'r1'},`${typ}-r1`);
    expect(addBulk).toHaveBeenLastCalledWith([
      {name:typ,data:{rezerwacjaId:'r1'},opts:{jobId:`${typ}-r1`}},
      {name:`FUNDACJA_${typ}`,data:{rezerwacjaId:'r1'},opts:{jobId:`fundacja-${typ}-r1`}},
    ]);
  }
  vi.unstubAllEnvs();
});

it('nie odnotowuje powiadomienia, dopóki oba zadania nie trafią do kolejki', async () => {
  vi.stubEnv('REDIS_URL', 'redis://test.invalid');
  const updateMany = vi.fn().mockResolvedValue({ count: 1 });
  const db = { rezerwacja: { updateMany } };
  const { kolejkujPowiadomienieRezerwacji } = await import('../lib/kolejka-email');
  try {
    addBulk.mockRejectedValueOnce(new Error('Redis niedostępny'));
    await expect(kolejkujPowiadomienieRezerwacji(db, 'REZERWACJA', 'r2')).rejects.toThrow('Redis niedostępny');
    expect(updateMany).not.toHaveBeenCalled();

    await kolejkujPowiadomienieRezerwacji(db, 'REZERWACJA', 'r2');
    expect(addBulk).toHaveBeenLastCalledWith([
      { name: 'REZERWACJA', data: { rezerwacjaId: 'r2' }, opts: { jobId: 'rezerwacja-r2' } },
      { name: 'FUNDACJA_REZERWACJA', data: { rezerwacjaId: 'r2' }, opts: { jobId: 'fundacja-rezerwacja-r2' } },
    ]);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'r2', emailRezerwacjiZakolejkowany: null },
      data: { emailRezerwacjiZakolejkowany: expect.any(Date) },
    });
  } finally {
    vi.unstubAllEnvs();
  }
});
