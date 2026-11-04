export function adresyZdjeciaListu(id, url) {
  if (typeof url !== 'string' || !url) return null;
  const publiczny = `/api/listy/${id}/zdjecie`;
  if (url === publiczny || url === `https://portal.fundacjalepszydomlepszejutro.pl${publiczny}`) {
    const pelny = `/api/admin/listy/${id}/zdjecie`;
    return { pelny, miniatura: pelny + '?miniatura=1' };
  }
  if (!url.startsWith('https://') && !(url.startsWith('/') && !url.startsWith('//'))) return null;
  return { pelny: url, miniatura: url };
}
