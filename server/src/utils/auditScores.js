import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Challenge } from '../models/Challenge.js';
import { redis } from '../config/redis.js';

dotenv.config();

async function verifyAndAuditScores() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[+] Connected to MongoDB. Running Anti-Cheat Audit...\n');

  const users = await User.find({ role: 'player' }).populate('solvedChallenges');
  let fraudDetected = false;

  for (const user of users) {
    // Calculate what their score SHOULD be based on solved challenge IDs
    const legitimateScore = user.solvedChallenges.reduce((sum, ch) => sum + ch.points, 0);

    if (user.score !== legitimateScore) {
      fraudDetected = true;
      console.warn(`🚨 CHEATING DETECTED on user: ${user.name} (${user.email})`);
      console.warn(`   Stored Score: ${user.score} pts | Legitimate Score: ${legitimateScore} pts`);
      
      // Auto-fix: Correct their score to the legitimate value
      user.score = legitimateScore;
      await user.save();
      console.log(`   [✓] Score corrected to ${legitimateScore} pts.\n`);

      // Update Redis
      if (redis && redis.status === 'ready') {
        const tieBreaker = 1 - Date.now() / 1e13;
        await redis.zadd('leaderboard', legitimateScore + tieBreaker, user._id.toString());
      }
    }
  }

  if (!fraudDetected) {
    console.log('✅ ALL SCORES 100% LEGITIMATE. No score tampering found.');
  }

  process.exit(0);
}

verifyAndAuditScores().catch(console.error);