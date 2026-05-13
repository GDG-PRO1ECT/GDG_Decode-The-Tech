import dbConnect from '../lib/mongodb.js';
import Team from '../lib/models/Team.js';
import GameSession from '../lib/models/GameSession.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function checkElimination() {
  await dbConnect();
  
  const session = await GameSession.findOne({ sessionId: 'main' });
  if (!session) {
    console.log('No active game session found.');
    process.exit(0);
  }

  const round = session.currentRound || 1;
  const roundKey = `round${round}`;
  console.log(`Current Phase: 0${round}`);
  console.log(`Session Status: ${session.status}\n`);

  const allTeams = await Team.find({ isActive: true, isDisqualified: { $ne: true } });
  if (allTeams.length === 0) {
    console.log('No active teams found.');
    process.exit(0);
  }

  // Sort teams exactly like the leaderboard: Score DESC, Time ASC
  const sortedTeams = [...allTeams].sort((a, b) => {
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

  const rankCutoff = Math.ceil(allTeams.length * 0.8);
  const topScore = sortedTeams[0].scores.total;
  const scoreCutoff = topScore * 0.8;

  console.log(`Qualification Thresholds:`);
  console.log(`- Rank: Top ${rankCutoff} out of ${allTeams.length}`);
  console.log(`- Score: >= ${scoreCutoff.toFixed(2)} (80% of top score ${topScore})\n`);

  console.log(`Current Standings & Status:`);
  console.log(`Rank | Team Name | Total Score | Time (ms) | Status`);
  console.log(`-----|-----------|-------------|-----------|-------`);

  const toEliminate = [];

  sortedTeams.forEach((team, i) => {
    const rank = i + 1;
    const currentScore = team.scores.total;
    
    const isRankQualified = rank <= rankCutoff;
    const isScoreQualified = currentScore >= scoreCutoff;
    const qualified = isRankQualified || isScoreQualified;

    const answers = team.answeredQuestions?.[roundKey] || [];
    const time = answers.length > 0 ? Math.max(...answers.map(ans => new Date(ans.answeredAt).getTime())) : Infinity;
    const timeStr = time === Infinity ? 'N/A' : new Date(time).toLocaleTimeString();

    console.log(`${String(rank).padEnd(4)} | ${team.teamName.padEnd(9)} | ${String(currentScore).padEnd(11)} | ${timeStr.padEnd(9)} | ${qualified ? 'PASS' : 'FAIL'}`);

    if (!qualified) {
      toEliminate.push(team.teamName);
    }
  });

  if (toEliminate.length > 0) {
    console.log(`\nTeams that would be ELIMINATED: ${toEliminate.join(', ')}`);
  } else {
    console.log(`\nAll current teams qualify.`);
  }

  process.exit(0);
}

checkElimination();
