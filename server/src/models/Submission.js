import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    isCorrect: { type: Boolean, required: true },
    pointsAwarded: { type: Number, default: 0 },
    submittedFlag: { type: String, select: false }, // Recorded for forensics, hidden by default
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const Submission = mongoose.model('Submission', submissionSchema);