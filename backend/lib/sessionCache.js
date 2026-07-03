import dbConnect from './mongodb.js';
import Quiz from './models/Quiz.js';

let cachedSessions = {};
const CACHE_TTL = 1000; // 1 second cache for game status

export async function getGameSession(quizCode) {
  if (!quizCode) return null;
  const now = Date.now();
  
  const cacheEntry = cachedSessions[quizCode];
  if (cacheEntry && (now - cacheEntry.lastFetch < CACHE_TTL)) {
    return cacheEntry.session;
  }

  await dbConnect();
  let session = await Quiz.findOne({ quizCode }).lean();
  
  if (!session) {
    return null;
  }

  // Auto-halt logic
  if (session.status === 'active' && !session.isPaused && session.roundEndTime) {
    const sessionNow = new Date();
    if (sessionNow >= new Date(session.roundEndTime)) {
      const newStatus = `ready`;
      await Quiz.updateOne({ quizCode }, { $set: { status: newStatus } });
      session.status = newStatus;
    }
  }

  cachedSessions[quizCode] = { session, lastFetch: now };
  return session;
}

export async function getQuiz(quizCode) {
  return getGameSession(quizCode);
}

export function invalidateSessionCache(quizCode) {
  if (quizCode) {
    delete cachedSessions[quizCode];
  } else {
    cachedSessions = {};
  }
}
