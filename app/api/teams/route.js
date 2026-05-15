export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import Question from '@/lib/models/Question';

// GET /api/teams - list all teams
export async function GET() {
  await dbConnect();
  const teams = await Team.find({}).sort({ teamNumber: 1 }).lean();
  return NextResponse.json({ teams });
}

// POST /api/teams - create a new team
export async function POST(req) {
  await dbConnect();
  const body = await req.json();

  // Admin password check only for bulk imports
  if (Array.isArray(body)) {
    const adminPass = req.headers.get('x-admin-password');
    if (adminPass !== (process.env.ADMIN_PASSWORD || 's1ddhant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Helper function to create a single team object
  async function prepareTeam(teamData, indexOffset = 0) {
    const { teamName, teamNumber, players } = teamData;

    // Find the highest existing teamNumber so we never collide with existing IDs
    const maxDoc = await Team.findOne({}).sort({ teamNumber: -1 }).select('teamNumber').lean();
    const baseNum = maxDoc ? maxDoc.teamNumber : 0;
    let tNum = teamNumber || (baseNum + indexOffset + 1);

    // Safety: keep incrementing until the ID is free
    let teamId = `team-${String(tNum).padStart(3, '0')}`;
    let attempts = 0;
    while (await Team.findOne({ teamId }).lean()) {
      tNum += 1;
      teamId = `team-${String(tNum).padStart(3, '0')}`;
      if (++attempts > 100) break; // guard against infinite loop
    }

    // Fetch questions for shuffling (doing this once outside for bulk)
    return {
      teamId,
      teamName,
      teamNumber: tNum,
      players: players.map((p, idx) => ({ name: p, playerNumber: idx + 1 })),
      currentRound: 0,
      currentPlayerIndex: 0,
      scores: { round1: 0, round2: 0, round3: 0, total: 0, bonusPoints: 0 },
      answeredQuestions: { round1: [], round2: [], round3: [] },
    };
  }

  // Generate shuffled question orders for all rounds
  const q1 = await Question.find({ round: 1, isActive: true }).lean();
  const q2 = await Question.find({ round: 2, isActive: true }).lean();
  const q3 = await Question.find({ round: 3, isActive: true }).lean();

  const shuffleIndices = (arr) => {
    const indices = arr.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  };

  const commonData = {
    questionOrder: {
      round1: shuffleIndices(q1),
      round2: shuffleIndices(q2),
      round3: shuffleIndices(q3),
    }
  };

  if (Array.isArray(body)) {
    const teamsToCreate = [];
    for (let i = 0; i < body.length; i++) {
      const { teamName } = body[i];
      const existing = await Team.findOne({ teamName }).lean();
      if (existing) continue; // Skip duplicates in bulk

      const t = await prepareTeam(body[i], i);
      if (t) {
        teamsToCreate.push({ ...t, ...commonData });
      }
    }
    if (teamsToCreate.length === 0) {
      return NextResponse.json({ error: 'No new teams to create (all names already taken)' }, { status: 409 });
    }
    const created = await Team.insertMany(teamsToCreate);
    return NextResponse.json({ teams: created }, { status: 201 });
  } else {
    const { teamName } = body;
    const existing = await Team.findOne({ teamName }).lean();
    if (existing) {
      return NextResponse.json({ error: 'team name already taken' }, { status: 400 });
    }
    const t = await prepareTeam(body);
    const team = await Team.create({ ...t, ...commonData });
    return NextResponse.json({ team }, { status: 201 });
  }
}

// DELETE /api/teams - delete all teams (admin reset)
export async function DELETE(req) {
  await dbConnect();

  // Admin password check
  const adminPass = req.headers.get('x-admin-password');
  if (adminPass !== (process.env.ADMIN_PASSWORD || 's1ddhant')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await Team.deleteMany({});
  return NextResponse.json({ message: 'All teams deleted' });
}
