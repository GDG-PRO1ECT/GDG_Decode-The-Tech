import dbConnect from './mongodb';
import GameSession from './models/GameSession';

let cachedSession = null;
let lastFetch = 0;
const CACHE_TTL = 1000; // 1 second cache for game status

export async function getGameSession() {
  const now = Date.now();
  
  if (cachedSession && (now - lastFetch < CACHE_TTL)) {
    return cachedSession;
  }

  await dbConnect();
  let session = await GameSession.findOne({ sessionId: 'main' }).lean();
  
  if (!session) {
    session = await GameSession.create({
      sessionId: 'main',
      status: 'waiting',
      currentRound: 0,
    });
    session = session.toObject();
  }

  // Auto-halt logic (moved here for centralization)
  if (session.status.includes('_active') && !session.isPaused && session.roundEndTime) {
    const sessionNow = new Date();
    if (sessionNow >= new Date(session.roundEndTime)) {
      const match = session.status.match(/round(\d+)_active/);
      if (match) {
        const newStatus = `round${match[1]}_ended`;
        await GameSession.updateOne({ sessionId: 'main' }, { $set: { status: newStatus } });
        session.status = newStatus;
      }
    }
  }

  cachedSession = session;
  lastFetch = now;
  return session;
}

export function invalidateSessionCache() {
  cachedSession = null;
  lastFetch = 0;
}
