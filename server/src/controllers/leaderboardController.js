import { redis } from '../config/redis.js';
import { User } from '../models/User.js';

export const getLeaderboard = async (req, res) => {
  try {
    let rankedUserIds = [];

    // 1. Fetch player IDs who solved challenges from Redis (ordered by score + tiebreaker)
    if (redis && redis.status === 'ready') {
      try {
        const rawRanks = await redis.zrevrange('leaderboard', 0, 49);
        if (rawRanks && rawRanks.length > 0) {
          rankedUserIds = rawRanks;
        }
      } catch (redisErr) {
        console.warn('[-] Redis query failed:', redisErr.message);
      }
    }

    // 2. Fetch all valid players from MongoDB
    const allPlayers = await User.find({
      role: 'player',
      isDisqualified: { $ne: true },
    })
      .select('name score branch createdAt')
      .lean();

    // Fast O(1) lookup map
    const playerMap = new Map(allPlayers.map((p) => [p._id.toString(), p]));

    const leaderboard = [];
    const seenIds = new Set();

    // 3. Add players with solves first (in exact Redis tiebreaker order)
    for (const id of rankedUserIds) {
      const player = playerMap.get(id);
      if (player) {
        leaderboard.push(player);
        seenIds.add(id);
      }
    }

    // 4. Append all remaining registered detectives (0 points), ordered by signup date
    const remainingPlayers = allPlayers
      .filter((p) => !seenIds.has(p._id.toString()))
      .sort((a, b) => (b.score || 0) - (a.score || 0) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    leaderboard.push(...remainingPlayers);

    // Return top 50 detectives
    return res.json(leaderboard.slice(0, 50));
  } catch (err) {
    console.error('[-] Error in getLeaderboard:', err);
    return res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};