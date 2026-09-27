import { redis } from '../config/redis.js';
import { User } from '../models/User.js';

export const getLeaderboard = async (req, res) => {
  try {
    // 1. If Redis is online and ready, try fetching from the Redis Sorted Set
    if (redis && redis.status === 'ready') {
      try {
        const rawRanks = await redis.zrevrange('leaderboard', 0, 49, 'WITHSCORES');
        if (rawRanks && rawRanks.length > 0) {
          const leaderboard = [];
          for (let i = 0; i < rawRanks.length; i += 2) {
            const uId = rawRanks[i];
            const user = await User.findById(uId).select('name picture score email').lean();
            if (user) leaderboard.push(user);
          }
          return res.json(leaderboard);
        }
      } catch (redisErr) {
        console.warn('[-] Redis query failed, falling back to MongoDB:', redisErr.message);
      }
    }

    // 2. Direct MongoDB fallback (Always works!)
    const dbUsers = await User.find({ role: 'player' })
      .sort({ score: -1, lastSolveTime: 1 })
      .limit(50)
      .select('name picture score email')
      .lean();

    return res.json(dbUsers || []);
  } catch (err) {
    console.error('[-] Error in getLeaderboard:', err);
    return res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};