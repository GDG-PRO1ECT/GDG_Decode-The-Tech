import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  quizCode: { type: String, required: true, index: true },
  teamId: { type: String, required: true },
  teamName: { type: String, required: true },
  teamNumber: { type: Number, required: true },
  players: [{
    name: { type: String, required: true },
    playerNumber: { type: Number, required: true }
  }],
  currentRound: { type: Number, default: 0 },
  currentPlayerIndex: { type: Number, default: 0 },
  scores: {
    round1: { type: Number, default: 0 },
    round2: { type: Number, default: 0 },
    round3: { type: Number, default: 0 },
    round4: { type: Number, default: 0 },
    round5: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  answeredQuestions: {
    round1: { type: Array, default: [] },
    round2: { type: Array, default: [] },
    round3: { type: Array, default: [] },
    round4: { type: Array, default: [] },
    round5: { type: Array, default: [] },
  },
  questionOrder: {
    round1: { type: [Number], default: [] },
    round2: { type: [Number], default: [] },
    round3: { type: [Number], default: [] },
    round4: { type: [Number], default: [] },
    round5: { type: [Number], default: [] },
  },
  isDisqualified: { type: Boolean, default: false },
  disqualifiedAt: { type: Date },
  disqualifiedReason: { type: String },
  isActive: { type: Boolean, default: true },
  isEliminated: { type: Boolean, default: false },
  eliminatedAtRound: { type: Number },
}, { timestamps: true });

TeamSchema.index({ quizCode: 1, teamId: 1 }, { unique: true });
TeamSchema.index({ quizCode: 1, teamName: 1 });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
