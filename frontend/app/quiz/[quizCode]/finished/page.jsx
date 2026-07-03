'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const CONFETTI_COLORS = ['#00f5ff', '#bf00ff', '#00ff88', '#ffee00', '#ff6600'];

function Firework({ x, y, color }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 6px ${color}`,
            transform: `rotate(${i * 45}deg) translateY(-${20 + Math.random() * 30}px)`,
            animation: `fade 1s ${Math.random() * 0.5}s ease-out forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default function FinishedPage() {
  const params = useParams();
  const quizCode = params?.quizCode;
  const [leaderboard, setLeaderboard] = useState([]);
  const [fireworks, setFireworks] = useState([]);

  useEffect(() => {
    fetch('/api/leaderboard?quizCode=${quizCode}').then(r => r.json()).then(d => setLeaderboard(d.leaderboard || []));
    // Generate random fireworks
    const fws = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: `${10 + Math.random() * 80}%`,
      y: `${5 + Math.random() * 60}%`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }));
    setFireworks(fws);
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const winner = leaderboard[0];

  return (
    <div className="min-h-screen cyber-grid relative overflow-hidden flex flex-col items-center justify-center p-6">
      <style>{`
        @keyframes fade { 0% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(-40px) scale(1); } 100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-80px) scale(0); } }
        @keyframes float-up { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; } }
      `}</style>

      {/* Fireworks */}
      {fireworks.map(fw => <Firework key={fw.id} {...fw} />)}

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {CONFETTI_COLORS.flatMap((c, ci) =>
          Array.from({ length: 6 }, (_, i) => (
            <div
              key={`${ci}-${i}`}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                background: c,
                left: `${Math.random() * 100}%`,
                top: '110%',
                animation: `float-up ${2 + Math.random() * 3}s ${Math.random() * 2}s linear infinite`,
                opacity: 0.7,
              }}
            />
          ))
        )}
      </div>

      <div className="relative z-10 text-center max-w-4xl w-full">
        {/* Title */}
        <div className="text-6xl mb-4 animate-bounce">🏆</div>
        <h1 className="font-display font-black text-5xl text-white mb-2 tracking-widest">GAME OVER</h1>
        <div className="font-display text-xl neon-text-yellow mb-12 tracking-[0.3em]">QUIZ PLATFORM</div>

        {/* Winner spotlight */}
        {winner && (
          <div className="neon-box-yellow holo-card p-8 mb-8 inline-block shadow-[0_0_60px_rgba(255,238,0,0.3)]">
            <div className="font-mono text-xs text-neon-yellow/60 tracking-widest mb-2">🥇 CHAMPION</div>
            <div className="font-display font-black text-4xl text-white mb-2">{winner.teamName}</div>
            <div className="font-mono text-sm text-white/50 mb-4">{winner.players.join(' · ')}</div>
            <div className="font-display font-black text-6xl neon-text-yellow">{winner.scores.total}</div>
            <div className="font-mono text-xs text-white/30 mt-1">POINTS</div>
          </div>
        )}

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 mb-8">
          {[
            top3[1] && { ...top3[1], rank: 2, h: 'h-28', emoji: '🥈', color: 'gray-400' },
            top3[0] && { ...top3[0], rank: 1, h: 'h-40', emoji: '🥇', color: 'yellow-400' },
            top3[2] && { ...top3[2], rank: 3, h: 'h-20', emoji: '🥉', color: 'orange-500' },
          ].filter(Boolean).map(team => (
            <div key={team.teamId} className="flex flex-col items-center">
              <div className="text-3xl mb-1">{team.emoji}</div>
              <div className={`bg-white/5 border border-white/10 w-36 ${team.h} flex flex-col items-center justify-end p-3`}>
                <div className="font-display font-bold text-sm text-white text-center truncate w-full">{team.teamName}</div>
                <div className={`font-display font-black text-xl text-${team.color}`}>{team.scores.total}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Full results */}
        <div className="holo-card border border-white/5 p-6 text-left mb-8">
          <div className="font-display font-bold text-white/40 text-xs tracking-widest mb-4">FINAL STANDINGS</div>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((team, i) => (
              <div key={team.teamId} className="flex items-center gap-4">
                <span className="font-display font-black text-sm w-8 text-white/30">#{i+1}</span>
                <span className="font-display font-bold text-sm text-white flex-1">{team.teamName}</span>
                <div className="flex gap-4 text-right">
                  <span className="font-mono text-xs text-neon-cyan w-10">{team.scores.round1}</span>
                  <span className="font-mono text-xs text-neon-purple w-10">{team.scores.round2}</span>
                  <span className="font-mono text-xs text-neon-green w-10">{team.scores.round3}</span>
                  <span className="font-display font-black text-sm text-white w-14 text-right">{team.scores.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href={`/quiz/${quizCode}/leaderboard`} className="btn-neon btn-neon-cyan px-8 py-3 font-display font-bold tracking-widest">
            FULL LEADERBOARD →
          </Link>
          <Link href="/admin/leaderboard" className="btn-neon px-8 py-3 font-display font-bold tracking-widest">
            📥 EXPORT RESULTS
          </Link>
          <Link href="/" className="btn-neon px-8 py-3 font-display font-bold tracking-widest opacity-50">
            ← HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
