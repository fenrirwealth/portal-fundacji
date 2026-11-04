import { it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
const { wymagaj, znajdz, czytaj } = vi.hoisted(() => ({wymagaj:vi.fn(),znajdz:vi.fn(),czytaj:vi.fn()}));
vi.mock('../lib/admin', () => ({wymagajRedakcji:wymagaj}));
vi.mock('../lib/db', () => ({db:{list:{findUnique:znajdz}}}));
vi.mock('node:fs/promises', async (importOriginal) => { const actual=await importOriginal(); return {...actual,default:{...actual,readFile:czytaj},readFile:czytaj}; });
import { GET } from '../app/api/admin/listy/[id]/zdjecie/route';
beforeEach(() => {vi.clearAllMocks(); wymagaj.mockResolvedValue({id:'admin'});});
it('archiwalny obraz jest dostępny administratorowi jako mała miniatura WebP', async () => {
  znajdz.mockResolvedValue({zdjecieUrl:'https://portal.fundacjalepszydomlepszejutro.pl/api/listy/abc/zdjecie'});
  czytaj.mockResolvedValue(await sharp({create:{width:200,height:300,channels:3,background:'#fff'}}).png().toBuffer());
  const odp=await GET(new Request('https://test.invalid/api/admin/listy/abc/zdjecie?miniatura=1'),{params:Promise.resolve({id:'abc'})});
  expect(odp.status).toBe(200); expect(odp.headers.get('Content-Type')).toBe('image/webp');
  expect(odp.headers.get('Cache-Control')).toContain('private, no-store');
  const meta=await sharp(Buffer.from(await odp.arrayBuffer())).metadata();
  expect(meta.width).toBeLessThanOrEqual(144); expect(meta.height).toBeLessThanOrEqual(192);
});
it('bez roli administratora nie odczytuje ani rekordu ani pliku', async () => {
  wymagaj.mockRejectedValue(new Error('BRAK_ROLI'));
  await expect(GET(new Request('https://test.invalid/api/admin/listy/abc/zdjecie'),{params:Promise.resolve({id:'abc'})})).rejects.toThrow('BRAK_ROLI');
  expect(znajdz).not.toHaveBeenCalled(); expect(czytaj).not.toHaveBeenCalled();
});
