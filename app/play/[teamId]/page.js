import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import GameSession from '@/lib/models/GameSession';
import Question from '@/lib/models/Question';
import PlayClient from './PlayClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PlayPage({ params }) {
  await dbConnect();
  
  const { teamId } = params;
  
  const team = await Team.findOne({ teamId }).lean();
  if (!team) notFound();

  const session = await GameSession.findOne({ sessionId: 'main' }).lean();
  
  let safeQuestions = [];

  if (session && session.currentRound) {
    const round = session.currentRound;
    const allQuestions = await Question.find({ round, isActive: true }).sort({ questionNumber: 1 }).lean();
    
    const roundKey = `round${round}`;
    let order = team.questionOrder?.[roundKey] || [];
    
    const allIndices = allQuestions.map((_, i) => i);
    const missingIndices = allIndices.filter(i => !order.includes(i));
    if (missingIndices.length > 0 || order.length === 0) {
      order = [...(order.length > 0 ? order : allIndices), ...missingIndices];
    }
    
    const orderedQuestions = order.map(idx => allQuestions[idx]).filter(Boolean);
    
    const answered = team.answeredQuestions?.[roundKey] || [];
    const answeredIds = new Set(answered.map(a => String(a.questionId)));
    
    safeQuestions = orderedQuestions.map(q => ({
      _id: String(q._id),
      round: q.round,
      questionNumber: q.questionNumber,
      question: q.question,
      emojiClue: q.emojiClue || '',
      options: q.options,
      basePoints: q.basePoints,
      isAnswered: answeredIds.has(String(q._id)),
    }));
  }

  const safeSession = session ? {
    status: session.status,
    currentRound: session.currentRound,
    roundStartTime: session.roundStartTime,
    roundEndTime: session.roundEndTime,
  } : null;

  const safeTeam = {
    teamId: team.teamId,
    teamName: team.teamName,
    currentPlayerIndex: team.currentPlayerIndex,
    players: team.players,
    scores: team.scores,
    isDisqualified: team.isDisqualified,
    isEliminated: team.isEliminated,
    eliminatedAtRound: team.eliminatedAtRound,
  };

  return (
    <PlayClient 
      initialQuestions={JSON.parse(JSON.stringify(safeQuestions))} 
      initialTeam={JSON.parse(JSON.stringify(safeTeam))} 
      initialSession={JSON.parse(JSON.stringify(safeSession || {}))} 
    />
  );
}
