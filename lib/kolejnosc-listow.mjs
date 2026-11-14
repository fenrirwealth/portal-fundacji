export const OKRES_ROTACJI_LISTOW = 15 * 60 * 1000;
export const LICZBA_NAJNOWSZYCH_LISTOW = 6;

export function uporzadkujListy(listy, teraz = Date.now()) {
  const wedlugNumeru = [...listy].sort((a, b) => b.numer - a.numer || a.id.localeCompare(b.id));
  const najnowsze = wedlugNumeru.slice(0, LICZBA_NAJNOWSZYCH_LISTOW);
  const starsze = wedlugNumeru.slice(LICZBA_NAJNOWSZYCH_LISTOW);
  if (!starsze.length) return najnowsze;

  const przesuniecie = Math.floor(Number(teraz) / OKRES_ROTACJI_LISTOW) % starsze.length;
  return [...najnowsze, ...starsze.slice(przesuniecie), ...starsze.slice(0, przesuniecie)];
}
