import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_DATABASE_URL!, {
  connectTimeout: 5_000,
  commandTimeout: 5_000,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

redis.on('error', (error: NodeJS.ErrnoException) => {
  console.error('[Redis] Connection failed:', error.code ?? error.name);
});

export default redis;
