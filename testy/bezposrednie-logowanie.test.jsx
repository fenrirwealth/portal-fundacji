import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({ cookie: vi.fn(), signIn: vi.fn() }));
vi.mock('../lib/db', () => ({ bezpiecznaSciezka: () => '/listy' }));
vi.mock('../auth', () => ({ normalizujEmail: email => String(email).trim().toLowerCase(), signIn: mocks.signIn }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: mocks.cookie }) }));
vi.mock('next-auth', async () => ({ AuthError: (await import('@auth/core/errors')).AuthError }));
import { wyslijLink } from '../app/zaloguj/link-actions';
beforeEach(() => vi.clearAllMocks());
describe('weryfikacja logowania przez e-mail', () => {
  it.each(['m.synal@gmail.com', 'other@example.com'])('wymaga linku także dla %s', async email => {
    const data = new FormData(); data.set('email', email);
    await wyslijLink({}, data);
    expect(mocks.signIn).toHaveBeenCalledWith('nodemailer', { email, redirectTo: '/listy' });
    expect(mocks.cookie.mock.calls.some(([name]) => name.includes('session-token'))).toBe(false);
  });
});
