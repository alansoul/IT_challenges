import { redis } from '../config/redis.js';
import { User } from '../models/User.js';

export const getLeaderboard = async (req, res) => {
  try {
    // 1. Redis sorted set path
    if (redis && redis.status === 'ready') {
      try {
        const rawRanks = await redis.zrevrange('leaderboard', 0, 49, 'WITHSCORES');

        if (rawRanks && rawRanks.length > 0) {
          const userIds = [];
          for (let i = 0; i < rawRanks.length; i += 2) {
            userIds.push(rawRanks[i]);
          }

          // Fetch only players, exclude disqualified users, scrub emails for privacy
          const users = await User.find({
            _id: { $in: userIds },
            role: 'player',
            isDisqualified: { $ne: true },
          })
            .select('name score branch')
            .lean();

          const userMap = new Map(users.map((u) => [u._id.toString(), u]));
          const leaderboard = userIds.map((id) => userMap.get(id)).filter(Boolean);

          // If Redis has ranked players, return them
          if (leaderboard.length > 0) {
            return res.json(leaderboard);
          }
        }
      } catch (redisErr) {
        console.warn('[-] Redis query failed, falling back to MongoDB:', redisErr.message);
      }
    }

    // 2. MongoDB Path: Returns ALL registered players (including 0-point users)
    const allPlayers = await User.find({
      role: 'player',
      isDisqualified: { $ne: true },
    })
      .sort({ score: -1, createdAt: 1 }) // Sorted by score descending, then by signup order
      .limit(50)
      .select('name score branch')
      .lean();

    return res.json(allPlayers || []);
  } catch (err) {
    console.error('[-] Error in getLeaderboard:', err);
    return res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};