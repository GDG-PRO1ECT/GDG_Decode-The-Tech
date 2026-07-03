import TeamClient from './TeamClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TeamPage({ params }) {
  const { teamId, quizCode } = params;
  
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${baseUrl}/api/teams/${teamId}?quizCode=${quizCode}`, { cache: 'no-store' });
    const data = await res.json();
    
    if (!res.ok || !data.team) {
      notFound();
    }

    return (
      <TeamClient 
        initialTeam={data.team} 
        initialSession={data.session || {}} 
      />
    );
  } catch (err) {
    console.error(err);
    notFound();
  }
}
