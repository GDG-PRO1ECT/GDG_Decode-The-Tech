import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ params }) {
  const { quizCode } = params;
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  try {
    const [sRes, tRes, lRes] = await Promise.all([
      fetch(`${baseUrl}/api/game/status?quizCode=${quizCode}`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/teams?quizCode=${quizCode}`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/leaderboard?quizCode=${quizCode}`, { cache: 'no-store' })
    ]);

    if (!sRes.ok) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center font-body">
            <h1 className="text-4xl font-bold text-red-500 mb-4 font-display">404 - Quiz Not Found</h1>
            <p>The quiz code {quizCode} does not exist.</p>
          </div>
        </div>
      );
    }

    const { session } = await sRes.json();
    const { teams } = await tRes.json();
    const { leaderboard } = await lRes.json();

    if (!session) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center font-body">
            <h1 className="text-4xl font-bold text-red-500 mb-4 font-display">404 - Quiz Not Found</h1>
            <p>The quiz code {quizCode} does not exist.</p>
          </div>
        </div>
      );
    }

    return (
      <AdminClient 
        quizCode={quizCode}
        initialSession={session} 
        initialTeams={teams || []} 
        initialLeaderboard={leaderboard || []} 
      />
    );
  } catch (err) {
    console.error(err);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center font-body">
          <h1 className="text-4xl font-bold text-red-500 mb-4 font-display">Connection Error</h1>
          <p>Failed to connect to the backend server.</p>
        </div>
      </div>
    );
  }
}
