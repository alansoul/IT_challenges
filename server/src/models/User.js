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

    // Layer 7: Anomaly Detection flag for admin investigation
    flaggedForReview: { type: Boolean, default: false },

    // Security: Invalidate old sessions if password resets
    passwordChangedAt: { type: Date, select: false },
    lastSolveTime: { type: Date },

    // Security: Invalidate old sessions if password resets
    passwordChangedAt: { type: Date, select: false },

    // The Ban Hammer: increment this number to kick the user out instantly
    tokenVersion: { type: Number, default: 0, select: false },

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