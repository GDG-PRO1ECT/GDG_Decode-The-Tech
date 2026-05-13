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
  const body = await req.json();
  const team = await Team.findOneAndUpdate(
    { teamId: params.teamId },
    { $set: body },
    { new: true }
  );
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  return NextResponse.json({ team });
}

export async function DELETE(req, { params }) {
  await dbConnect();
  await Team.deleteOne({ teamId: params.teamId });
  return NextResponse.json({ message: 'Team deleted' });
}
