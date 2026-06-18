import { Redis } from '@upstash/redis';

// Lazy singleton — only instantiated when UPSTASH env vars are present
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.includes('XXXX') || token.includes('XXXX')) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

// Cache TTL constants (in seconds)
export const TTL = {
  STOREFRONT: 60 * 5,    // 5 minutes — business profile, services, staff
  ANALYTICS:  60 * 2,    // 2 minutes — analytics counts
  BOOKINGS:   60,        // 1 minute  — bookings list (shorter — changes often)
};

/**
 * Get a value from cache. Returns null if Redis is not configured or key missing.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    return await redis.get<T>(key);
  } catch (err) {
    console.warn('[Redis] cacheGet error:', err);
    return null;
  }
}

/**
 * Set a value in cache with TTL. Silently skips if Redis not configured.
 */
export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(key, value, { ex: ttl });
  } catch (err) {
    console.warn('[Redis] cacheSet error:', err);
  }
}

/**
 * Delete one or more cache keys. Used for cache invalidation on writes.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    if (keys.length === 1) {
      await redis.del(keys[0]);
    } else {
      await Promise.all(keys.map(k => redis.del(k)));
    }
  } catch (err) {
    console.warn('[Redis] cacheDel error:', err);
  }
}

// ─── Cache Key Helpers ────────────────────────────────────────────
export const cacheKeys = {
  businessBySlug: (slug: string) => `biz:slug:${slug}`,
  businessById:   (id: string)   => `biz:id:${id}`,
  services:       (bizId: string) => `services:${bizId}`,
  staff:          (bizId: string) => `staff:${bizId}`,
  bookings:       (bizId: string) => `bookings:${bizId}`,
  analytics:      (bizId: string) => `analytics:${bizId}`,
  blockedDates:   (bizId: string) => `blocked:${bizId}`,
};
