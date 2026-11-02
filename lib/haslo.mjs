import { randomBytes, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(derive);
export async function zakodujHaslo(haslo) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(haslo, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}
export async function sprawdzHaslo(haslo, zapis) {
  const [salt, hash] = (zapis || '').split(':');
  if (!salt || !hash || hash.length !== 128) return false;
  const actual = await scrypt(haslo, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
