import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  quizCode: { type: String, required: true, index: true },
  round: { type: Number, required: true },
  questionNumber: { type: Number, required: true },
  
  type: { type: String, enum: ['mcq', 'match', 'emoji', 'truefalse'], default: 'mcq' },
  
  // For 'match' type questions
  matchPairs: [{
    left: { type: String, required: true },
    right: { type: String, required: true }
  }],

  // Question text
  question: { type: String, required: true },
  
  // Emoji clue for emoji round
  emojiClue: { type: String, default: '' },
  
  options: [{ type: String }], 
  correctAnswer: { type: String }, 
  
  // For truefalse / fact rounds: Real/Fake or True/False
  actualFact: { type: String, enum: ['Real', 'Fake', 'True', 'False'], default: 'True' },
  hasReverseLogic: { type: Boolean, default: false }, // Round 3 twist: reverse answer correctness
  
  explanation: { type: String, default: '' },
  basePoints: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

QuestionSchema.index({ quizCode: 1, round: 1, isActive: 1 });
QuestionSchema.index({ quizCode: 1, questionNumber: 1 });

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
