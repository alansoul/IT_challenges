import { Challenge } from '../models/Challenge.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { ScoreAudit } from '../models/ScoreAudit.js';
import { verifyFlag } from '../utils/flagHasher.js';
import { redis } from '../config/redis.js';

// Get all 27 challenges (flags and salts strictly omitted)
export const getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find()
      .sort({ difficultyRank: 1 }) // Rank 1 (Highest) to 27 (Lowest)
      .lean();

    const userSolves = (req.user.solvedChallenges || []).map((id) => id.toString());
    const data = challenges.map((ch) => ({
      ...ch,
      isSolved: userSolves.includes(ch._id.toString()),
    }));

    res.json(data);
  } catch (error) {
    console.error('[-] getChallenges error:', error.message);
    res.status(500).json({ message: 'Server error fetching challenges' });
  }
};

// Flag submission with Atomic Lock, Score Audit, and Anomaly Detection
export const submitFlag = async (req, res) => {
  const { id } = req.params;
  const { flag } = req.body;
  const userId = req.user._id;

  if (!flag) return res.status(400).json({ message: 'No flag provided' });

  try {
    const challenge = await Challenge.findById(id).select('+flagHash +salt');
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    // 1. FAST CHECK: Did user already solve it?
    if (req.user.solvedChallenges.includes(challenge._id)) {
      return res.status(400).json({ message: 'Challenge already solved by you!' });
    }

    // 2. Cryptographic timing-safe verification
    const isMatch = verifyFlag(flag, challenge.flagHash, challenge.salt);

    await Submission.create({
      userId,
      challengeId: challenge._id,
      isCorrect: isMatch,
      pointsAwarded: isMatch ? challenge.points : 0,
      submittedFlag: flag,
      ipAddress: req.ip,
    });

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect flag. Keep investigating!' });
    }

    const previousScore = req.user.score || 0;
    const newCalculatedScore = previousScore + challenge.points;

    // 3. ATOMIC LOCK: Only adds points if challenge._id is NOT in solvedChallenges.
    // If a player fires 10 simultaneous threads, only ONE query succeeds; 9 will fail.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        solvedChallenges: { $ne: challenge._id },
      },
      {
        $inc: { score: challenge.points },
        $push: { solvedChallenges: challenge._id },
        lastSolveTime: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'Solve collision: Flag already credited.' });
    }

    // 4. LAYER 6: IMMUTABLE SCORE AUDIT ENTRY
    await ScoreAudit.create({
      userId: updatedUser._id,
      challengeId: challenge._id,
      action: 'SOLVE',
      pointsBefore: previousScore,
      pointsAfter: newCalculatedScore,
      delta: challenge.points,
      reason: `Solved Rank #${challenge.difficultyRank}: ${challenge.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      performedBy: updatedUser._id,
    });

    // 5. LAYER 7: SPEED-ANOMALY RADAR
    // Check if detective solved 4+ challenges in under 60 seconds (scripting / flag dump detection)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const rapidSolvesCount = await Submission.countDocuments({
      userId,
      isCorrect: true,
      createdAt: { $gte: oneMinuteAgo },
    });

    if (rapidSolvesCount >= 4) {
      await User.findByIdAndUpdate(userId, { flaggedForReview: true });
      console.warn(
        `\n🚨 [ANOMALY DETECTED] Detective ${updatedUser.name} (${updatedUser.email}) solved ${rapidSolvesCount} challenges in under 60 seconds! Account marked for review.\n`
      );
    }

    // Award solve count to challenge statistics
    await Challenge.findByIdAndUpdate(challenge._id, { $inc: { solvesCount: 1 } });

    // Update Redis Leaderboard with millisecond tie-breaker (players only)
    if (redis && redis.status === 'ready' && updatedUser.role === 'player') {
      const tieBreaker = 1 - Date.now() / 1e13;
      const redisScore = updatedUser.score + tieBreaker;
      await redis.zadd('leaderboard', redisScore, userId.toString());
    }

    return res.json({
      success: true,
      message: 'Flag confirmed! Detective score credited.',
      newScore: updatedUser.score,
    });
  } catch (error) {
    console.error('[-] submitFlag error:', error.message);
    res.status(500).json({ message: error.message });
  }
};