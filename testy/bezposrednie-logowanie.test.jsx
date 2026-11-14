import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({ user: vi.fn(), session: vi.fn(), cookie: vi.fn(), signIn: vi.fn() }));
vi.mock('../lib/db', () => ({ db: { user: { findUnique: mocks.user }, session: { create: mocks.session } }, bezpiecznaSciezka: () => '/listy' }));
vi.mock('../auth', () => ({ normalizujEmail: email => String(email).trim().toLowerCase(), signIn: mocks.signIn }));
vi.mock('../lib/admin', () => ({ ROLE_REDAKCJI: ['REDAKCJA', 'ZARZAD'] }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: mocks.cookie }) }));
vi.mock('next/navigation', () => ({ redirect: path => { throw new Error('redirect:' + path); } }));
vi.mock('next-auth', async () => ({ AuthError: (await import('@auth/core/errors')).AuthError }));
import { wyslijLink } from '../app/zaloguj/link-actions';
const email = process.env.TEST_LOGIN_EMAIL;
const form = (address = email, remember = false) => { const data = new FormData(); data.set('email', address); if (remember) data.set('zapamietaj', 'tak'); return data; };
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: 'admin', rola: 'ZARZAD', emailVerified: new Date() }); mocks.session.mockResolvedValue({}); });
describe.skipIf(!email)('logowanie wskazanego konta', () => {
  it('tworzy losową sesję i otwiera panel bez poczty', async () => {
    await expect(wyslijLink({}, form(' ' + email.toUpperCase() + ' '))).rejects.toThrow('redirect:/admin#zarzadzanie-listami');
    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(mocks.session).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'admin', sessionToken: expect.stringMatching(/^[a-f0-9]{64}$/), zapamietana: false, zgodaZapamietania: null }) });
    const data = mocks.session.mock.calls[0][0].data;
    expect(data.expires.getTime() - Date.now()).toBeGreaterThan(28790000);
    expect(mocks.cookie).toHaveBeenCalledWith(expect.stringContaining('authjs.session-token'), data.sessionToken, expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }));
  });
  it('zapisuje zgodę i termin 30 dni', async () => {
    await expect(wyslijLink({}, form(email, true))).rejects.toThrow('redirect:');
    const data = mocks.session.mock.calls[0][0].data;
    expect(data.zapamietana).toBe(true); expect(data.zgodaZapamietania).toBeInstanceOf(Date);
    expect(data.expires.getTime() - Date.now()).toBeGreaterThan(2591990000);
  });
  it.each([null, { id: 'x', rola: 'DARCZYNCA', emailVerified: new Date() }, { id: 'x', rola: 'ZARZAD', emailVerified: null }])('odrzuca brak dostępu administracyjnego %j', async konto => {
    mocks.user.mockResolvedValue(konto);
    expect((await wyslijLink({}, form())).blad).toContain('nie ma aktywnego');
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it('wysyła link dla innego konta', async () => {
    await wyslijLink({}, form('other@example.com'));
    expect(mocks.signIn).toHaveBeenCalled(); expect(mocks.user).not.toHaveBeenCalled();
  });
  it('zwraca błąd bazy bez ustawienia sesji w cookie', async () => {
    mocks.session.mockRejectedValueOnce(new Error('db'));
    expect((await wyslijLink({}, form())).blad).toContain('Nie udało się zalogować');
    expect(mocks.cookie.mock.calls.some(call => call[0].includes('session-token'))).toBe(false);
  });
});
