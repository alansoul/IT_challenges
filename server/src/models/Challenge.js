import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Web', 'Pwn', 'Crypto', 'Forensics', 'Rev', 'OSINT', 'Misc'],
      required: true,
    },
    difficultyRank: { type: Number, required: true }, // 1 (Highest) to 27 (Lowest)
    initialPoints: { type: Number, required: true },
    points: { type: Number, required: true },
    flagHash: { type: String, required: true, select: false }, // Never returned by queries
    salt: { type: String, required: true, select: false },     // Never returned by queries
    assets: [{ name: String, url: String }],                   // Cloudinary URLs
    hint: { type: String },
    solvesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Challenge = mongoose.model('Challenge', challengeSchema);