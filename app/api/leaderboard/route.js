export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import GameSession from '@/lib/models/GameSession';
import { getGameSession, invalidateSessionCache } from '@/lib/sessionCache';

let cachedLeaderboardResult = null;
let lastLeaderboardCalc = 0;
const LEADERBOARD_CACHE_TTL = 3000; // 3 seconds

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit')) || 0;
  const targetTeamId = searchParams.get('teamId');

  const now = Date.now();
  if (cachedLeaderboardResult && (now - lastLeaderboardCalc < LEADERBOARD_CACHE_TTL) && !limit && !targetTeamId) {
    return NextResponse.json(
      cachedLeaderboardResult,
      { headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate=30' } }
    );
  }

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

  // Calculate stats for target team if outside limit
  let targetTeamData = null;
  if (targetTeamId) {
    targetTeamData = leaderboard.find(t => t.teamId === targetTeamId);
  }

  // Truncate if limit is set
  let finalLeaderboard = leaderboard;
  if (limit > 0) {
    finalLeaderboard = leaderboard.slice(0, limit);
  }

  const responseData = { 
    leaderboard: finalLeaderboard, 
    session,
    targetTeam: targetTeamData,
    totalTeams: leaderboard.length 
  };

  // Cache the full leaderboard if no specific filters were applied
  if (!limit && !targetTeamId) {
    cachedLeaderboardResult = responseData;
    lastLeaderboardCalc = now;
  }

  return NextResponse.json(
    responseData,
    {
      headers: {
        'Cache-Control': 's-maxage=10, stale-while-revalidate=30',
      },
    }
  );
}

