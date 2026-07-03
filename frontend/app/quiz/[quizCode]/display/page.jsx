'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSocket } from '@/lib/socket';

const TICK_INTERVAL = 3000;

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-3xl">🥇</span>;
  if (rank === 2) return <span className="text-3xl">🥈</span>;
  if (rank === 3) return <span className="text-3xl">🥉</span>;
  return (
    <span className="font-display font-black text-2xl text-white/20 w-10 text-center inline-block">
      #{rank}
    </span>
  );
}

function ScoreBar({ value, max, color = '#00f5ff' }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  );
}

export default function DisplayPage() {
  const params = useParams();
  const quizCode = params?.quizCode;
  const [leaderboard, setLeaderboard] = useState([]);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tick, setTick] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState('leaderboard'); // leaderboard | top3 | stats
  const timerRef = useRef(null);
  const modeRef = useRef(null);

  useEffect(() => {
    // Initial fallback fetch
    loadData();

    const socket = getSocket();
    
    socket.on('connect', () => {
      socket.emit('join_display', quizCode);
    });

    const onSessionUpdate = (newSession) => setSession(newSession);
    const onLeaderboardUpdate = (newLeaderboard) => setLeaderboard(newLeaderboard);

    socket.on('session_update', onSessionUpdate);
    socket.on('leaderboard_update', onLeaderboardUpdate);

    return () => {
      socket.off('session_update', onSessionUpdate);
      socket.off('leaderboard_update', onLeaderboardUpdate);
    };
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (!session?.roundEndTime) return;
    const tick = () => setTimeLeft(Math.max(0, Math.floor((new Date(session.roundEndTime) - Date.now()) / 1000)));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.roundEndTime]);

  // Auto-rotate display mode every 15s if multiple modes
  useEffect(() => {
    modeRef.current = setInterval(() => {
      setDisplayMode(prev =>
        prev === 'leaderboard' ? 'top3' : prev === 'top3' ? 'stats' : 'leaderboard'
      );
    }, 15000);
    return () => clearInterval(modeRef.current);
  }, []);

  async function loadData() {
    try {
      const [lRes, sRes] = await Promise.all([
        fetch(`/api/leaderboard?quizCode=${quizCode}`),
        fetch(`/api/game/status?quizCode=${quizCode}`),
      ]);
      setLeaderboard((await lRes.json()).leaderboard || []);
      setSession((await sRes.json()).session);
      setTick(t => t + 1);
    } catch {}
  }

  function enterFullscreen() {
    document.documentElement.requestFullscreen?.();
    setIsFullscreen(true);
  }

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const isLive = session?.status === 'active' || session?.status?.includes('_active');
  const currentRound = session?.currentRound || 0;
  const maxScore = leaderboard[0]?.scores.total || 1;
  const top10 = leaderboard.slice(0, 10);
  const top3 = leaderboard.slice(0, 3);

  const statusLabel = session?.status === 'active'
    ? `🟢 ROUND ${currentRound} LIVE`
    : session?.status === 'ready' && currentRound > 0
    ? `🟡 ROUND ${currentRound} ENDED`
    : {
        waiting: '⏳ WAITING TO START',
        ready: '⏳ WAITING TO START',
        finished: '🏁 GAME OVER',
      }[session?.status] || '...';

  return (
    <div className="min-h-screen cyber-grid flex flex-col bg-dark-900 overflow-hidden" style={{ fontFamily: 'var(--font-display)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="font-display font-black text-2xl neon-text-cyan tracking-widest">
            {session?.quizName ? `<${session.quizName.toUpperCase().replace(/ /g, ".")}/>` : "<QUIZ.PLATFORM/>"}
          </div>
          <div className="font-mono text-xs text-white/30 border border-white/10 px-3 py-1">
            {statusLabel}
          </div>
        </div>

        {/* Live timer */}
        {isLive && (
          <div className="text-center">
            <div className={`font-display font-black text-5xl ${timeLeft <= 60 ? 'text-red-400 animate-pulse' : 'neon-text-green'}`}>
              {fmtTime(timeLeft)}
            </div>
            <div className="font-mono text-xs text-white/30 tracking-widest">ROUND {currentRound} TIME</div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex border border-white/10 overflow-hidden">
            {['leaderboard', 'top3', 'stats'].map(mode => (
              <button key={mode} onClick={() => setDisplayMode(mode)}
                className={`font-mono text-xs px-4 py-2 transition-colors ${displayMode === mode ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-white/30 hover:text-white'}`}>
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          {!isFullscreen && (
            <button onClick={enterFullscreen} className="btn-neon text-xs px-4 py-2">⛶ FULLSCREEN</button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-8 py-6 overflow-hidden">

        {/* ─── LEADERBOARD MODE ─── */}
        {displayMode === 'leaderboard' && (
          <div className="h-full flex flex-col">
            <div className="font-display font-bold text-white/20 text-sm tracking-[0.3em] mb-4 text-center">
              LIVE LEADERBOARD — {leaderboard.length} TEAMS
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-4 px-6 py-2 font-mono text-sm text-white/20 tracking-widest border-b border-white/5 mb-2">
              <div className="col-span-1">#</div>
              <div className="col-span-4">TEAM</div>
              <div className="col-span-4">SCORE</div>
              <div className="col-span-1 text-right">R1</div>
              <div className="col-span-1 text-right">R2</div>
              <div className="col-span-1 text-right">R3</div>
            </div>

            <div className="flex-1 space-y-2 overflow-hidden">
              {top10.map((team, i) => {
                const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                const barColor = i < 3 ? rankColors[i] : '#00f5ff';
                return (
                  <div key={team.teamId}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 border items-center transition-all duration-500 ${
                      i === 0 ? 'border-yellow-400/40 bg-yellow-400/5 shadow-[0_0_20px_rgba(255,215,0,0.1)]' :
                      i === 1 ? 'border-gray-400/20 bg-white/2' :
                      i === 2 ? 'border-orange-700/20' :
                      'border-white/5'
                    }`}>
                    <div className="col-span-1"><RankBadge rank={i + 1} /></div>
                    <div className="col-span-4">
                      <div className={`font-display font-black text-xl ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-white'}`}>
                        {team.teamName}
                      </div>
                      <div className="font-mono text-xs text-white/30 mt-0.5">{team.players.join(' · ')}</div>
                    </div>
                    <div className="col-span-4 flex items-center gap-3">
                      <ScoreBar value={team.scores.total} max={maxScore} color={barColor} />
                      <div className={`font-display font-black text-3xl w-24 text-right ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'neon-text-cyan'}`}>
                        {team.scores.total}
                      </div>
                    </div>
                    <div className="col-span-1 text-right font-display font-bold text-lg text-neon-cyan/60">{team.scores.round1}</div>
                    <div className="col-span-1 text-right font-display font-bold text-lg text-neon-purple/60">{team.scores.round2}</div>
                    <div className="col-span-1 text-right font-display font-bold text-lg text-neon-green/60">{team.scores.round3}</div>
                  </div>
                );
              })}
            </div>

            {leaderboard.length > 10 && (
              <div className="text-center font-mono text-xs text-white/20 mt-3 tracking-widest">
                + {leaderboard.length - 10} more teams · Visit /leaderboard for full list
              </div>
            )}
          </div>
        )}

        {/* ─── TOP 3 SPOTLIGHT MODE ─── */}
        {displayMode === 'top3' && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="font-display font-bold text-white/20 text-sm tracking-[0.3em] mb-12 text-center">
              TOP PERFORMERS — ROUND {currentRound}
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center gap-8 mb-12">
              {/* 2nd */}
              {top3[1] && (
                <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="text-5xl mb-4">🥈</div>
                  <div className="border border-gray-400/30 bg-gray-400/5 w-52 h-48 flex flex-col items-center justify-end p-6">
                    <div className="font-display font-bold text-xl text-white text-center mb-1">{top3[1].teamName}</div>
                    <div className="font-mono text-xs text-white/40 text-center mb-3">{top3[1].players.join(' · ')}</div>
                    <div className="font-display font-black text-4xl text-gray-300">{top3[1].scores.total}</div>
                    <div className="font-mono text-xs text-white/30">POINTS</div>
                  </div>
                </div>
              )}
              {/* 1st */}
              {top3[0] && (
                <div className="flex flex-col items-center animate-bounce-in">
                  <div className="text-7xl mb-4 animate-float">🥇</div>
                  <div className="border-2 border-yellow-400/60 bg-yellow-400/8 shadow-[0_0_60px_rgba(255,215,0,0.3)] w-64 h-64 flex flex-col items-center justify-end p-8">
                    <div className="font-display font-black text-2xl text-white text-center mb-1">{top3[0].teamName}</div>
                    <div className="font-mono text-xs text-white/50 text-center mb-4">{top3[0].players.join(' · ')}</div>
                    <div className="font-display font-black text-6xl text-yellow-400">{top3[0].scores.total}</div>
                    <div className="font-mono text-xs text-yellow-400/60">POINTS</div>
                  </div>
                </div>
              )}
              {/* 3rd */}
              {top3[2] && (
                <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <div className="text-5xl mb-4">🥉</div>
                  <div className="border border-orange-700/30 bg-orange-800/5 w-52 h-36 flex flex-col items-center justify-end p-6">
                    <div className="font-display font-bold text-xl text-white text-center mb-1">{top3[2].teamName}</div>
                    <div className="font-mono text-xs text-white/40 text-center mb-3">{top3[2].players.join(' · ')}</div>
                    <div className="font-display font-black text-4xl text-orange-400">{top3[2].scores.total}</div>
                    <div className="font-mono text-xs text-white/30">POINTS</div>
                  </div>
                </div>
              )}
            </div>

            {/* Ranks 4-6 mini */}
            <div className="flex gap-6">
              {leaderboard.slice(3, 6).map((team, i) => (
                <div key={team.teamId} className="border border-white/10 holo-card px-6 py-3 text-center">
                  <div className="font-mono text-xs text-white/30 mb-1">#{i + 4}</div>
                  <div className="font-display font-bold text-base text-white">{team.teamName}</div>
                  <div className="font-display font-black text-xl neon-text-cyan">{team.scores.total}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STATS MODE ─── */}
        {displayMode === 'stats' && (
          <div className="h-full flex flex-col items-center justify-center gap-8">
            <div className="font-display font-bold text-white/20 text-sm tracking-[0.3em]">GAME STATISTICS</div>

            <div className="grid grid-cols-2 gap-6 max-w-3xl w-full">
              {[
                { label: 'TOTAL TEAMS', value: leaderboard.length, color: 'cyan', icon: '👥' },
                { label: 'CURRENT ROUND', value: `${currentRound} / 3`, color: 'purple', icon: '🎯' },
                { label: 'HIGHEST SCORE', value: leaderboard[0]?.scores.total || 0, color: 'yellow', icon: '🏆' },
                { label: 'AVG TEAM SCORE', value: leaderboard.length ? Math.round(leaderboard.reduce((s, t) => s + t.scores.total, 0) / leaderboard.length) : 0, color: 'green', icon: '📊' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className={`neon-box-${color} holo-card p-8 text-center`}>
                  <div className="text-4xl mb-3">{icon}</div>
                  <div className={`font-display font-black text-5xl neon-text-${color} mb-2`}>{value}</div>
                  <div className="font-mono text-sm text-white/30 tracking-widest">{label}</div>
                </div>
              ))}
            </div>

            {/* Round breakdown */}
            <div className="grid grid-cols-3 gap-6 max-w-3xl w-full">
              {[
                { r: 1, label: 'Tech Word Decoder', color: 'cyan' },
                { r: 2, label: 'Guess The Tech', color: 'purple' },
                { r: 3, label: 'Real or Fake?', color: 'green' },
              ].map(({ r, label, color }) => {
                const avg = leaderboard.length ? Math.round(leaderboard.reduce((s, t) => s + (t.scores[`round${r}`] || 0), 0) / leaderboard.length) : 0;
                const max = Math.max(...leaderboard.map(t => t.scores[`round${r}`] || 0));
                return (
                  <div key={r} className={`border border-${color === 'cyan' ? 'neon-cyan' : color === 'purple' ? 'neon-purple' : 'neon-green'}/20 holo-card p-5 text-center`}>
                    <div className={`font-mono text-xs tracking-widest mb-2 ${color === 'cyan' ? 'text-neon-cyan' : color === 'purple' ? 'text-neon-purple' : 'text-neon-green'}`}>ROUND {r}</div>
                    <div className="font-display font-bold text-sm text-white mb-3">{label}</div>
                    <div className="flex justify-between text-sm">
                      <div><div className="font-display font-black text-xl text-white">{avg}</div><div className="font-mono text-xs text-white/30">AVG</div></div>
                      <div><div className="font-display font-black text-xl text-white">{max}</div><div className="font-mono text-xs text-white/30">MAX</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 px-8 py-3 flex items-center justify-between">
        <div className="font-mono text-xs text-white/20">
          Sync active via WebSockets · Last update: {new Date().toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-6">
          <span className="font-mono text-xs text-white/20">LEADERBOARD · TOP 3 · STATS</span>
          <Link href={`/quiz/${quizCode}/leaderboard`} target="_blank" className="font-mono text-xs text-neon-cyan/40 hover:text-neon-cyan transition-colors">
            /leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
