export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import GameSession from '@/lib/models/GameSession';
import { getGameSession } from '@/lib/sessionCache';

export async function GET() {
  await dbConnect();
  
  const [teams, session] = await Promise.all([
    Team.find({ isActive: true, isDisqualified: { $ne: true } })
      .select('teamId teamName teamNumber players scores answeredQuestions')
      .lean(),
    getGameSession(),
  ]);

  // Pre-calculate sorting keys for performance
  const roundKey = `round${session?.currentRound || 1}`;
  const teamsWithStats = teams.map(team => {
    team.scores.total = (team.scores.round1 || 0) + (team.scores.round2 || 0) + (team.scores.round3 || 0) + (team.scores.bonusPoints || 0);
    const answers = team.answeredQuestions?.[roundKey] || [];
    let lastTime = Infinity;
    if (answers.length > 0) {
      lastTime = 0;
      for (const ans of answers) {
        const t = new Date(ans.answeredAt).getTime();
        if (t > lastTime) lastTime = t;
      }
    }
    return { ...team, _sortTime: lastTime };
  });
  
  teamsWithStats.sort((a, b) => {
    if (b.scores.total !== a.scores.total) {
      return b.scores.total - a.scores.total;
    }
    return a._sortTime - b._sortTime;
  });

  const leaderboard = teamsWithStats.map((team, index) => {
    let lastAnswerTime = null;
    ['round1', 'round2', 'round3'].forEach(r => {
      const answers = team.answeredQuestions[r] || [];
      for (const ans of answers) {
        const t = new Date(ans.answeredAt).getTime();
        if (!lastAnswerTime || t > lastAnswerTime) lastAnswerTime = t;
      }
    });

    return {
      rank: index + 1,
      teamId: team.teamId,
      teamName: team.teamName,
      teamNumber: team.teamNumber,
      players: team.players.map(p => p.name),
      scores: team.scores,
      lastAnswerTime,
      answeredCount: {
        round1: team.answeredQuestions.round1.length,
        round2: team.answeredQuestions.round2.length,
        round3: team.answeredQuestions.round3.length,
      },
    };
  });

  return NextResponse.json(
    { leaderboard, session },
    {
      headers: {
        'Cache-Control': 's-maxage=3, stale-while-revalidate=5',
      },
    }
  );
}

