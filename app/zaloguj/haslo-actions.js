'use server';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../../lib/db';
import { wymagajRedakcji, ROLE_REDAKCJI } from '../../lib/admin';
import { zakodujHaslo, sprawdzHaslo } from '../../lib/haslo.mjs';
import { normalizujEmail } from '../../auth';

export async function ustawHaslo(formData) {
  const konto = await wymagajRedakcji('/admin/haslo');
  const haslo = String(formData.get('haslo') || '');
  if (haslo.length < 12 || haslo.length > 128 || haslo !== formData.get('powtorz')) {
    redirect('/admin/haslo?blad=' + encodeURIComponent('Wpisz dwa jednakowe hasła o długości od 12 do 128 znaków.'));
  }
  const passwordHash = await zakodujHaslo(haslo);
  await db.$transaction([
    db.user.update({ where: { id: konto.id }, data: { passwordHash, passwordFailures: 0, passwordWindow: null } }),
    db.session.deleteMany({ where: { userId: konto.id } }),
  ]);
  redirect('/zaloguj?ustawione=1');
}

export async function zalogujHaslem(formData) {
  const blad = '/zaloguj?blad=' + encodeURIComponent('Nie udało się zalogować. Sprawdź dane lub spróbuj ponownie za 15 minut.');
  let email;
  try { email = normalizujEmail(formData.get('email')); } catch { redirect(blad); }
  const haslo = String(formData.get('haslo') || '');
  if (!haslo || haslo.length > 128) redirect(blad);
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.emailVerified || !user.passwordHash || !ROLE_REDAKCJI.includes(user.rola)) redirect(blad);
  const now = new Date();
  await db.user.updateMany({ where: { id: user.id, OR: [{ passwordWindow: null }, { passwordWindow: { lt: new Date(now.getTime() - 900000) } }] }, data: { passwordFailures: 0, passwordWindow: now } });
  const proba = await db.user.update({ where: { id: user.id }, data: { passwordFailures: { increment: 1 } }, select: { passwordFailures: true, passwordHash: true } });
  if (proba.passwordFailures > 5 || !await sprawdzHaslo(haslo, proba.passwordHash)) redirect(blad);
  const sessionToken = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordFailures: 0, passwordWindow: null } }),
    db.session.create({ data: { userId: user.id, sessionToken, expires } }),
  ]);
  const secure = process.env.NODE_ENV === 'production';
  (await cookies()).set(secure ? '__Secure-authjs.session-token' : 'authjs.session-token', sessionToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', expires });
  redirect('/admin');
}
