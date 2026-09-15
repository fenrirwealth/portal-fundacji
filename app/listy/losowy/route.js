import { redirect } from "next/navigation";
import { listyPubliczne } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const listy = await listyPubliczne({ tylkoWolne: true });
  if (!listy.length) redirect("/listy");
  const list = listy[Math.floor(Math.random() * listy.length)];
  redirect(`/listy/${list.id}?wybral=1`);
}
