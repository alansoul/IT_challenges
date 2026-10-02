import mongoose from 'mongoose';

const scoreAuditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
    },
    action: {
      type: String,
      enum: ['SOLVE', 'ADMIN_ADJUST', 'PENALTY', 'DISQUALIFY'],
      required: true,
    },
    pointsBefore: { type: Number, required: true },
    pointsAfter: { type: Number, required: true },
    delta: { type: Number, required: true },
    reason: { type: String, default: 'Correct flag submission' },
    ipAddress: { type: String },
    userAgent: { type: String },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const ScoreAudit = mongoose.model('ScoreAudit', scoreAuditSchema);