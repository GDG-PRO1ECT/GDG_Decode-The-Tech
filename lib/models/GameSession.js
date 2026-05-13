import mongoose from 'mongoose';

const GameSessionSchema = new mongoose.Schema({
  sessionId: { type: String, default: 'main', unique: true },
  status: { 
    type: String, 
    enum: ['waiting', 'round1_active', 'round1_ended', 'round2_active', 'round2_ended', 'round3_active', 'round3_ended', 'finished'],
    default: 'waiting'
  },
  currentRound: { type: Number, default: 0 },
  roundStartTime: { type: Date },
  roundEndTime: { type: Date },
  isPaused: { type: Boolean, default: false },
  pausedAt: { type: Date },
  timeRemainingAtPause: { type: Number },
  roundDurations: {
    round1: { type: Number, default: 900 }, // seconds (15 min)
    round2: { type: Number, default: 1200 }, // 20 min
    round3: { type: Number, default: 900 }, // 15 min
  },
  fastestAnswers: {
    round1: [{ teamId: String, teamName: String, questionId: String, answeredAt: Date, timeTaken: Number }],
    round2: [{ teamId: String, teamName: String, questionId: String, answeredAt: Date, timeTaken: Number }],
    round3: [{ teamId: String, teamName: String, questionId: String, answeredAt: Date, timeTaken: Number }],
  },
  settings: {
    fastestFingerBonus: { type: Number, default: 5 },
    timeBonusEnabled: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: true },
  }
}, { timestamps: true });

if (mongoose.models.GameSession) {
  delete mongoose.models.GameSession;
}
export default mongoose.model('GameSession', GameSessionSchema);
