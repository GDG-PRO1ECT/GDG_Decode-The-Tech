import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
  quizCode: { type: String, required: true, unique: true, index: true },
  quizName: { type: String, required: true },
  description: { type: String, default: '' },
  organizerPassword: { type: String, required: true },
  status: { type: String, enum: ['draft', 'ready', 'active', 'finished'], default: 'draft' },
  currentRound: { type: Number, default: 0 },
  roundStartTime: { type: Date },
  roundEndTime: { type: Date },
  isPaused: { type: Boolean, default: false },
  pausedAt: { type: Date },
  timeRemainingAtPause: { type: Number },
  roundDurations: { type: Map, of: Number, default: {} }, // e.g. { round1: 900, round2: 900 }
  settings: {
    playersPerTeam: { type: Number, default: 3 },
    allowLateJoin: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: true },
    maxTeams: { type: Number, default: 100 },
    registrationOpen: { type: Boolean, default: true },
    quizLanguage: { type: String, default: 'en' },
    showLeaderboardDuringGame: { type: Boolean, default: true },
    allowReAttempt: { type: Boolean, default: false },
    fastestFingerBonus: { type: Number, default: 5 },
    timeBonusEnabled: { type: Boolean, default: true },
    rounds: [{
      roundNumber: { type: Number, required: true },
      roundName: { type: String, required: true },
      questionType: { type: String, enum: ['mcq', 'match', 'emoji', 'truefalse', 'mix'], default: 'mcq' },
      questionCount: { type: Number, default: 10 },
      timeLimitSeconds: { type: Number, default: 900 },
      basePoints: { type: Number, default: 10 }
    }]
  },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // Auto-expire after 7 days
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
