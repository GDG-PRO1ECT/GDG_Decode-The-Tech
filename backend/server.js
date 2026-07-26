import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import compression from 'compression';
import http from 'http';
import { Server } from 'socket.io';
import parser from 'socket.io-msgpack-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import mammoth from 'mammoth';
import rateLimit from 'express-rate-limit';

import dbConnect from './lib/mongodb.js';
import Quiz from './lib/models/Quiz.js';
import Team from './lib/models/Team.js';
import Question from './lib/models/Question.js';
import { getQuiz, invalidateSessionCache } from './lib/sessionCache.js';
import { broadcastUpdate, getDietLeaderboard } from './lib/broadcast.js';
import { generateQuizCode } from './lib/generateQuizCode.js';

const port = process.env.PORT || 4000;
const upload = multer({ storage: multer.memoryStorage() });

// Centralized In-Memory Cache for Socket
global.gameCache = {};

// Centralized Questions Cache
const questionCache = {};

async function getQuizQuestions(quizCode, roundNum) {
  const cacheKey = `${quizCode}_round_${roundNum}`;
  if (questionCache[cacheKey]) {
    return questionCache[cacheKey];
  }
  await dbConnect();
  const questions = await Question.find({ quizCode, round: roundNum, isActive: true })
    .sort({ questionNumber: 1 })
    .lean();
  questionCache[cacheKey] = questions;
  return questions;
}

async function getQuizQuestionById(quizCode, questionId) {
  const cacheKey = `${quizCode}_all`;
  if (questionCache[cacheKey]) {
    const q = questionCache[cacheKey].find(item => String(item._id) === String(questionId));
    if (q) return q;
  }
  
  await dbConnect();
  const questions = await Question.find({ quizCode, isActive: true }).lean();
  questionCache[cacheKey] = questions;
  
  const rounds = [1, 2, 3, 4, 5];
  rounds.forEach(r => {
    const roundQs = questions.filter(item => item.round === r).sort((a, b) => a.questionNumber - b.questionNumber);
    questionCache[`${quizCode}_round_${r}`] = roundQs;
  });

  return questions.find(item => String(item._id) === String(questionId));
}

function invalidateQuestionCache(quizCode) {
  if (quizCode) {
    delete questionCache[`${quizCode}_all`];
    const rounds = [1, 2, 3, 4, 5];
    rounds.forEach(r => {
      delete questionCache[`${quizCode}_round_${r}`];
    });
  } else {
    for (const key in questionCache) {
      delete questionCache[key];
    }
  }
}

const app = express();
app.set('trust proxy', 1); // Trust the first proxy (Render/Vercel) so rate limiting works correctly
app.use(compression());

// Prevent DDoS / Spam clicks from crashing the server
const apiLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 30, // Limit each IP to 30 requests per window (averaging 3 requests per second)
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// In production, restrict CORS to the Vercel frontend URL (set CORS_ORIGIN env var).
// In development, allow everything.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : '*';

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

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

