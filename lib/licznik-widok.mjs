// Reject malformed events instead of presenting NaN or invented statistics.
export function normalizujLicznik(stan) {
  if (!stan || !Number.isSafeInteger(stan.wszystkie) || !Number.isSafeInteger(stan.wolne) || stan.wszystkie < 0 || stan.wolne < 0 || stan.wolne > stan.wszystkie) return null;
  const majaMikolaja = stan.wszystkie - stan.wolne;
  return { wszystkie: stan.wszystkie, wolne: stan.wolne, majaMikolaja, procent: stan.wszystkie ? Math.round(majaMikolaja / stan.wszystkie * 100) : 0 };
}
