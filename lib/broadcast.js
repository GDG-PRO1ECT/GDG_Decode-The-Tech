import Team from './models/Team';
import { getGameSession } from './sessionCache';

// Helper for Payload Diet
function getDietLeaderboard(leaderboard, teamId) {
  const top8 = leaderboard.slice(0, 8);
  const myTeam = leaderboard.find(t => t.teamId === teamId);
  if (myTeam && !top8.find(t => t.teamId === teamId)) {
    return [...top8, myTeam];
  }
  return top8;
}

export async function broadcastUpdate() {
  if (!global.io) return;

  const session = await getGameSession();
  const teams = await Team.find({ isActive: true, isDisqualified: { $ne: true } })
    .select('teamId teamName teamNumber players scores answeredQuestions')
    .lean();

  // Sort leaderboard
  const roundKey = `round${session?.currentRound || 1}`;
  const leaderboard = teams.map(team => {
    const answers = team.answeredQuestions?.[roundKey] || [];
    const lastTime = answers.length > 0 
      ? Math.max(...answers.map(a => new Date(a.answeredAt).getTime()))
      : Infinity;
    return { ...team, _sortTime: lastTime };
  }).sort((a, b) => {
    if (b.scores.total !== a.scores.total) return b.scores.total - a.scores.total;
    return a._sortTime - b._sortTime;
  }).map((team, index) => {
    const answers = team.answeredQuestions?.[roundKey] || [];
    const lastTime = answers.length > 0 ? Math.max(...answers.map(a => new Date(a.answeredAt).getTime())) : null;
    return {
      rank: index + 1,
      teamId: team.teamId,
      teamName: team.teamName,
      teamNumber: team.teamNumber,
      players: team.players.map(p => p.name),
      scores: team.scores,
      lastAnswerTime: lastTime,
      answeredCount: {
        round1: team.answeredQuestions?.round1?.length || 0,
        round2: team.answeredQuestions?.round2?.length || 0,
        round3: team.answeredQuestions?.round3?.length || 0,
      },
    };
  });

  // Update Global Cache
  global.gameCache = { session, leaderboard };

  // Broadcast
  global.io.emit('session_update', session);
  global.io.to('display_board').emit('leaderboard_update', leaderboard.slice(0, 20));

  // Individual team rooms
  leaderboard.forEach(team => {
    const diet = getDietLeaderboard(leaderboard, team.teamId);
    global.io.to(`team_${team.teamId}`).emit('leaderboard_update', diet);
  });
}
