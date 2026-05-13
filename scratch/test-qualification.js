// Mock Qualification Logic Test

const mockTeams = [
  { teamId: 't1', teamName: 'Team 1', scores: { total: 100 }, answeredQuestions: { round1: [{ answeredAt: '2026-05-13T10:00:00Z' }] } },
  { teamId: 't2', teamName: 'Team 2', scores: { total: 100 }, answeredQuestions: { round1: [{ answeredAt: '2026-05-13T10:01:00Z' }] } },
  { teamId: 't3', teamName: 'Team 3', scores: { total: 90 }, answeredQuestions: { round1: [{ answeredAt: '2026-05-13T10:00:00Z' }] } },
  { teamId: 't4', teamName: 'Team 4', scores: { total: 85 }, answeredQuestions: { round1: [{ answeredAt: '2026-05-13T10:00:00Z' }] } },
  { teamId: 't5', teamName: 'Team 5', scores: { total: 81 }, answeredQuestions: { round1: [{ answeredAt: '2026-05-13T10:00:00Z' }] } },
];

const round = 1;
const roundKey = `round${round}`;

// Sort teams (Score DESC, Time ASC)
const sortedTeams = [...mockTeams].sort((a, b) => {
  if (b.scores.total !== a.scores.total) {
    return b.scores.total - a.scores.total;
  }
  const getRoundCompletionTime = (t) => {
    const answers = t.answeredQuestions?.[roundKey] || [];
    if (answers.length === 0) return Infinity;
    return Math.max(...answers.map(ans => new Date(ans.answeredAt).getTime()));
  };
  return getRoundCompletionTime(a) - getRoundCompletionTime(b);
});

console.log('Sorted Teams:');
sortedTeams.forEach((t, i) => console.log(`${i+1}. ${t.teamName} - Score: ${t.scores.total}`));

const rankCutoff = Math.ceil(mockTeams.length * 0.8);
const topScore = sortedTeams[0].scores.total;
const scoreCutoff = topScore * 0.8;

console.log(`\nRank Cutoff (80%): ${rankCutoff}`);
console.log(`Top Score: ${topScore}`);
console.log(`Score Cutoff (80%): ${scoreCutoff}`);

console.log('\nQualification Results:');
sortedTeams.forEach((team, i) => {
  const rank = i + 1;
  const currentScore = team.scores.total;
  const isRankQualified = rank <= rankCutoff;
  const isScoreQualified = currentScore >= scoreCutoff;
  const qualified = isRankQualified || isScoreQualified;
  
  console.log(`${rank}. ${team.teamName}: RankQual: ${isRankQualified}, ScoreQual: ${isScoreQualified} -> ${qualified ? 'PASS' : 'ELIMINATED'}`);
});
