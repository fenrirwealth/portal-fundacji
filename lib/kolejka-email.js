import "server-only";
import { Queue } from "bullmq";
import Redis from "ioredis";

export const NAZWA_KOLEJKI_EMAIL = "portal-email-v1";

const globalna = globalThis;

function kolejka() {
  if (!process.env.REDIS_URL) return null;
  if (!globalna.kolejkaEmailPortalu) {
    const polaczenie = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      connectTimeout: 3000,
      commandTimeout: 5000,
    });
    polaczenie.on("error", (blad) => console.error("[email-queue] Redis:", blad.message));
    globalna.kolejkaEmailPortalu = new Queue(NAZWA_KOLEJKI_EMAIL, {
      connection: polaczenie,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 500,
        removeOnFail: 2000,
      },
    });
  }
  return globalna.kolejkaEmailPortalu;
}

export async function kolejkujEmail(typ, dane, jobId) {
  const q = kolejka();
  if (!q) {
    console.warn(`[email-queue] Pominięto ${typ}: brak REDIS_URL.`);
    return false;
  }
  const powiadomFundacje = ["REZERWACJA", "PRZYPOMNIENIE", "PRZYPOMNIENIE_DOSTARCZENIA", "KONTAKT_POTWIERDZONY"].includes(typ);
  if (powiadomFundacje) {
    // Oddzielne zadania: awaria jednego odbiorcy nie powtarza maila drugiemu.
    await q.addBulk([
      { name: typ, data: dane, opts: { jobId } },
      { name: "FUNDACJA_" + typ, data: dane, opts: { jobId: "fundacja-" + jobId } },
    ]);
  } else {
    await q.add(typ, dane, { jobId });
  }
  return true;
}

// Stałe identyfikatory zadań pozwalają bezpiecznie wznowić zapis po awarii.
export async function kolejkujPowiadomienieRezerwacji(db, typ, id) {
  const rezerwacja = typ === "REZERWACJA";
  const pole = rezerwacja ? "emailRezerwacjiZakolejkowany" : "emailPotwierdzeniaZakolejkowany";
  const identyfikator = rezerwacja ? "rezerwacja-" + id : "kontakt-" + id;
  if (!(await kolejkujEmail(typ, { rezerwacjaId: id }, identyfikator))) {
    throw new Error("KOLEJKA_NIEDOSTEPNA");
  }
  await db.rezerwacja.updateMany({
    where: { id, [pole]: null },
    data: { [pole]: new Date() },
  });
}
