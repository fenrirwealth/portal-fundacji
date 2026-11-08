export const OKRES_ROTACJI_LISTOW = 15 * 60 * 1000;

// Wolne listy zawsze są pierwsze. Rotacja co kwadrans daje każdemu
// miejsce na początku bez przestawiania kart podczas oglądania strony.
export function uporzadkujListy(listy, teraz = Date.now()) {
  const wolne = listy.filter((list) => list.status === 'OPUBLIKOWANY')
    .sort((a, b) => a.numer - b.numer || a.id.localeCompare(b.id));
  const pozostale = listy.filter((list) => list.status !== 'OPUBLIKOWANY');
  if (!wolne.length) return pozostale;
  const przesuniecie = Math.floor(Number(teraz) / OKRES_ROTACJI_LISTOW) % wolne.length;
  return [...wolne.slice(przesuniecie), ...wolne.slice(0, przesuniecie), ...pozostale];
}
