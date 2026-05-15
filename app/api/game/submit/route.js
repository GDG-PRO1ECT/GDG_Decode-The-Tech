export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import Question from '@/lib/models/Question';
import GameSession from '@/lib/models/GameSession';

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  const { teamId, questionId, answer, round } = body;

  if (!teamId || !questionId || !answer || !round) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const [team, question, session] = await Promise.all([
    Team.findOne({ teamId }),
    Question.findById(questionId),
    GameSession.findOne({ sessionId: 'main' }),
  ]);

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

  // Eligibility check (only disqualified/banned teams are blocked)
  if (team.isDisqualified) {
    return NextResponse.json({ error: 'Team is disqualified and cannot play' }, { status: 403 });
  }

  // Check if game round is active
  if (!session || session.status !== `round${round}_active`) {
    return NextResponse.json({ error: 'Round not active' }, { status: 400 });
  }

  const now = new Date();
  // Auto-halt check if time is up
  if (!session.isPaused && session.roundEndTime && now >= new Date(session.roundEndTime)) {
    session.status = `round${round}_ended`;
    await session.save();
    return NextResponse.json({ error: 'Time has expired for this round' }, { status: 400 });
  }

  // Check if already answered
  const roundKey = `round${round}`;
  const alreadyAnswered = (team.answeredQuestions?.[roundKey] || []).find(
    a => a.questionId === String(questionId)
  );
  if (alreadyAnswered) {
    return NextResponse.json({ error: 'Already answered', result: alreadyAnswered }, { status: 400 });
  }

  // Check correctness
  let isCorrect = false;
  const isMatch = question.type === 'match';

  if (isMatch) {
    // answer is expected to be an array of {left, right} objects
    if (Array.isArray(answer) && answer.length === question.matchPairs.length) {
      // Create a map for quick lookup
      const correctMap = new Map();
      question.matchPairs.forEach(p => correctMap.set(p.left, p.right));
      
      isCorrect = answer.every(pair => correctMap.get(pair.left) === pair.right);
    }
  } else {
    isCorrect = answer === question.correctAnswer;
  }
  
  const timeTaken = Math.max(0, (now - session.roundStartTime) / 1000);

  // Calculate points
  let points = 0;
  if (isCorrect && !team.isDisqualified) {
    points = 1; // Standard 1 point per correct answer
  } else if (isCorrect && team.isDisqualified) {
    // Correct but disqualified - no points
    points = 0;
  }

  // Save the answer
  if (!team.answeredQuestions) team.answeredQuestions = {};
  if (!team.answeredQuestions[roundKey]) team.answeredQuestions[roundKey] = [];
  
  team.answeredQuestions[roundKey].push({
    questionId: String(questionId),
    answeredAt: now,
    correct: isCorrect,
    points,
  });

  // Update scores
  team.scores[roundKey] = (team.scores[roundKey] || 0) + points;
  team.scores.total = (team.scores.round1 || 0) + (team.scores.round2 || 0) + (team.scores.round3 || 0);
  
  await team.save();

  return NextResponse.json({
    correct: isCorrect,
    points,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    totalScore: team.scores.total,
  });
}
