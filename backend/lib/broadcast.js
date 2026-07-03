import Team from './models/Team.js';
import { getQuiz } from './sessionCache.js';

export function getDietLeaderboard(leaderboard, teamId) {
  const top8 = leaderboard.slice(0, 8);
  const myTeam = leaderboard.find(t => t.teamId === teamId);
  if (myTeam && !top8.find(t => t.teamId === teamId)) {
    return [...top8, myTeam];
  }
  return top8;
}

let broadcastTimers = {};

export async function broadcastUpdate(quizCode) {
  if (!global.io || !quizCode) return;
  if (broadcastTimers[quizCode]) return; // skip if broadcast already queued

  broadcastTimers[quizCode] = setTimeout(async () => {
    broadcastTimers[quizCode] = null;
    try {
      const session = await getQuiz(quizCode);
      const teams = await Team.find({ quizCode, isActive: true, isDisqualified: { $ne: true } })
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
        
        // Count answered questions across rounds 1-5
        const answeredCount = {};
        for (let r = 1; r <= 5; r++) {
          answeredCount[`round${r}`] = team.answeredQuestions?.[`round${r}`]?.length || 0;
        }

        return {
          rank: index + 1,
          teamId: team.teamId,
          teamName: team.teamName,
          teamNumber: team.teamNumber,
          players: team.players.map(p => p.name),
          scores: team.scores,
          lastAnswerTime: lastTime,
          answeredCount,
        };
      });

      // Update Global Cache
      if (!global.gameCache) global.gameCache = {};
      global.gameCache[quizCode] = { session, leaderboard };

      // Broadcast
      global.io.to(`quiz_${quizCode}`).emit('session_update', session);
      global.io.to(`quiz_${quizCode}`).emit('leaderboard_update', leaderboard);
      global.io.to(`display_board_${quizCode}`).emit('leaderboard_update', leaderboard.slice(0, 20));
    } catch (err) {
      console.error('Broadcast update error:', err);
    }
  }, 2000); // batch updates within 2 seconds
}
