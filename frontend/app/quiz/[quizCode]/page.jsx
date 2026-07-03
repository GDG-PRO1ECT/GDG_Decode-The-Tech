import QuizClient from './QuizClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function QuizLandingPage({ params }) {
  const { quizCode } = params;
  
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${baseUrl}/api/game/status?quizCode=${quizCode}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.session) {
      notFound();
    }
    return <QuizClient quizName={data.session.quizName} />;
  } catch (err) {
    console.error(err);
    notFound();
  }
}
