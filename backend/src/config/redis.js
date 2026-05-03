import Redis from "ioredis";
import { env } from "./env.js";

let redis;

export function getRedis() {
  if (!redis) {
    redis = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    redis.on("error", (error) => {
      console.warn("Redis unavailable:", error.message);
    });
  }

  return redis;
}

export async function cacheGet(key) {
  try {
    const value = await getRedis().get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Redis is optional for local development.
  }
}
