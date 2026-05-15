import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  playerNumber: { type: Number, required: true }, // 1, 2, or 3
});

const TeamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  teamName: { type: String, required: true, unique: true },
  teamNumber: { type: Number, required: true },
  players: [PlayerSchema],
  currentRound: { type: Number, default: 0 }, // 0 = not started, 1/2/3 = round
  currentPlayerIndex: { type: Number, default: 0 }, // rotates each round: 0->1->2
  scores: {
    round1: { type: Number, default: 0 },
    round2: { type: Number, default: 0 },
    round3: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
  },
  questionOrder: {
    round1: [Number], // shuffled indices
    round2: [Number],
    round3: [Number],
  },
  answeredQuestions: {
    round1: [{ questionId: String, answeredAt: Date, correct: Boolean, points: Number }],
    round2: [{ questionId: String, answeredAt: Date, correct: Boolean, points: Number }],
    round3: [{ questionId: String, answeredAt: Date, correct: Boolean, points: Number }],
  },
  joinedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isDisqualified: { type: Boolean, default: false },
  disqualifiedAt: { type: Date, default: null },
  disqualifiedReason: { type: String, default: null },
  isEliminated: { type: Boolean, default: false },
  eliminatedAtRound: { type: Number, default: null },
}, { timestamps: true });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
