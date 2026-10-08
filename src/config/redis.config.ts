import { Redis, type CommonRedisOptions, type RedisOptions } from 'ioredis';

let redisClient: Redis | null = null;

function getRedisConfig() {
  return {
    host: process.env['REDIS_HOST'] ?? '127.0.0.1',
    port: Number(process.env['REDIS_PORT'] ?? 6379),
    ...(process.env['REDIS_PASSWORD'] ? { password: process.env['REDIS_PASSWORD'] } : {}),
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  };
}
export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env['REDIS_URL'];

    if (redisUrl) {
      redisClient = new Redis(redisUrl);
    } else {
      redisClient = new Redis(getRedisConfig());
    }

    redisClient.on('connect', () => {
      console.log('Connected to Redis successfully');
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Disconnected from Redis');
  }
}
