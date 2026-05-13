export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getGameSession } from '@/lib/sessionCache';

export async function GET() {
  try {
    const session = await getGameSession();
    return NextResponse.json({ session });
  } catch (error) {
    console.error("Game Status API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
