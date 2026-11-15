export const OKRES_ROTACJI_LISTOW = 15 * 60 * 1000;

export function uporzadkujListy(listy, teraz = Date.now()) {
  const wedlugNumeru = [...listy].sort((a, b) => b.numer - a.numer || a.id.localeCompare(b.id));
  const wolne = wedlugNumeru.filter((list) => list.status === "OPUBLIKOWANY");
  const zajete = wedlugNumeru.filter((list) => list.status !== "OPUBLIKOWANY");
  if (zajete.length === 0) return wolne;

  const przesuniecie = Math.floor(Number(teraz) / OKRES_ROTACJI_LISTOW) % zajete.length;
  return [...wolne, ...zajete.slice(przesuniecie), ...zajete.slice(0, przesuniecie)];
}
