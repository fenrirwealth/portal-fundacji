export function wiekPL(wiek) {
  if (wiek === 0) return "poniżej roku";
  if (wiek === 1) return "1 rok";
  const reszta = wiek % 10;
  const nastolatek = wiek % 100 >= 12 && wiek % 100 <= 14;
  return `${wiek} ${reszta >= 2 && reszta <= 4 && !nastolatek ? "lata" : "lat"}`;
}
