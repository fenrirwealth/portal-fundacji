import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const bytes = await readFile(path.join(process.env.SKANY_PRIVATE_DIR || '/data/skany', 'dekoracje', 'mikolaj-elfy-v1.webp'));
    return new Response(bytes, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response(null, { status: 404 }); }
}