// Memory Leak Prevention (Garbage Collection)
// Cleans up inactive or finished quizzes from memory every 30 minutes
setInterval(() => {
  const now = Date.now();
  if (global.gameCache) {
    for (const quizCode of Object.keys(global.gameCache)) {
      const cacheData = global.gameCache[quizCode];
      if (cacheData && cacheData.session) {
        const updatedAt = new Date(cacheData.session.updatedAt || cacheData.session.createdAt || now).getTime();
        const ageHours = (now - updatedAt) / (1000 * 60 * 60);
        
        // Remove if finished for > 2 hours, or inactive for > 12 hours
        if ((cacheData.session.status === 'finished' && ageHours > 2) || ageHours > 12) {
          delete global.gameCache[quizCode];
          invalidateQuestionCache(quizCode);
          console.log(`[GC] Flushed quiz ${quizCode} from memory to prevent leaks.`);
        }
      }
    }
  }
}, 30 * 60 * 1000);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_quiz', (quizCode) => {
    socket.join(`quiz_${quizCode}`);
    if (global.gameCache[quizCode]?.session) {
      socket.emit('session_update', global.gameCache[quizCode].session);
    }
  });

  socket.on('join_team', async ({ teamId, quizCode }) => {
    socket.join(`team_${teamId}`);
    socket.join(`quiz_${quizCode}`);
    if (global.gameCache[quizCode]) {
      const { getDietLeaderboard } = await import('./lib/broadcast.js');
      socket.emit('leaderboard_update', getDietLeaderboard(global.gameCache[quizCode].leaderboard, teamId));
    }
  });

  socket.on('join_display', (quizCode) => {
    socket.join(`display_board_${quizCode}`);
    if (global.gameCache[quizCode]) {
      socket.emit('leaderboard_update', global.gameCache[quizCode].leaderboard.slice(0, 20));
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper: Admin auth middleware (check password for a specific quiz)
async function verifyAdminPassword(quizCode, passwordHeader) {
  if (!quizCode) return false;
  
  // Master password check (env-level override)
  const masterPass = process.env.ADMIN_PASSWORD;
  if (masterPass && passwordHeader === masterPass) return true;

  // Ensure DB is connected before querying
  await dbConnect();

  const quiz = await Quiz.findOne({ quizCode });
  console.log('[AUTH] quizCode:', quizCode);
  console.log('[AUTH] quiz found:', !!quiz);
  console.log('[AUTH] passwordHeader:', JSON.stringify(passwordHeader));
  console.log('[AUTH] storedHash:', quiz?.organizerPassword?.slice(0, 20));

  if (!quiz) return false;

  const match = await bcrypt.compare(passwordHeader || '', quiz.organizerPassword);
  console.log('[AUTH] bcrypt match:', match);
  return match;
}

// Admin checking middleware
const adminAuth = async (req, res, next) => {
  const quizCode = req.query.quizCode || req.body.quizCode || req.params.quizCode;
  const adminPass = req.headers['x-admin-password'];

  console.log('[AUTH MIDDLEWARE] quizCode:', quizCode, '| password present:', !!adminPass);
  
  if (!quizCode) {
    return res.status(400).json({ error: 'quizCode is required for authorization' });
  }

  const isAuth = await verifyAdminPassword(quizCode, adminPass);
  if (!isAuth) {
    return res.status(401).json({ error: 'Unauthorized admin credentials' });
  }

  next();
};

// POST /api/admin/verify — lightweight credential check used by the login gate
app.post('/api/admin/verify', adminAuth, (req, res) => {
  return res.json({ ok: true });
});


// ==========================================
// 1. QUIZ CREATION & STATUS
// ==========================================

// POST /api/quiz/create
app.post('/api/quiz/create', async (req, res) => {
  try {
    await dbConnect();
    const {
      quizName,
      description,
      organizerPassword,
      playersPerTeam,
      allowLateJoin,
      shuffleQuestions,
      maxTeams,
      registrationOpen,
      quizLanguage,
      showLeaderboardDuringGame,
      allowReAttempt,
      fastestFingerBonus,
      timeBonusEnabled,
      rounds
    } = req.body;

    if (!quizName || !organizerPassword) {
      return res.status(400).json({ error: 'Quiz name and password are required' });
    }

    // Generate unique quiz code
    let quizCode = generateQuizCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await Quiz.findOne({ quizCode });
      if (!existing) {
        isUnique = true;
      } else {
        quizCode = generateQuizCode();
        attempts++;
      }
    }
    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique quiz code' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(organizerPassword, salt);

    const quiz = await Quiz.create({
      quizCode,
      quizName,
      description: description || '',
      organizerPassword: hashedPassword,
      status: 'draft',
      settings: {
        playersPerTeam: playersPerTeam || 3,
        allowLateJoin: allowLateJoin ?? true,
        shuffleQuestions: shuffleQuestions ?? true,
        maxTeams: maxTeams || 100,
        registrationOpen: registrationOpen ?? true,
        quizLanguage: quizLanguage || 'en',
        showLeaderboardDuringGame: showLeaderboardDuringGame ?? true,
        allowReAttempt: allowReAttempt ?? false,
        fastestFingerBonus: fastestFingerBonus || 5,
        timeBonusEnabled: timeBonusEnabled ?? true,
        rounds: rounds || []
      }
    });

    return res.json({ success: true, quizCode: quiz.quizCode });
  } catch (error) {
    console.error('Quiz creation error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// GET /api/game/status
app.get('/api/game/status', async (req, res) => {
  try {
    await dbConnect();
    const quizCode = req.query.quizCode;
    if (!quizCode) {
      return res.status(400).json({ error: 'quizCode is required' });
    }
    const session = await getQuiz(quizCode);
    return res.json({ session });
  } catch (error) {
    console.error("Game Status Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. GAME CONTROLLER (Admin)
// ==========================================

// POST /api/game/start
app.post('/api/game/start', adminAuth, async (req, res) => {
  const { action, round, duration, quizCode } = req.body;

  try {
    const session = await Quiz.findOne({ quizCode });
    if (!session) {
      return res.status(404).json({ error: 'No quiz found' });
    }

    if (action === 'start_round') {
      const roundKey = `round${round}`;
      const roundConfig = session.settings.rounds.find(r => r.roundNumber === round) || {};
      const durationSeconds = duration || roundConfig.timeLimitSeconds || 900;
      const now = new Date();
      
      session.status = 'active';
      session.currentRound = round;
      session.roundStartTime = now;
      session.roundEndTime = new Date(now.getTime() + durationSeconds * 1000);
      if (duration) {
        if (!session.roundDurations) session.roundDurations = {};
        session.roundDurations.set(roundKey, durationSeconds);
      }
      
      await Team.updateMany({ quizCode }, { 
        currentRound: round,
        currentPlayerIndex: round - 1 
      });

      await session.save();
      invalidateSessionCache(quizCode);
      broadcastUpdate(quizCode);
      return res.json({ session, message: `Round ${round} started for all teams.` });
    }

    if (action === 'end_round') {
      session.status = 'ready';
      session.isPaused = false;
      await session.save();
      invalidateSessionCache(quizCode);
      broadcastUpdate(quizCode);
      return res.json({ session, message: `Round ${round} ended.` });
    }

    if (action === 'pause_round') {
      if (session.isPaused) return res.status(400).json({ error: 'Already paused' });
      session.isPaused = true;
      session.pausedAt = new Date();
      const remaining = Math.max(0, new Date(session.roundEndTime).getTime() - session.pausedAt.getTime());
      session.timeRemainingAtPause = remaining;
      await session.save();
      invalidateSessionCache(quizCode);
      broadcastUpdate(quizCode);
      return res.json({ session, message: `Round ${round} paused` });
    }

    if (action === 'resume_round') {
      if (!session.isPaused) return res.status(400).json({ error: 'Not paused' });
      session.isPaused = false;
      const now = new Date();
      session.roundEndTime = new Date(now.getTime() + (session.timeRemainingAtPause || 0));
      await session.save();
      invalidateSessionCache(quizCode);
      broadcastUpdate(quizCode);
      return res.json({ session, message: `Round ${round} resumed` });
    }

    if (action === 'finish') {
      session.status = 'finished';
      await session.save();
      invalidateSessionCache(quizCode);
      broadcastUpdate(quizCode);
      return res.json({ session, message: 'Game finished' });
    }

    if (action === 'launch') {
      session.status = 'ready';
      await session.save();
      invalidateSessionCache(quizCode);
      broadcastUpdate(quizCode);
      return res.json({ session, message: 'Quiz compiled and ready to play!' });
    }

    if (action === 'reset') {
      session.status = 'draft';
      session.currentRound = 0;
      session.roundStartTime = null;
      session.roundEndTime = null;
      session.isPaused = false;
      session.pausedAt = null;
      session.timeRemainingAtPause = null;
      await session.save();
      invalidateSessionCache(quizCode);
      
      await Team.deleteMany({ quizCode });
      broadcastUpdate(quizCode);
      return res.json({ message: 'Quiz reset successfully. Teams purged.' });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error("Game Start Action Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. TEAM APIS
// ==========================================

// GET /api/teams - list all teams for a quiz
app.get('/api/teams', async (req, res) => {
  try {
    await dbConnect();
    const { quizCode } = req.query;
    if (!quizCode) return res.status(400).json({ error: 'quizCode required' });
    
    const teams = await Team.find({ quizCode }).sort({ teamNumber: 1 }).lean();
    return res.json({ teams });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/teams - register a team
app.post('/api/teams', async (req, res) => {
  try {
    await dbConnect();
    const body = req.body;
    const quizCode = Array.isArray(body) ? body[0]?.quizCode : body.quizCode;
    
    if (!quizCode) return res.status(400).json({ error: 'quizCode required' });

    // If bulk importing teams, require admin auth
    if (Array.isArray(body)) {
      const adminPass = req.headers['x-admin-password'];
      const isAuth = await verifyAdminPassword(quizCode, adminPass);
      if (!isAuth) return res.status(401).json({ error: 'Unauthorized' });
    }

    const quiz = await Quiz.findOne({ quizCode });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    if (!Array.isArray(body) && !quiz.settings.registrationOpen) {
      return res.status(400).json({ error: 'Registration is closed for this quiz' });
    }

    const currentTeamCount = await Team.countDocuments({ quizCode });
    if (!Array.isArray(body) && currentTeamCount >= (quiz.settings.maxTeams || 100)) {
      return res.status(400).json({ error: 'Quiz has reached max team limit' });
    }

    // Helper function to create a single team object
    async function prepareTeam(teamData, indexOffset = 0) {
      const { teamName, teamNumber, players } = teamData;

      const maxDoc = await Team.findOne({ quizCode }).sort({ teamNumber: -1 }).select('teamNumber').lean();
      const baseNum = maxDoc ? maxDoc.teamNumber : 0;
      let tNum = teamNumber || (baseNum + indexOffset + 1);

      // Generate a globally unique teamId using crypto random bytes
      let teamId;
      let attempts = 0;
      do {
        const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
        teamId = `T-${randomPart}`;
        attempts++;
      } while (attempts < 100 && await Team.findOne({ teamId }).lean());

      return {
        quizCode,
        teamId,
        teamName,
        teamNumber: tNum,
        players: players.map((p, idx) => ({ name: p, playerNumber: idx + 1 })),
        currentRound: 0,
        currentPlayerIndex: 0,
        scores: { round1: 0, round2: 0, round3: 0, round4: 0, round5: 0, total: 0, bonusPoints: 0 },
        answeredQuestions: { round1: [], round2: [], round3: [], round4: [], round5: [] },
      };
    }

    // Generate shuffled question orders for all rounds
    const roundsList = [1, 2, 3, 4, 5];
    const shuffleIndices = (arr) => {
      const indices = arr.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      return indices;
    };

    const questionOrder = {};
    for (const r of roundsList) {
      const q = await Question.find({ quizCode, round: r, isActive: true }).lean();
      questionOrder[`round${r}`] = shuffleIndices(q);
    }

    if (Array.isArray(body)) {
      const teamsToCreate = [];
      for (let i = 0; i < body.length; i++) {
        const { teamName } = body[i];
        const existing = await Team.findOne({ teamName, quizCode }).lean();
        if (existing) continue; // Skip duplicates in bulk

        const t = await prepareTeam(body[i], i);
        if (t) {
          teamsToCreate.push({ ...t, questionOrder });
        }
      }
      if (teamsToCreate.length === 0) {
        return res.status(409).json({ error: 'No new teams to create' });
      }
      const created = await Team.insertMany(teamsToCreate);
      broadcastUpdate(quizCode);
      return res.status(201).json({ teams: created });
    } else {
      const { teamName } = body;
      const existing = await Team.findOne({ teamName, quizCode }).lean();
      if (existing) {
        return res.status(400).json({ error: 'Team name already taken' });
      }
      const t = await prepareTeam(body);
      const team = await Team.create({ ...t, questionOrder });
      broadcastUpdate(quizCode);
      return res.status(201).json({ team });
    }
  } catch (error) {
    console.error('Create Team Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/teams - clear all teams for a quiz
app.delete('/api/teams', adminAuth, async (req, res) => {
  try {
    await dbConnect();
    const { quizCode } = req.query;
    await Team.deleteMany({ quizCode });
    broadcastUpdate(quizCode);
    return res.json({ message: 'All teams deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/teams/:teamId - fetch specific team
app.get('/api/teams/:teamId', async (req, res) => {
  try {
    await dbConnect();
    const { teamId } = req.params;
    const { quizCode } = req.query;
    if (!quizCode) return res.status(400).json({ error: 'quizCode is required' });

    const [team, session] = await Promise.all([
      Team.findOne({ teamId, quizCode }).lean(),
      getQuiz(quizCode)
    ]);
    
    if (!team) return res.status(404).json({ error: 'Team not found' });
    return res.json({ team, session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/teams/:teamId - update team scores/details
app.patch('/api/teams/:teamId', adminAuth, async (req, res) => {
  try {
    await dbConnect();
    const { teamId } = req.params;
    const { quizCode, scores, teamName, teamNumber, isActive } = req.body;

    const existingTeam = await Team.findOne({ teamId, quizCode });
    if (!existingTeam) return res.status(404).json({ error: 'Team not found' });

    if (scores) {
      existingTeam.scores.round1 = scores.round1 ?? existingTeam.scores.round1;
      existingTeam.scores.round2 = scores.round2 ?? existingTeam.scores.round2;
      existingTeam.scores.round3 = scores.round3 ?? existingTeam.scores.round3;
      existingTeam.scores.round4 = scores.round4 ?? existingTeam.scores.round4;
      existingTeam.scores.round5 = scores.round5 ?? existingTeam.scores.round5;
      existingTeam.scores.bonusPoints = scores.bonusPoints ?? existingTeam.scores.bonusPoints;
      
      existingTeam.scores.total = 
        (existingTeam.scores.round1 || 0) + 
        (existingTeam.scores.round2 || 0) + 
        (existingTeam.scores.round3 || 0) + 
        (existingTeam.scores.round4 || 0) + 
        (existingTeam.scores.round5 || 0) + 
        (existingTeam.scores.bonusPoints || 0);
    }

    if (teamName) existingTeam.teamName = teamName;
    if (teamNumber) existingTeam.teamNumber = teamNumber;
    if (isActive !== undefined) existingTeam.isActive = isActive;

    await existingTeam.save();
    broadcastUpdate(quizCode);
    return res.json({ team: existingTeam });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/teams/:teamId - delete team
app.delete('/api/teams/:teamId', adminAuth, async (req, res) => {
  try {
    await dbConnect();
    const { teamId } = req.params;
    const { quizCode } = req.query;

    await Team.deleteOne({ teamId, quizCode });
    broadcastUpdate(quizCode);
    return res.json({ message: 'Team deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/teams/:teamId/disqualify
app.post('/api/teams/:teamId/disqualify', async (req, res) => {
  try {
    await dbConnect();
    const { teamId } = req.params;
    const { isDisqualified, reason, quizCode } = req.body;

    if (!quizCode) return res.status(400).json({ error: 'quizCode required' });

    // Banning can be done automatically by client-side anti-cheat (no auth needed).
    // Unbanning requires admin password.
    if (isDisqualified === false) {
      const adminPass = req.headers['x-admin-password'];
      const isAuth = await verifyAdminPassword(quizCode, adminPass);
      if (!isAuth) {
        return res.status(401).json({ error: 'Unauthorized — only admin can unban' });
      }
    }

    const updateData = { isDisqualified: isDisqualified === true };

    if (isDisqualified === true) {
      updateData.disqualifiedAt = new Date();
      updateData.disqualifiedReason = reason || 'Exited fullscreen / switched tabs during active round';
    } else {
      updateData.disqualifiedAt = null;
      updateData.disqualifiedReason = null;
    }

    const team = await Team.findOneAndUpdate(
      { teamId, quizCode },
      { $set: updateData },
      { new: true }
    );

    if (!team) return res.status(404).json({ error: 'Team not found' });
    
    broadcastUpdate(quizCode);
    return res.json({ success: true, team });
  } catch (error) {
    console.error('Disqualify error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// 4. GAME ENGINE & QUESTIONS FLOW
// ==========================================

// GET /api/game/questions
app.get('/api/game/questions', async (req, res) => {
  try {
    await dbConnect();
    const { teamId, round, quizCode } = req.query;
    const roundNum = parseInt(round);

    if (!teamId || !roundNum || !quizCode) {
      return res.status(400).json({ error: 'teamId, round, and quizCode required' });
    }

    const team = await Team.findOne({ teamId, quizCode }).lean();
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const session = await getQuiz(quizCode);
    
    // Get questions for this round
    const allQuestions = await getQuizQuestions(quizCode, roundNum);
    
    // Get team's shuffled order for this round
    const roundKey = `round${roundNum}`;
    let order = (team.questionOrder && team.questionOrder[roundKey]) || [];
    
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const allIndices = allQuestions.map((_, i) => i);
    if (order.length === 0 || order.length < allIndices.length) {
      order = shuffleArray(allIndices);
      await Team.updateOne(
        { teamId, quizCode },
        { [`questionOrder.${roundKey}`]: order }
      );
    }
    
    const orderedQuestions = order.map(idx => allQuestions[idx]).filter(Boolean);
    const answered = (team.answeredQuestions && team.answeredQuestions[roundKey]) || [];
    const answeredMap = new Map(answered.map(a => [String(a.questionId), a]));
    
    const safeQuestions = orderedQuestions.map(q => {
      const isMatch = q.type === 'match';
      const answerInfo = answeredMap.get(String(q._id));
      
      const safeQ = {
        _id: q._id,
        type: q.type || 'mcq',
        round: q.round,
        questionNumber: q.questionNumber,
        question: q.question,
        emojiClue: q.emojiClue || '',
        basePoints: q.basePoints,
        isAnswered: !!answerInfo,
        isCorrect: answerInfo?.correct,
      };

      const hasFinishedRound = answered.length >= allQuestions.length && allQuestions.length > 0;
      const isPastRound = session && (
        (session.status === 'finished') ||
        (session.currentRound > roundNum) ||
        (session.status === `round${roundNum}_ended`)
      );

      // Do NOT show answer after every question - only show if round ended or player finished/disqualified
      const canShowAnswers = team.isEliminated || team.isDisqualified || isPastRound || hasFinishedRound;

      if (canShowAnswers) {
        safeQ.correctAnswer = q.correctAnswer;
        safeQ.explanation = q.explanation;
        safeQ.matchPairs = q.matchPairs || [];
        safeQ.actualFact = q.actualFact;
      }

      if (isMatch && q.matchPairs) {
        const left = q.matchPairs.map(p => p.left);
        const right = q.matchPairs.map(p => p.right);
        safeQ.matchData = {
          left: shuffleArray(left),
          right: shuffleArray(right)
        };
      } else {
        safeQ.options = q.options;
      }

      return safeQ;
    });

    return res.json({
      questions: safeQuestions,
      session: session ? {
        status: session.status,
        currentRound: session.currentRound,
        roundStartTime: session.roundStartTime,
        roundEndTime: session.roundEndTime,
      } : null,
      team: {
        teamName: team.teamName,
        currentPlayerIndex: team.currentPlayerIndex,
        players: team.players,
        scores: team.scores,
        isEliminated: team.isEliminated,
        isDisqualified: team.isDisqualified,
      }
    });
  } catch (error) {
    console.error('GET game questions error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/game/submit
app.post('/api/game/submit', async (req, res) => {
  try {
    await dbConnect();
    const { teamId, questionId, answer, round, quizCode } = req.body;
    const roundNum = parseInt(round);

    if (!teamId || !questionId || !answer || !roundNum || !quizCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [team, question, session] = await Promise.all([
      Team.findOne({ teamId, quizCode }),
      getQuizQuestionById(quizCode, questionId),
      getQuiz(quizCode),
    ]);

    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    if (team.isDisqualified) {
      return res.status(403).json({ error: 'Team is disqualified and cannot play' });
    }

    if (!session || session.status !== 'active' || session.currentRound !== roundNum) {
      return res.status(400).json({ error: 'Round not active' });
    }

    const now = new Date();
    if (!session.isPaused && session.roundEndTime && now >= new Date(session.roundEndTime)) {
      session.status = 'ready';
      await session.save();
      invalidateSessionCache(quizCode);
      broadcastUpdate(quizCode);
      return res.status(400).json({ error: 'Time has expired for this round' });
    }

    const roundKey = `round${roundNum}`;
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
    } else if (question.type === 'truefalse') {
      // True/False could use reverse logic (R3 twist)
      const correctVal = question.correctAnswer;
      if (question.hasReverseLogic) {
        // Reverse correctness: correct answer is the OPPOSITE of the actual fact
        const opposite = correctVal === 'True' || correctVal === 'Real' ? 'False' : 'True';
        isCorrect = answer === opposite;
      } else {
        isCorrect = answer === correctVal;
      }
    } else {
      isCorrect = answer === question.correctAnswer;
    }

    let points = 0;
    if (isCorrect && !team.isDisqualified) {
      points = 1; // Standard 1 point per correct answer
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { 
        _id: team._id, 
        [`answeredQuestions.${roundKey}.questionId`]: { $ne: String(questionId) }
      },
      {
        $push: {
          [`answeredQuestions.${roundKey}`]: {
            questionId: String(questionId),
            answeredAt: now,
            correct: isCorrect,
            points,
          }
        },
        $inc: {
          [`scores.${roundKey}`]: points,
          'scores.total': points
        }
      },
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(400).json({ error: 'Already answered concurrently or team not found' });
    }

    broadcastUpdate(quizCode);

    return res.json({
      correct: isCorrect,
      points,
      totalScore: updatedTeam.scores.total,
    });
  } catch (error) {
    console.error('Submit Answer Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// 5. LEADERBOARD APIS
// ==========================================

// GET /api/leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    await dbConnect();
    const { quizCode, limit, teamId: targetTeamId } = req.query;
    const limitNum = parseInt(limit) || 0;
    
    if (!quizCode) {
      return res.status(400).json({ error: 'quizCode is required' });
    }

    // Attempt to serve instantly from memory cache to prevent DB load on global scale
    if (global.gameCache && global.gameCache[quizCode] && global.gameCache[quizCode].leaderboard) {
      const cache = global.gameCache[quizCode];
      const cachedLeaderboard = cache.leaderboard;
      
      let targetTeamData = null;
      if (targetTeamId) {
        targetTeamData = cachedLeaderboard.find(t => t.teamId === targetTeamId);
      }
      
      let finalLeaderboard = cachedLeaderboard;
      if (limitNum > 0) {
        finalLeaderboard = cachedLeaderboard.slice(0, limitNum);
      }
      
      return res.json({
        leaderboard: finalLeaderboard,
        session: cache.session,
        targetTeam: targetTeamData,
        totalTeams: cachedLeaderboard.length
      });
    }

    // Fallback: Re-hydrate from Database if cache was flushed
    await dbConnect();
    const [teams, session] = await Promise.all([
      Team.find({ quizCode, isActive: true, isDisqualified: { $ne: true } })
        .select('teamId teamName teamNumber players scores answeredQuestions')
        .lean(),
      getQuiz(quizCode),
    ]);

    if (!session) {
      return res.json({ leaderboard: [], targetTeam: null, totalTeams: 0 });
    }

    const roundKey = `round${session.currentRound || 1}`;
    const teamsWithStats = teams.map(team => {
      team.scores.total = 
        (team.scores.round1 || 0) + 
        (team.scores.round2 || 0) + 
        (team.scores.round3 || 0) + 
        (team.scores.round4 || 0) + 
        (team.scores.round5 || 0) + 
        (team.scores.bonusPoints || 0);
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
      ['round1', 'round2', 'round3', 'round4', 'round5'].forEach(r => {
        const answers = team.answeredQuestions[r] || [];
        for (const ans of answers) {
          const t = new Date(ans.answeredAt).getTime();
          if (!lastAnswerTime || t > lastAnswerTime) lastAnswerTime = t;
        }
      });

      const answeredCount = {};
      ['round1', 'round2', 'round3', 'round4', 'round5'].forEach(r => {
        answeredCount[r] = team.answeredQuestions[r]?.length || 0;
      });

      return {
        rank: index + 1,
        teamId: team.teamId,
        teamName: team.teamName,
        teamNumber: team.teamNumber,
        players: team.players.map(p => p.name),
        scores: team.scores,
        lastAnswerTime,
        answeredCount,
      };
    });

    let targetTeamData = null;
    if (targetTeamId) {
      targetTeamData = leaderboard.find(t => t.teamId === targetTeamId);
    }

    let finalLeaderboard = leaderboard;
    if (limitNum > 0) {
      finalLeaderboard = leaderboard.slice(0, limitNum);
    }

    return res.json({ 
      leaderboard: finalLeaderboard, 
      session,
      targetTeam: targetTeamData,
      totalTeams: leaderboard.length 
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/leaderboard/questions
app.get('/api/leaderboard/questions', async (req, res) => {
  try {
    await dbConnect();
    const { quizCode } = req.query;
    if (!quizCode) return res.status(400).json({ error: 'quizCode is required' });

    const session = await getQuiz(quizCode);
    if (!session) {
      return res.json({ questions: [] });
    }

    // Determine highest completed round
    let maxCompletedRound = 0;
    if (session.status === 'finished') {
      maxCompletedRound = session.settings.rounds.length;
    } else {
      // If round is ended or active, previous rounds are completed
      maxCompletedRound = Math.max(0, session.currentRound - 1);
      if (session.status === 'ready' && session.currentRound > 0) {
        maxCompletedRound = session.currentRound;
      }
    }

    if (maxCompletedRound === 0) {
      return res.json({ questions: [] });
    }

    const questions = await Question.find({ quizCode, isActive: true, round: { $lte: maxCompletedRound } })
      .sort({ round: 1, questionNumber: 1 })
      .lean();

    const safeQuestions = questions.map(q => ({
      _id: q._id,
      round: q.round,
      questionNumber: q.questionNumber,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      emojiClue: q.emojiClue || '',
      matchData: q.matchPairs ? {
        left: q.matchPairs.map(p => p.left),
        right: q.matchPairs.map(p => p.right),
      } : null,
      type: q.type || 'mcq'
    }));

    return res.json({ questions: safeQuestions });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// 6. QUESTION MANAGER (Admin CRUD + Import)
// ==========================================

// GET /api/questions - fetch all questions for a quiz
app.get('/api/questions', async (req, res) => {
  try {
    await dbConnect();
    const { quizCode, round } = req.query;
    if (!quizCode) return res.status(400).json({ error: 'quizCode required' });
    
    const filter = { quizCode, isActive: true };
    if (round) filter.round = parseInt(round);
    
    const questions = await Question.find(filter).sort({ round: 1, questionNumber: 1 }).lean();
    return res.json({ questions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/questions - add custom question
app.post('/api/questions', adminAuth, async (req, res) => {
  try {
    await dbConnect();
    const body = req.body;
    const { quizCode, round } = body;

    if (!body.questionNumber) {
      const lastQ = await Question.findOne({ quizCode, round }).sort({ questionNumber: -1 });
      body.questionNumber = lastQ ? lastQ.questionNumber + 1 : 1;
    }
    const question = await Question.create(body);
    invalidateQuestionCache(quizCode);
    return res.status(201).json({ question });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/questions - edit question
app.put('/api/questions', adminAuth, async (req, res) => {
  try {
    await dbConnect();
    const { _id, ...update } = req.body;
    const question = await Question.findByIdAndUpdate(_id, update, { new: true });
    if (question) invalidateQuestionCache(question.quizCode);
    return res.json({ question });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/questions - delete question
app.delete('/api/questions', adminAuth, async (req, res) => {
  try {
    await dbConnect();
    const { id, quizCode } = req.query;
    await Question.findOneAndDelete({ _id: id, quizCode });
    invalidateQuestionCache(quizCode);
    return res.json({ message: 'Question deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/questions - fetch questions with password
app.get('/api/admin/questions', adminAuth, async (req, res) => {
  try {
    await dbConnect();
    const { round, quizCode } = req.query;
    const filter = { quizCode, isActive: true };
    if (round) filter.round = parseInt(round);

    const questions = await Question.find(filter)
      .sort({ round: 1, questionNumber: 1 })
      .lean();

    return res.json({ questions });
  } catch (error) {
    console.error('Admin questions error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/questions/import - bulk import from docx, JSON, or CSV
app.post('/api/questions/import', upload.single('file'), adminAuth, async (req, res) => {
  try {
    await dbConnect();
    const { quizCode } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let questions = [];
    const filename = file.originalname.toLowerCase();

    if (filename.endsWith('.json')) {
      const raw = file.buffer.toString('utf-8');
      questions = JSON.parse(raw);
    } else if (filename.endsWith('.csv')) {
      const raw = file.buffer.toString('utf-8');
      questions = parseCsvQuestions(raw);
    } else if (filename.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      questions = parseDocxQuestions(result.value);
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload DOCX, CSV, or JSON.' });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'No valid questions found in file.' });
    }

    const existingCount = await Question.countDocuments({ quizCode });
    const formattedQuestions = questions.map((q, idx) => ({
      ...q,
      quizCode,
      questionNumber: existingCount + idx + 1,
      isActive: true
    }));

    await Question.insertMany(formattedQuestions);
    invalidateQuestionCache(quizCode);

    return res.json({ 
      message: `Successfully imported ${formattedQuestions.length} questions`,
      count: formattedQuestions.length
    });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ error: 'Internal server error during import' });
  }
});

// Helper: parse CSV questions
function parseCsvQuestions(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length <= 1) return [];

  // simple csv parser
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const questions = [];

  for (let i = 1; i < lines.length; i++) {
    // Regex to split csv keeping quoted values intact
    const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    const cleanRow = row.map(val => val.replace(/^"|"$/g, '').trim());
    
    const qObj = {
      round: 1,
      question: '',
      options: [],
      correctAnswer: '',
      explanation: '',
      emojiClue: '',
      basePoints: 10,
      type: 'mcq'
    };

    headers.forEach((header, idx) => {
      const val = cleanRow[idx] || '';
      if (header === 'round') qObj.round = parseInt(val) || 1;
      else if (header === 'question') qObj.question = val;
      else if (header === 'correctanswer') qObj.correctAnswer = val;
      else if (header === 'explanation') qObj.explanation = val;
      else if (header === 'emojiclue') qObj.emojiClue = val;
      else if (header === 'basepoints') qObj.basePoints = parseInt(val) || 10;
      else if (header === 'type') qObj.type = val;
      else if (['optiona', 'optionb', 'optionc', 'optiond', 'options'].includes(header)) {
        if (header === 'options') {
          qObj.options = val.split(';').map(o => o.trim());
        } else {
          qObj.options.push(val);
        }
      }
    });

    if (qObj.question) {
      questions.push(qObj);
    }
  }
  return questions;
}

// Helper: parse DOCX questions
function parseDocxQuestions(text) {
  const questions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentRound = 1;
  let currentQuestion = null;

  for (let line of lines) {
    const roundMatch = line.match(/(?:Round|Phase)\s*(\d+)/i);
    if (roundMatch) {
      currentRound = parseInt(roundMatch[1]);
      continue;
    }

    const qMatch = line.match(/^(?:Q|Question):\s*(.*)/i);
    if (qMatch) {
      if (currentQuestion) questions.push(currentQuestion);
      currentQuestion = {
        round: currentRound,
        question: qMatch[1],
        options: [],
        correctAnswer: '',
        explanation: '',
        emojiClue: '',
        basePoints: currentRound === 2 ? 15 : 10,
        type: currentRound === 2 ? 'emoji' : 'mcq'
      };
      continue;
    }

    if (!currentQuestion) continue;

    const optMatch = line.match(/^[A-D]:\s*(.*)/i);
    if (optMatch) {
      currentQuestion.options.push(optMatch[1]);
      continue;
    }

    const emojiMatch = line.match(/^Emoji:\s*(.*)/i);
    if (emojiMatch) {
      currentQuestion.emojiClue = emojiMatch[1];
      currentQuestion.type = 'emoji';
      continue;
    }

    const correctMatch = line.match(/^Correct:\s*(.*)/i);
    if (correctMatch) {
      const val = correctMatch[1].trim();
      if (val.length === 1 && ['A', 'B', 'C', 'D'].includes(val.toUpperCase())) {
        const idx = ['A', 'B', 'C', 'D'].indexOf(val.toUpperCase());
        currentQuestion.correctAnswer = currentQuestion.options[idx] || val;
      } else {
        currentQuestion.correctAnswer = val;
      }
      continue;
    }

    const expMatch = line.match(/^Explanation:\s*(.*)/i);
    if (expMatch) {
      currentQuestion.explanation = expMatch[1];
      continue;
    }

    // Fact state (Round 3)
    const factMatch = line.match(/^Fact:\s*(Real|Fake|True|False)/i);
    if (factMatch) {
      currentQuestion.actualFact = factMatch[1];
      currentQuestion.correctAnswer = factMatch[1];
      currentQuestion.type = 'truefalse';
      continue;
    }
  }

  if (currentQuestion) questions.push(currentQuestion);
  return questions;
}

// ==========================================
// 7. DEVELOPER SEEDING & DIAGNOSTICS
// ==========================================

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// POST /api/admin/seed - Seed sample quiz
app.post('/api/admin/seed', adminAuth, async (req, res) => {
  try {
    await dbConnect();
    const quizCode = 'MAIN';

    // Clear existing
    await Quiz.deleteMany({ quizCode });
    await Question.deleteMany({ quizCode });
    await Team.deleteMany({ quizCode });

    const organizerPassword = await bcrypt.hash('admin123', 10);

    // Create main dev quiz
    await Quiz.create({
      quizCode,
      quizName: 'Decode The Tech Monolith',
      description: 'Default sample quiz for development and testing',
      organizerPassword,
      status: 'ready',
      settings: {
        playersPerTeam: 3,
        allowLateJoin: true,
        shuffleQuestions: true,
        rounds: [
          { roundNumber: 1, roundName: 'Tech Trivia', questionType: 'mcq', questionCount: 3, timeLimitSeconds: 600, basePoints: 10 },
          { roundNumber: 2, roundName: 'Emoji Guessing', questionType: 'emoji', questionCount: 2, timeLimitSeconds: 600, basePoints: 15 },
          { roundNumber: 3, roundName: 'True or False Fact', questionType: 'truefalse', questionCount: 2, timeLimitSeconds: 600, basePoints: 10 }
        ]
      }
    });

    const sampleQuestions = [
      { quizCode, round: 1, questionNumber: 1, type: 'mcq', question: 'Primary component of a computer that controls hardware?', options: ['RAM', 'CPU', 'ROM', 'SSD'], correctAnswer: 'CPU', basePoints: 10, isActive: true },
      { quizCode, round: 1, questionNumber: 2, type: 'mcq', question: 'Styling language used for layouts?', options: ['HTML', 'PHP', 'CSS', 'JS'], correctAnswer: 'CSS', basePoints: 10, isActive: true },
      { quizCode, round: 1, questionNumber: 3, type: 'match', question: 'Match internet concepts', matchPairs: [{ left: 'DNS', right: 'IP Map' }, { left: 'HTTP', right: 'Web Transfer' }, { left: 'URL', right: 'Address' }], correctAnswer: '', basePoints: 10, isActive: true },
      
      { quizCode, round: 2, questionNumber: 1, type: 'emoji', question: 'Identify the app from these emojis', emojiClue: '🐋 📦 🚢', options: ['Kubernetes', 'Docker', 'Jenkins', 'AWS'], correctAnswer: 'Docker', basePoints: 15, isActive: true },
      { quizCode, round: 2, questionNumber: 2, type: 'emoji', question: 'Identify the language from these emojis', emojiClue: '🦀 🛡️ ⚙️', options: ['Go', 'Python', 'Rust', 'Ruby'], correctAnswer: 'Rust', basePoints: 15, isActive: true },
      
      { quizCode, round: 3, questionNumber: 1, type: 'truefalse', question: 'Python was released before Java.', options: ['True', 'False'], correctAnswer: 'True', basePoints: 10, hasReverseLogic: false, isActive: true },
      { quizCode, round: 3, questionNumber: 2, type: 'truefalse', question: 'Google uses actual goats for lawn mowing.', options: ['True', 'False'], correctAnswer: 'True', basePoints: 10, hasReverseLogic: true, explanation: 'Google rents goats to mow the lawns at their Mountain View headquarters!', isActive: true }
    ];

    await Question.insertMany(sampleQuestions);
    invalidateQuestionCache(quizCode);
    invalidateSessionCache(quizCode);

    return res.json({ message: 'Database seeded successfully for quiz MAIN. Pass is admin123.' });
  } catch (error) {
    console.error('Seeding error:', error);
    return res.status(500).json({ error: 'Failed to seed database' });
  }
});

// Auto-cleanup job: Deletes expired quizzes older than 7 days
setInterval(async () => {
  try {
    await dbConnect();
    const now = new Date();
    
    // Find all expired quizzes
    const expiredQuizzes = await Quiz.find({ expiresAt: { $lte: now } }).select('quizCode');
    const expiredCodes = expiredQuizzes.map(q => q.quizCode);
    
    if (expiredCodes.length > 0) {
      console.log(`Cleaning up expired quizzes: ${expiredCodes.join(', ')}`);
      await Quiz.deleteMany({ quizCode: { $in: expiredCodes } });
      await Question.deleteMany({ quizCode: { $in: expiredCodes } });
      await Team.deleteMany({ quizCode: { $in: expiredCodes } });
      expiredCodes.forEach(code => invalidateSessionCache(code));
    }
  } catch (err) {
    console.error('Auto-cleanup error:', err);
  }
}, 24 * 60 * 60 * 1000); // Check once every 24 hours

httpServer.listen(port, async (err) => {
  if (err) throw err;
  console.log(`> Backend ready on http://localhost:${port}`);
  try {
    await dbConnect();
    console.log('> Database connected successfully');
  } catch (e) {
    console.error('> Database connection failed:', e);
  }
});
