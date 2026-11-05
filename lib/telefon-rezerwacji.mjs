export function normalizujTelefonRezerwacji(wartosc) {
  if (typeof wartosc !== "string" || wartosc.length > 32 || !/^[+0-9 ().-]+$/.test(wartosc)) return null;

  const numer = wartosc.replace(/[ ().-]/g, "");
  if (/^[1-9][0-9]{8}$/.test(numer)) return "+48" + numer;

  const miedzynarodowy = numer.startsWith("00") ? "+" + numer.slice(2) : numer;
  return /^\+[1-9][0-9]{7,14}$/.test(miedzynarodowy) ? miedzynarodowy : null;
}
