export async function GET() {
  const response = await fetch('https://fundacjalepszydomlepszejutro.pl/assets/kampanie/plakat-swieta-2026.png', { next: { revalidate: 3600 } });
  if (!response.ok) return new Response('Plakat jest chwilowo niedostępny.', { status: 502 });
  return new Response(response.body, { headers: { 'Content-Type': 'image/png', 'Content-Disposition': 'attachment; filename="plakat-swiateczna-zbiorka-2026.png"', 'X-Content-Type-Options': 'nosniff' } });
}
