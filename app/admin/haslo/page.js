import { wymagajRedakcji } from '../../../lib/admin';
import { ustawHaslo } from '../../zaloguj/haslo-actions';
export const dynamic = 'force-dynamic';
export default async function Haslo({ searchParams }) {
  await wymagajRedakcji('/admin/haslo');
  const p = await searchParams;
  return <div className="wrap sekcja"><div className="waski"><h1>Hasło administratora</h1>
    <p>Ustaw własne hasło, aby kolejne logowania odbywały się bez linku z poczty.</p>
    {p?.blad && <p role="alert" className="blad">{p.blad}</p>}
    <form action={ustawHaslo}>
      <label className="pole">Nowe hasło (minimum 12 znaków)<input className="pole-kontrolka" name="haslo" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
      <label className="pole">Powtórz hasło<input className="pole-kontrolka" name="powtorz" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
      <button className="btn" type="submit">Zapisz hasło</button>
    </form></div></div>;
}
