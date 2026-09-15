import "server-only";
import { Queue } from "bullmq";
import Redis from "ioredis";

export const NAZWA_KOLEJKI_EMAIL = "portal-email-v1";

const globalna = globalThis;

function kolejka() {
  if (!process.env.REDIS_URL) return null;
  if (!globalna.kolejkaEmailPortalu) {
    const polaczenie = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      connectTimeout: 3000,
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
  await q.add(typ, dane, { jobId });
  return true;
}
