import { redis } from '../config/redis.js';

export const loginRateLimiter = async (req, res, next) => {
  // Skip if Redis is offline
  if (!redis || redis.status !== 'ready') return next();

  // CRITICAL FIX: Rate limit by EMAIL instead of IP.
  // In a college, 1200 students share the same public NAT IP. Rate limiting by IP 
  // will lock the whole college out instantly. We use the email as the unique identifier.
  const identifier = req.body.email 
    ? `email:${req.body.email.trim().toLowerCase()}` 
    : `ip:${req.ip}`;

  const key = `login-attempts:${identifier}`;
  
  try {
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.expire(key, 15 * 60); // 15-minute window
    }

    // Allow 15 bad attempts per *specific email account* (protects against brute force)
    // If no email is provided (fallback), allow 5000 attempts for the whole IP (protects against basic DDoS)
    const maxAttempts = req.body.email ? 15 : 5000;

    if (attempts > maxAttempts) {
      return res.status(429).json({
        message: 'Too many attempts for this account. Please try again in 15 minutes.',
      });
    }
    next();
  } catch (err) {
    console.warn(`[-] Redis Rate Limiter Error: ${err.message}`);
    next(); // Fail open if Redis breaks so the CTF doesn't go down
  }
};