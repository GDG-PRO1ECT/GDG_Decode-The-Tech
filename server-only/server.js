import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import http from 'http';
import { Server } from 'socket.io';
import parser from 'socket.io-msgpack-parser';
import cors from 'cors';

import dbConnect from '../lib/mongodb.js';
import GameSession from '../lib/models/GameSession.js';
import Team from '../lib/models/Team.js';
import Question from '../lib/models/Question.js';
import { invalidateSessionCache } from '../lib/sessionCache.js';
import { broadcastUpdate, getDietLeaderboard } from '../lib/broadcast.js';

const port = process.env.PORT || 3000;

// Centralized In-Memory Cache for Socket
global.gameCache = {
  session: null,
  leaderboard: []
};

const app = express();
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  path: '/api/socket_io',
  addTrailingSlash: false,
  parser,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

global.io = io;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  if (global.gameCache.session) {
    socket.emit('session_update', global.gameCache.session);
  }

  socket.on('join_team', (teamId) => {
    socket.join(`team_${teamId}`);
    socket.emit('leaderboard_update', getDietLeaderboard(teamId));
  });

  socket.on('join_display', () => {
    socket.join('display_board');
    socket.emit('leaderboard_update', global.gameCache.leaderboard.slice(0, 20));
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ==========================================
// GAME MUTATION APIS (Ported from Next.js)
// ==========================================

// POST /api/game/submit
app.post('/api/game/submit', async (req, res) => {
  try {
    const { teamId, questionId, answer, round } = req.body;

    if (!teamId || !questionId || !answer || !round) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [team, question, session] = await Promise.all([
      Team.findOne({ teamId }),
      Question.findById(questionId),
      GameSession.findOne({ sessionId: 'main' }),
    ]);

    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    if (team.isDisqualified) {
      return res.status(403).json({ error: 'Team is disqualified and cannot play' });
    }

    if (!session || session.status !== `round${round}_active`) {
      return res.status(400).json({ error: 'Round not active' });
    }

    const now = new Date();
    if (!session.isPaused && session.roundEndTime && now >= new Date(session.roundEndTime)) {
      session.status = `round${round}_ended`;
      await session.save();
      return res.status(400).json({ error: 'Time has expired for this round' });
    }

    const roundKey = `round${round}`;
    const alreadyAnswered = (team.answeredQuestions?.[roundKey] || []).find(
      a => a.questionId === String(questionId)
    );
    if (alreadyAnswered) {
      return res.status(400).json({ error: 'Already answered', result: alreadyAnswered });
    }

    let isCorrect = false;
    const isMatch = question.type === 'match';

    if (isMatch) {
      if (Array.isArray(answer) && answer.length === question.matchPairs.length) {
        const correctMap = new Map();
        question.matchPairs.forEach(p => correctMap.set(p.left, p.right));
        isCorrect = answer.every(pair => correctMap.get(pair.left) === pair.right);
      }
    } else {
      isCorrect = answer === question.correctAnswer;
    }

    let points = 0;
    if (isCorrect && !team.isDisqualified) {
      points = 1;
    }

    if (!team.answeredQuestions) team.answeredQuestions = {};
    if (!team.answeredQuestions[roundKey]) team.answeredQuestions[roundKey] = [];

    team.answeredQuestions[roundKey].push({
      questionId: String(questionId),
      answeredAt: now,
      correct: isCorrect,
      points,
    });

    team.scores[roundKey] = (team.scores[roundKey] || 0) + points;
    team.scores.total = (team.scores.round1 || 0) + (team.scores.round2 || 0) + (team.scores.round3 || 0) + (team.scores.bonusPoints || 0);

    await team.save();

    if (global.io) {
      global.io.emit('score_update', {
        teamId,
        scores: team.scores,
        round: roundKey
      });
    }

    return res.json({
      correct: isCorrect,
      points,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      totalScore: team.scores.total,
    });
  } catch (error) {
    console.error('Submit API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/game/start
app.post('/api/game/start', async (req, res) => {
  const { action, round, duration } = req.body;
  const adminPass = req.headers['x-admin-password'];

  if (adminPass !== (process.env.ADMIN_PASSWORD || 's1ddhant')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const session = await GameSession.findOne({ sessionId: 'main' });
    if (!session) {
      return res.status(404).json({ error: 'No game session found' });
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
      
      await Team.updateMany({}, { 
        currentRound: round,
        currentPlayerIndex: round - 1 
      });

      await session.save();
      invalidateSessionCache();
      broadcastUpdate();
      return res.json({ session, message: `Round ${round} started for all teams.` });
    }

    if (action === 'end_round') {
      session.status = `round${round}_ended`;
      session.isPaused = false;
      await session.save();
      invalidateSessionCache();
      broadcastUpdate();
      return res.json({ session, message: `Round ${round} ended. All teams remain qualified.` });
    }

    if (action === 'pause_round') {
      if (session.isPaused) return res.status(400).json({ error: 'Already paused' });
      session.isPaused = true;
      session.pausedAt = new Date();
      const remaining = Math.max(0, new Date(session.roundEndTime).getTime() - session.pausedAt.getTime());
      session.timeRemainingAtPause = remaining;
      await session.save();
      invalidateSessionCache();
      broadcastUpdate();
      return res.json({ session, message: `Round ${round} paused` });
    }

    if (action === 'resume_round') {
      if (!session.isPaused) return res.status(400).json({ error: 'Not paused' });
      session.isPaused = false;
      const now = new Date();
      session.roundEndTime = new Date(now.getTime() + (session.timeRemainingAtPause || 0));
      await session.save();
      invalidateSessionCache();
      broadcastUpdate();
      return res.json({ session, message: `Round ${round} resumed` });
    }

    if (action === 'finish') {
      session.status = 'finished';
      await session.save();
      invalidateSessionCache();
      broadcastUpdate();
      return res.json({ session, message: 'Game finished' });
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
      
      await Team.deleteMany({});
      broadcastUpdate();
      return res.json({ message: 'System purged successfully' });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error("Game Start API Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/teams/:teamId/disqualify
app.post('/api/teams/:teamId/disqualify', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { isDisqualified, reason } = req.body;

    const adminPass = req.headers['x-admin-password'];
    const expectedPass = process.env.ADMIN_PASSWORD || 'admin123';
    const isAdmin = adminPass === expectedPass;

    if (isDisqualified === false && !isAdmin) {
      return res.status(401).json({ error: 'Unauthorized — only admin can unban' });
    }

    const updateData = {
      isDisqualified: isDisqualified === true,
    };

    if (isDisqualified === true) {
      updateData.disqualifiedAt = new Date();
      updateData.disqualifiedReason = reason || 'Exited fullscreen / switched tabs during active round';
    } else if (isDisqualified === false) {
      updateData.disqualifiedAt = null;
      updateData.disqualifiedReason = null;
    }

    const team = await Team.findOneAndUpdate(
      { teamId },
      { $set: updateData },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    return res.json({ success: true, team });
  } catch (error) {
    console.error('Disqualify error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

httpServer.listen(port, async (err) => {
  if (err) throw err;
  console.log(`> Backend ready on http://localhost:${port}`);
  try {
    await dbConnect();
    console.log('> Database connected');
  } catch (e) {
    console.error('> Database connection failed', e);
  }
});
