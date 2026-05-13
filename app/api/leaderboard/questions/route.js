export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/lib/models/Question';
import { getGameSession } from '@/lib/sessionCache';

export async function GET() {
  try {
    await dbConnect();
    const session = await getGameSession();

    if (!session) {
      return NextResponse.json({ questions: [] });
    }

    let maxCompletedRound = 0;
    if (session.status === 'finished' || session.status === 'round3_ended') maxCompletedRound = 3;
    else if (session.status === 'round2_ended' || session.currentRound === 3) maxCompletedRound = 2;
    else if (session.status === 'round1_ended' || session.currentRound === 2) maxCompletedRound = 1;

    if (maxCompletedRound === 0) {
      return NextResponse.json({ questions: [] });
    }

    const questions = await Question.find({ isActive: true, round: { $lte: maxCompletedRound } })
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
