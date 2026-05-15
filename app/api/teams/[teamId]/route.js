export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';

import { getGameSession } from '@/lib/sessionCache';

export async function GET(req, { params }) {
  await dbConnect();
  const [team, session] = await Promise.all([
    Team.findOne({ teamId: params.teamId }).lean(),
    getGameSession()
  ]);
  
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  return NextResponse.json({ team, session });
}

export async function PATCH(req, { params }) {
  await dbConnect();
  
  // Admin password check
  const adminPass = req.headers.get('x-admin-password');
  if (adminPass !== (process.env.ADMIN_PASSWORD || 's1ddhant')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  
  // Fetch existing team to calculate new total if scores are being updated
  const existingTeam = await Team.findOne({ teamId: params.teamId });
  if (!existingTeam) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

  // Update fields
  if (body.scores) {
    existingTeam.scores.round1 = body.scores.round1 ?? existingTeam.scores.round1;
    existingTeam.scores.round2 = body.scores.round2 ?? existingTeam.scores.round2;
    existingTeam.scores.round3 = body.scores.round3 ?? existingTeam.scores.round3;
    existingTeam.scores.bonusPoints = body.scores.bonusPoints ?? existingTeam.scores.bonusPoints;
    
    // Recalculate total
    existingTeam.scores.total = 
      (existingTeam.scores.round1 || 0) + 
      (existingTeam.scores.round2 || 0) + 
      (existingTeam.scores.round3 || 0) + 
      (existingTeam.scores.bonusPoints || 0);
  }

  // Handle other fields if necessary
  if (body.teamName) existingTeam.teamName = body.teamName;
  if (body.teamNumber) existingTeam.teamNumber = body.teamNumber;
  if (body.isActive !== undefined) existingTeam.isActive = body.isActive;

  await existingTeam.save();
  return NextResponse.json({ team: existingTeam });
}

export async function DELETE(req, { params }) {
  await dbConnect();
  await Team.deleteOne({ teamId: params.teamId });
  return NextResponse.json({ message: 'Team deleted' });
}
