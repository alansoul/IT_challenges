import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, select: false },
    branch: { type: String, required: true },
    batchYear: { type: String, required: true },
    score: { type: Number, default: 0 },
    solvedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
    role: { type: String, enum: ['player', 'admin'], default: 'player' },
    isDisqualified: { type: Boolean, default: false },
    lastSolveTime: { type: Date },

    // Email verification (OTP)
    isVerified: { type: Boolean, default: false },
    otpHash: { type: String, select: false },
    otpExpires: { type: Date, select: false },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);