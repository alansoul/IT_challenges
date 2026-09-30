import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

let redisClient = null;
const redisUrl = process.env.REDIS_URL;

if (redisUrl && !redisUrl.includes('your_redis_password') && !redisUrl.includes('localhost:6379')) {
  try {
    const isSsl = redisUrl.startsWith('rediss://');

    redisClient = new Redis(redisUrl, {
      tls: isSsl ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 2) {
          console.warn('[-] Redis connection failed. Running in MongoDB fallback mode.');
          return null; // Stop retrying
        }
        return 1000;
      },
    });

    redisClient.on('ready', () => {
      console.log('[+] Remote Cloud Redis Ready & Authenticated');
    });

    redisClient.on('error', (err) => {
      console.warn(`[-] Redis Notice: ${err.message}`);
    });
  } catch (err) {
    console.warn('[-] Failed to initialize Redis client:', err.message);
  }
} else {
  console.log('[i] REDIS_URL not configured yet. Using MongoDB Atlas as primary store.');
}

export const redis = redisClient;