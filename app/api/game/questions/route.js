export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import Question from '@/lib/models/Question';
import GameSession from '@/lib/models/GameSession';
import { getGameSession } from '@/lib/sessionCache';

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const round = parseInt(searchParams.get('round'));

  if (!teamId || !round) {
    return NextResponse.json({ error: 'teamId and round required' }, { status: 400 });
  }

  const team = await Team.findOne(
    { teamId }, 
    { 
      teamName: 1, 
      currentPlayerIndex: 1, 
      players: 1, 
      scores: 1, 
      isEliminated: 1, 
      questionOrder: 1, 
      answeredQuestions: 1, 
      isDisqualified: 1 
    }
  ).lean();
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

  const session = await getGameSession();
  
  // Get all questions for this round
  const allQuestions = await Question.find({ round, isActive: true }).sort({ questionNumber: 1 }).lean();
  
  // Get the team's shuffled order for this round
  const roundKey = `round${round}`;
  let order = (team.questionOrder && team.questionOrder[roundKey]) || [];
  
  // Helper to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Ensure all current valid indices are included in the order
  const allIndices = allQuestions.map((_, i) => i);
  if (order.length === 0 || order.length < allIndices.length) {
    // If setting shuffleQuestions is true or if it's a new order, shuffle it
    order = shuffleArray(allIndices);
    
    // Save the new order to the team document
    await Team.updateOne(
      { teamId },
      { [`questionOrder.${roundKey}`]: order }
    );
  }
  
  // Reorder questions per team's shuffle
  const orderedQuestions = order.map(idx => allQuestions[idx]).filter(Boolean);
  
  // Get answered question IDs for this team
  const answered = (team.answeredQuestions && team.answeredQuestions[roundKey]) || [];
  const answeredMap = new Map(answered.map(a => [String(a.questionId), a]));
  
  // Strip correct answers from response (anti-cheat)
  const safeQuestions = orderedQuestions.map(q => {
    const isMatch = q.type === 'match';
    const answerInfo = answeredMap.get(String(q._id));
    
    const safeQ = {
      _id: q._id,
      type: isMatch ? 'match' : 'mcq',
      round: q.round,
      questionNumber: q.questionNumber,
      question: q.question,
      emojiClue: q.emojiClue || '',
      basePoints: q.basePoints,
      isAnswered: !!answerInfo,
      isCorrect: answerInfo?.correct,
    };

    const isRoundActive = session && session.status === `round${round}_active`;
    const hasFinishedRound = answered.length >= allQuestions.length && allQuestions.length > 0;
    
    const isPastRound = session && (
      (session.status === 'finished') ||
      (session.currentRound > round) ||
      (session.status === `round${round}_ended`) ||
      (session.status.startsWith('round') && parseInt(session.status.match(/\d+/)?.[0] || 0) > round)
    );

    const canShowAnswers = team.isEliminated || team.isDisqualified || isPastRound || hasFinishedRound;

    if (canShowAnswers) {
      safeQ.correctAnswer = q.correctAnswer;
      safeQ.explanation = q.explanation;
      safeQ.matchPairs = q.matchPairs || [];
    }

    if (isMatch && q.matchPairs) {
      // For match type, we provide the left and right lists shuffled separately
      const left = q.matchPairs.map(p => p.left);
      const right = q.matchPairs.map(p => p.right);
      safeQ.matchData = {
        left: shuffleArray(left),
        right: shuffleArray(right)
      };
    } else {
      safeQ.options = q.options;
    }

    return safeQ;
  });

  return NextResponse.json({
    questions: safeQuestions,
    session: session ? {
      status: session.status,
      currentRound: session.currentRound,
      roundStartTime: session.roundStartTime,
      roundEndTime: session.roundEndTime,
    } : null,
    team: {
      teamName: team.teamName,
      currentPlayerIndex: team.currentPlayerIndex,
      players: team.players,
      scores: team.scores,
      isEliminated: team.isEliminated,
      isDisqualified: team.isDisqualified,
    }
  });
}
