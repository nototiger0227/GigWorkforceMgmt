import { createClient, type RedisClientType } from 'redis';
import { env } from '../config/env.js';

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({ url: env.redisUrl });
    client.on('error', (err) => console.error('Redis error:', err.message));
    await client.connect();
  }
  return client;
}

const CACHE_PREFIX = 'gig:analytics:';

export async function cacheGet(key: string): Promise<string | null> {
  const redis = await getRedis();
  return redis.get(CACHE_PREFIX + key);
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redis = await getRedis();
  await redis.setEx(CACHE_PREFIX + key, ttlSeconds, value);
}

export async function cacheInvalidateAll(): Promise<void> {
  const redis = await getRedis();
  const keys = await redis.keys(CACHE_PREFIX + '*');
  if (keys.length > 0) await redis.del(keys);
}

export { CACHE_PREFIX };
