import { redis } from '../config/redis.js';

export const submitRateLimiter = async (req, res, next) => {
  // If Redis is offline, continue without breaking the competition
  if (!redis || redis.status !== 'ready') {
    return next();
  }

  const userId = req.user._id.toString();
  const challengeId = req.params.id;
  const spamKey = `spam:${userId}:${challengeId}`;
  const freezeKey = `freeze:${userId}:${challengeId}`;

  try {
    // 1. Check if user is currently frozen on this challenge
    const isFrozen = await redis.get(freezeKey);
    if (isFrozen) {
      const ttl = await redis.ttl(freezeKey);
      return res.status(429).json({
        message: `Too many failed attempts! Detective locked out for ${ttl} more seconds.`,
      });
    }

    // 2. Increment 60-second sliding attempt counter
    const attempts = await redis.incr(spamKey);
    if (attempts === 1) {
      await redis.expire(spamKey, 60);
    }

    // Max 5 attempts per minute
    if (attempts > 5) {
      // Trigger 5-minute lockout (300 seconds) if spamming persists
      await redis.set(freezeKey, 'locked', 'EX', 300);
      return res.status(429).json({
        message: 'Brute-force detected! You are locked out of this challenge for 5 minutes.',
      });
    }

    next();
  } catch (err) {
    next();
  }
};