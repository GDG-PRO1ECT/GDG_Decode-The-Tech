import PlayClient from './PlayClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PlayPage({ params }) {
  const { teamId, quizCode } = params;
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  try {
    // 1. Fetch team & session first to see if there is an active round
    const res = await fetch(`${baseUrl}/api/teams/${teamId}?quizCode=${quizCode}`, { cache: 'no-store' });
    const data = await res.json();
    
    if (!res.ok || !data.team) {
      notFound();
    }

    const team = data.team;
    const session = data.session;
    let safeQuestions = [];

    // 2. If there is a current round, fetch the safe questions
    if (session && session.currentRound) {
      const qRes = await fetch(`${baseUrl}/api/game/questions?teamId=${teamId}&round=${session.currentRound}&quizCode=${quizCode}`, { cache: 'no-store' });
      if (qRes.ok) {
        const qData = await qRes.json();
        safeQuestions = qData.questions || [];
      }
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
        initialQuestions={safeQuestions} 
        initialTeam={safeTeam} 
        initialSession={safeSession || {}} 
      />
    );
  } catch (err) {
    console.error(err);
    notFound();
  }
}
