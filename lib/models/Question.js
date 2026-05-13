import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  round: { type: Number, required: true, enum: [1, 2, 3] },
  questionNumber: { type: Number, required: true },
  
  type: { type: String, enum: ['mcq', 'match'], default: 'mcq' },
  
  // For 'match' type questions
  matchPairs: [{
    left: { type: String, required: true },
    right: { type: String, required: true }
  }],

  // Round 1: Tech Jargon - Q is the meaning, options are jargons
  // Round 2: Emoji Clue - Q is emoji string, options are app names  
  // Round 3: Tech Facts - Q is the fact, options are ["Real", "Fake"]
  question: { type: String, required: true },
  
  // For emoji round: store the emoji display separately
  emojiClue: { type: String, default: '' },
  
  options: [{ type: String }], // Optional for match type
  correctAnswer: { type: String }, // Optional for match type
  
  // Round 3 special: players must choose the OPPOSITE of correct
  // So if fact is Real, they should answer "Fake" to be correct in the game
  actualFact: { type: String, enum: ['Real', 'Fake'], default: 'Real' },
  
  explanation: { type: String, default: '' },
  
  basePoints: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

QuestionSchema.index({ round: 1, isActive: 1 });
QuestionSchema.index({ questionNumber: 1 });

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
