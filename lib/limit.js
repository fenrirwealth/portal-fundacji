import "server-only";
import Redis from "ioredis";

const globalna = globalThis;

function redis() {
  if (!process.env.REDIS_URL) return null;
  if (!globalna.redisLimitowPortalu) {
    globalna.redisLimitowPortalu = new Redis(process.env.REDIS_URL, {
      lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 1200, retryStrategy: () => null,
    });
    globalna.redisLimitowPortalu.on("error", () => {});
  }
  return globalna.redisLimitowPortalu;
}

export async function limitOperacji(klucz, maksimum, sekundy) {
  const klient = redis();
  if (!klient) return true;
  try {
    if (klient.status === "wait") await klient.connect();
    const liczba = await klient.incr(`limit:${klucz}`);
    if (liczba === 1) await klient.expire(`limit:${klucz}`, sekundy);
    return liczba <= maksimum;
  } catch {
    return true;
  }
}
