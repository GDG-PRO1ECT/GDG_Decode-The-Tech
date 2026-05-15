export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GameSession from '@/lib/models/GameSession';
import Team from '@/lib/models/Team';
import Question from '@/lib/models/Question';
import { invalidateSessionCache } from '@/lib/sessionCache';
import { broadcastUpdate } from '@/lib/broadcast';

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  const { action, round, duration } = body;

  // Admin password check
  const adminPass = req.headers.get('x-admin-password');
  if (adminPass !== (process.env.ADMIN_PASSWORD || 's1ddhant')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await GameSession.findOne({ sessionId: 'main' });
    if (!session) {
      return NextResponse.json({ error: 'No game session found' }, { status: 404 });
    }

  if (action === 'start_round') {
    const roundKey = `round${round}`;
    const durationSeconds = duration || session.roundDurations[roundKey];
    const now = new Date();
    
    session.status = `round${round}_active`;
    session.currentRound = round;
    session.roundStartTime = now;
    session.roundEndTime = new Date(now.getTime() + durationSeconds * 1000);
    if (duration) session.roundDurations[roundKey] = durationSeconds;
    
    // Update all teams' current round and rotate player
    // Rotate active player: round 1 -> player 0, round 2 -> player 1, round 3 -> player 2
    await Team.updateMany({}, { 
      currentRound: round,
      currentPlayerIndex: round - 1 
    });

    await session.save();
    invalidateSessionCache();

    broadcastUpdate();

    return NextResponse.json({ session, message: `Round ${round} started for all teams.` });
  }

  if (action === 'end_round') {
    session.status = `round${round}_ended`;
    session.isPaused = false;
    await session.save();
    invalidateSessionCache();

    // Qualification logic disabled as per request: All teams play all rounds.
    /*
    const allTeams = await Team.find({ isActive: true, isDisqualified: { $ne: true } });
    if (allTeams.length > 0) {
      const roundKey = `round${round}`;
      
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

      const rankCutoff = Math.max(1, Math.floor(allTeams.length * 0.8));
      const topScore = sortedTeams[0].scores.total;
      const scoreCutoff = topScore * 0.8;

      for (let i = 0; i < sortedTeams.length; i++) {
        const team = sortedTeams[i];
        const rank = i + 1;
        
        // Qualification check: Top 80% rank OR 80% of top score
        const isQualified = (rank <= rankCutoff) || (team.scores.total >= scoreCutoff);
        
        if (!isQualified && !team.isEliminated) {
          team.isEliminated = true;
          team.eliminatedAtRound = round;
          await team.save();
        }
      }
    }
    */

    broadcastUpdate();

    return NextResponse.json({ session, message: `Round ${round} ended. All teams remain qualified.` });
  }

  if (action === 'pause_round') {
    if (session.isPaused) return NextResponse.json({ error: 'Already paused' }, { status: 400 });
    session.isPaused = true;
    session.pausedAt = new Date();
    // Calculate remaining time in ms
    const remaining = Math.max(0, new Date(session.roundEndTime).getTime() - session.pausedAt.getTime());
    session.timeRemainingAtPause = remaining;
    // We keep roundEndTime as is, but UI will read timeRemainingAtPause or we can freeze it.
    // Actually, setting roundEndTime to null might break things, we just rely on isPaused.
    await session.save();
    invalidateSessionCache();

    broadcastUpdate();

    return NextResponse.json({ session, message: `Round ${round} paused` });
  }

  if (action === 'resume_round') {
    if (!session.isPaused) return NextResponse.json({ error: 'Not paused' }, { status: 400 });
    session.isPaused = false;
    const now = new Date();
    // Shift the end time by adding the remaining time
    session.roundEndTime = new Date(now.getTime() + (session.timeRemainingAtPause || 0));
    await session.save();
    invalidateSessionCache();

    broadcastUpdate();

    return NextResponse.json({ session, message: `Round ${round} resumed` });
  }

  if (action === 'finish') {
    session.status = 'finished';
    await session.save();
    invalidateSessionCache();

    broadcastUpdate();

    return NextResponse.json({ session, message: 'Game finished' });
  }

  if (action === 'reset') {
    session.status = 'waiting';
    session.currentRound = 0;
    session.roundStartTime = null;
    session.roundEndTime = null;
    session.isPaused = false;
    session.pausedAt = null;
    session.timeRemainingAtPause = null;
    session.fastestAnswers = { round1: [], round2: [], round3: [] };
    await session.save();
    invalidateSessionCache();
    
    // Purge all teams
    await Team.deleteMany({});
    
    broadcastUpdate();

    return NextResponse.json({ message: 'System purged successfully' });
  }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error("Game Start API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
