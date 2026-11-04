import { it, expect, vi, beforeEach } from 'vitest';
const { configFactory, cookie, createSession } = vi.hoisted(() => ({
  configFactory: { value: null }, cookie: { value: undefined }, createSession: vi.fn(async ({data}) => data),
}));
vi.mock('next-auth', () => ({ default: (fn) => { configFactory.value=fn; return {}; } }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => cookie.value ? {value:cookie.value} : undefined }) }));
vi.mock('../lib/db', () => ({ db: { session: { create: createSession, findUnique: async () => null, deleteMany: async () => ({count:0}) } } }));
vi.mock('../lib/poczta', () => ({ konfiguracjaSmtp: () => ({}), nadawca: () => 'test@example.invalid' }));
await import('../auth');
beforeEach(() => { vi.clearAllMocks(); cookie.value=undefined; });
it('bez zgody sesja ma 8 godzin i brak zapisu zgody', async () => {
  const config=await configFactory.value();
  const przed=Date.now();
  const s=await config.adapter.createSession({userId:'test',sessionToken:'test',expires:new Date()});
  expect(config.session.maxAge).toBe(28800);
  expect(s.zapamietana).toBe(false); expect(s.zgodaZapamietania).toBe(null);
  expect(s.expires.getTime()-przed).toBeGreaterThanOrEqual(28800000);
  expect(s.expires.getTime()-przed).toBeLessThan(28801000);
});
it('jawna zgoda daje stałe 30 dni i datę zgody w sesji', async () => {
  cookie.value='1';
  const config=await configFactory.value();
  const przed=Date.now();
  const s=await config.adapter.createSession({userId:'test',sessionToken:'test',expires:new Date()});
  expect(config.session.maxAge).toBe(2592000);
  expect(config.session.updateAge).toBeGreaterThan(config.session.maxAge);
  expect(s.zapamietana).toBe(true); expect(s.zgodaZapamietania).toBeInstanceOf(Date);
  expect(s.expires.getTime()-przed).toBeGreaterThanOrEqual(2592000000);
  expect(s.expires.getTime()-przed).toBeLessThan(2592001000);
});

it('brak starej sesji nie blokuje ponownego logowania', async () => {
  const config=await configFactory.value();
  await expect(config.adapter.deleteSession('nieistniejąca-sesja')).resolves.toBe(null);
});
