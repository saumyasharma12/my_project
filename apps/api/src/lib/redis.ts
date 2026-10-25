import { Redis } from "ioredis";
import { config } from "../config/index.js";
import { logger } from "./logger.js";

// In-memory fallback cache when Redis is unavailable
const memoryCache = new Map<string, { value: string; expiresAt: number }>();
const memoryRateLimits = new Map<string, { count: number; resetAt: number }>();

let redisClient: Redis | null = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  redisClient.on("connect", () => {
    isRedisConnected = true;
    logger.info("Connected to Redis server", { url: config.redisUrl });
  });

  redisClient.on("error", (err) => {
    isRedisConnected = false;
    logger.warn("Redis client error - falling back to memory cache", {
      error: err.message,
    });
  });

  // Attempt async connect
  void redisClient.connect().catch((err) => {
    logger.warn("Initial Redis connection failed, continuing with memory fallback", {
      error: err.message,
    });
  });
} catch (err) {
  logger.warn("Failed to initialize Redis client, using in-memory store", {
    error: err instanceof Error ? err.message : String(err),
  });
}

export { redisClient };

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (redisClient && isRedisConnected) {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    }
  } catch (err) {
    logger.warn("Redis getCache failed, checking memory fallback", { key });
  }

  // Memory fallback
  const item = memoryCache.get(key);
  if (item) {
    if (item.expiresAt > Date.now()) {
      return JSON.parse(item.value) as T;
    }
    memoryCache.delete(key);
  }
  return null;
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds = 300,
): Promise<void> {
  const serialized = JSON.stringify(value);
  try {
    if (redisClient && isRedisConnected) {
      await redisClient.setex(key, ttlSeconds, serialized);
      return;
    }
  } catch (err) {
    logger.warn("Redis setCache failed, saving to memory fallback", { key });
  }

  // Memory fallback
  memoryCache.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function deleteCache(key: string): Promise<void> {
  try {
    if (redisClient && isRedisConnected) {
      await redisClient.del(key);
    }
  } catch (err) {
    logger.warn("Redis deleteCache failed", { key });
  }
  memoryCache.delete(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    if (redisClient && isRedisConnected) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`Invalidated ${keys.length} cache keys matching "${pattern}"`);
      }
    }
  } catch (err) {
    logger.warn("Redis invalidateCachePattern failed", { pattern });
  }

  // Clear matching memory keys
  const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

export async function checkRateLimit(
  ip: string,
  endpoint: string,
  limit = 60,
  windowSeconds = 60,
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${endpoint}:${ip}`;
  try {
    if (redisClient && isRedisConnected) {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
      };
    }
  } catch (err) {
    // fallback to memory
  }

  // Memory fallback
  const now = Date.now();
  const entry = memoryRateLimits.get(key);
  if (!entry || entry.resetAt < now) {
    memoryRateLimits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
  };
}
