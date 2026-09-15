import "server-only";
import Redis from "ioredis";

const globalCache = globalThis;

function klient() {
  if (!process.env.REDIS_URL) return null;
  if (!globalCache.redisPortalu) {
    globalCache.redisPortalu = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      connectTimeout: 1200,
      retryStrategy: () => null,
    });
    globalCache.redisPortalu.on("error", () => {});
  }
  return globalCache.redisPortalu;
}

async function gotowy() {
  const redis = klient();
  if (!redis) return null;
  try {
    if (redis.status === "wait") await redis.connect();
    return redis.status === "ready" ? redis : null;
  } catch {
    return null;
  }
}

export async function pobierzCacheJson(klucz) {
  const redis = await gotowy();
  if (!redis) return null;
  try {
    const wartosc = await redis.get(klucz);
    return wartosc ? JSON.parse(wartosc) : null;
  } catch {
    return null;
  }
}

export async function zapiszCacheJson(klucz, wartosc, sekundy = 20) {
  const redis = await gotowy();
  if (!redis) return;
  try { await redis.set(klucz, JSON.stringify(wartosc), "EX", sekundy); } catch {}
}

export async function usunCache(klucz) {
  const redis = await gotowy();
  if (!redis) return;
  try { await redis.del(klucz); } catch {}
}

export const KLUCZ_LICZNIKA = "portal:licznik:v2";
