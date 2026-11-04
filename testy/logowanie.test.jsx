import { describe, it, expect, vi, beforeEach } from 'vitest';

const { signIn, zapiszCookie, normalizujEmail } = vi.hoisted(() => ({
  signIn: vi.fn(), zapiszCookie: vi.fn(),
  normalizujEmail: vi.fn((email) => {
    const wartosc = String(email).trim().toLowerCase();
    if (!wartosc.includes('@')) throw new Error('email');
    return wartosc;
  }),
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: zapiszCookie }) }));
vi.mock('../auth', () => ({ signIn, normalizujEmail }));
vi.mock('../lib/db', () => ({ bezpiecznaSciezka: (p) => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !p.includes('\\') ? p : '/listy' }));
vi.mock('next-auth', async () => ({ AuthError: (await import('@auth/core/errors')).AuthError }));
import { AuthError } from '@auth/core/errors';
import { wyslijLink } from '../app/zaloguj/link-actions';

const formularz = (email, wroc) => {
  const f = new FormData(); f.set('email', email); f.set('wroc', wroc); return f;
};
beforeEach(() => { vi.clearAllMocks(); signIn.mockReset(); });
describe('wejście darczyńcy', () => {
  it('nie wysyła wiadomości dla niepoprawnego adresu', async () => {
    const wynik = await wyslijLink({}, formularz('niepoprawny', '/listy/abc'));
    expect(wynik.blad).toContain('Sprawdź');
    expect(signIn).not.toHaveBeenCalled();
    expect(zapiszCookie).not.toHaveBeenCalled();
  });
  it('przekazuje ten sam wybrany list do logowania i ponowienia', async () => {
    await wyslijLink({}, formularz(' ANNA@EXAMPLE.COM ', '/listy/abc'));
    expect(signIn).toHaveBeenCalledWith('nodemailer', { email: 'anna@example.com', redirectTo: '/listy/abc' });
    expect(zapiszCookie).toHaveBeenCalledWith('portal-powrot-logowania', '/listy/abc', expect.objectContaining({ httpOnly: true, sameSite: 'lax', maxAge: 1800 }));
  });
  it('odrzuca obcą domenę jako cel powrotu', async () => {
    await wyslijLink({}, formularz('anna@example.com', 'https://obca.example'));
    expect(signIn).toHaveBeenCalledWith('nodemailer', expect.objectContaining({ redirectTo: '/listy' }));
  });
  it('przepuszcza przekierowanie Next.js zamiast pokazać fałszywy błąd', async () => {
    const redirect = new Error('NEXT_REDIRECT');
    signIn.mockRejectedValue(redirect);
    await expect(wyslijLink({}, formularz('anna@example.com', '/listy/abc'))).rejects.toBe(redirect);
  });
  it('błąd wysłania zachowuje adres do poprawienia', async () => {
    signIn.mockRejectedValue(new AuthError('SMTP'));
    const wynik = await wyslijLink({}, formularz('anna@example.com', '/listy/abc'));
    expect(wynik.email).toBe('anna@example.com');
    expect(wynik.blad).toContain('Nie udało się wysłać');
  });
});
