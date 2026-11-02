import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { listPubliczny } from '../../../../../lib/db';
export const dynamic = 'force-dynamic';
export async function GET(_request, { params }) {
  const { id } = await params;
  if (!/^[a-z0-9-]{1,80}$/i.test(id)) return new Response(null, { status: 404 });
  const list = await listPubliczny(id);
  if (!list || list.zdjecieUrl !== `https://portal.fundacjalepszydomlepszejutro.pl/api/listy/${id}/zdjecie`) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(process.env.SKANY_PRIVATE_DIR || '/data/skany', 'public-listy', id + '.png'));
    return new Response(bytes, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response(null, { status: 404 }); }
}
