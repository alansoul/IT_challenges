import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    picture: { type: String },
    score: { type: Number, default: 0 },
    solvedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
    role: { type: String, enum: ['player', 'admin'], default: 'player' },
    isDisqualified: { type: Boolean, default: false },
    lastSolveTime: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);