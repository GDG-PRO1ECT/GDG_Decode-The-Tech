export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/lib/models/Question';
import GameSession from '@/lib/models/GameSession';

export async function GET() {
  try {
    await dbConnect();
    const session = await GameSession.findOne({ sessionId: 'main' }).lean();

    if (!session || (session.status !== 'finished' && session.status !== 'round3_ended')) {
      return NextResponse.json({ questions: [] });
    }

    const questions = await Question.find({ isActive: true })
      .sort({ round: 1, questionNumber: 1 })
      .lean();

    // Strip out some data if needed, but since game is finished, we can return answers
    const safeQuestions = questions.map(q => ({
      _id: q._id,
      round: q.round,
      questionNumber: q.questionNumber,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      emojiClue: q.emojiClue || '',
      matchData: q.matchPairs ? {
        left: q.matchPairs.map(p => p.left),
        right: q.matchPairs.map(p => p.right),
      } : null,
      type: q.type || 'mcq'
    }));

    return NextResponse.json({ questions: safeQuestions });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
