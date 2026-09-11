import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Punkt kontrolny dla Dockera. Sprawdza nie tylko czy proces zyje,
// ale czy naprawde widzi baze — inaczej kontener raportowalby zdrowie
// z niedzialajaca aplikacja.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ stan: "ok", baza: "ok" });
  } catch {
    return Response.json({ stan: "blad", baza: "nieosiagalna" }, { status: 503 });
  }
}
