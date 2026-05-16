'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const STATUS_MAP = {
  waiting: { label: 'AWAITING INIT', color: 'text-gray-500', dot: 'bg-gray-500', border: 'border-gray-500/30' },
  round1_active: { label: 'PHASE 01: LIVE', color: 'text-gdg-blue', dot: 'bg-gdg-blue', border: 'border-gdg-blue/50' },
  round1_ended: { label: 'PHASE 01: HALTED', color: 'text-gray-500', dot: 'bg-gray-500', border: 'border-gray-500/30' },
  round2_active: { label: 'PHASE 02: LIVE', color: 'text-gdg-yellow', dot: 'bg-gdg-yellow', border: 'border-gdg-yellow/50' },
  round2_ended: { label: 'PHASE 02: HALTED', color: 'text-gray-500', dot: 'bg-gray-500', border: 'border-gray-500/30' },
  round3_active: { label: 'PHASE 03: LIVE', color: 'text-gdg-red', dot: 'bg-gdg-red', border: 'border-gdg-red/50' },
  round3_ended: { label: 'PHASE 03: HALTED', color: 'text-gray-500', dot: 'bg-gray-500', border: 'border-gray-500/30' },
  finished: { label: 'SIM COMPLETE', color: 'text-gdg-green', dot: 'bg-gdg-green', border: 'border-gdg-green/50' },
};

export default function GameControlPage() {
  const [session, setSession] = useState(null);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [durations, setDurations] = useState({ 1: 1200, 2: 1200, 3: 1500 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchAll();
    const poll = setInterval(fetchAll, 30000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (!session?.roundEndTime) return;
    const tick = () => {
      if (session.isPaused && session.timeRemainingAtPause != null) {
        setTimeLeft(Math.floor(session.timeRemainingAtPause / 1000));
      } else {
        setTimeLeft(Math.max(0, Math.floor((new Date(session.roundEndTime) - Date.now()) / 1000)));
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.roundEndTime, session?.isPaused, session?.timeRemainingAtPause]);

  async function fetchAll() {
    try {
      const [sRes, tRes, lRes] = await Promise.all([
        fetch('/api/game/status'), fetch('/api/teams'), fetch('/api/leaderboard'),
      ]);
      setSession((await sRes.json()).session);
      setTeams((await tRes.json()).teams || []);
      setLeaderboard((await lRes.json()).leaderboard || []);
    } catch {}
  }

  function showMsg(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 5000);
  }

  async function gameAction(action, round) {
    setLoading(true);
    const adminPass = sessionStorage.getItem('admin_pass') || '';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPass },
        body: JSON.stringify({ action, round, duration: round ? durations[round] : undefined }),
      });
      const data = await res.json();
      if (!res.ok) showMsg(data.error || 'ERR', 'error');
      else { showMsg(data.message || 'SUCCESS'); fetchAll(); }
    } catch { showMsg('NETWORK ERR', 'error'); }
    setLoading(false);
  }

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const status = session?.status || 'waiting';
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.waiting;
  const currentRound = session?.currentRound || 0;
  const isLive = status.includes('_active');

  return (
    <div className="min-h-screen relative bg-dark-950 text-gray-200 overflow-hidden font-body selection:bg-gdg-blue/30 selection:text-white">
      <div className="absolute inset-0 bg-[url('/images/stardust.png')] opacity-[0.03] pointer-events-none mix-blend-screen z-0"></div>
      <div className="cyber-grid absolute inset-0 pointer-events-none z-0"></div>
      <div className="gdg-watermark-bg z-0" style={{ transform: 'translate(-50%, -50%) rotate(15deg) scale(1.5)', opacity: 0.015 }}></div>

      {/* Floating HUD Bar */}
      <div className="pt-8 px-6 relative z-50 flex justify-center">
        <div className="w-full max-w-[1600px] clip-angled-br bg-dark-900/90 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <Link href="/admin" className="font-display font-bold text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-[0.3em] bg-dark-950 px-6 py-2 border border-white/5 hover:border-white/20">
             <span className="text-gdg-blue">◄</span> MAIN_CORE
          </Link>
          <div className="flex items-center gap-4 bg-dark-950 px-6 py-2 border border-white/5 shadow-inner">
            <span className={`w-2 h-2 ${statusInfo.dot} ${isLive ? 'animate-pulse shadow-[0_0_10px_currentColor]' : ''}`} />
            <span className={`font-display font-bold text-[10px] tracking-[0.3em] ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] text-gray-500 tracking-[0.3em] uppercase bg-dark-950 px-4 py-2 border border-white/5">Nodes: {teams.length}</span>
            <Link href="/leaderboard" target="_blank" className="font-display font-bold text-[9px] bg-gdg-blue/10 text-gdg-blue hover:bg-gdg-blue hover:text-white border border-gdg-blue/30 px-6 py-2 transition-all tracking-[0.3em] flex items-center gap-2 uppercase">
              TL_METRICS <span className="text-current">►</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {msg.text && (
            <div className={`p-3 font-mono text-[10px] tracking-widest uppercase border-l-2 shadow-lg flex items-center gap-3 ${msg.type === 'error' ? 'border-gdg-red text-gdg-red bg-gdg-red/10' : 'border-gdg-green text-gdg-green bg-gdg-green/10'}`}>
              <span className="w-1.5 h-1.5 bg-current animate-pulse"></span> {msg.text}
            </div>
          )}

          {/* Holographic Timer Panel */}
          <div className="tech-border clip-angled bg-dark-900/80 p-10 relative overflow-hidden flex-shrink-0 flex flex-col items-center justify-center min-h-[350px]">
            {isLive ? (
              <>
                {/* HUD Circles */}
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-${statusInfo.dot.replace('bg-','')}/20 animate-spin-slow`} />
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-dashed border-${statusInfo.dot.replace('bg-','')}/10 animate-[spin_12s_linear_infinite_reverse]`} />
                <div className={`absolute top-0 left-0 w-full h-full bg-${statusInfo.dot.replace('bg-','')}/5 blur-[100px] pointer-events-none`} />
                
                <div className={`font-mono text-[10px] font-bold tracking-[0.4em] mb-4 flex items-center justify-center gap-3 ${session?.isPaused ? 'text-gdg-yellow' : statusInfo.color} uppercase`}>
                  <span className={`w-2 h-2 ${session?.isPaused ? 'bg-gdg-yellow' : statusInfo.dot} animate-pulse shadow-[0_0_10px_currentColor]`}></span>
                  PHASE 0{currentRound} {session?.isPaused ? 'PAUSED' : 'EXECUTION'}
                </div>
                <div className={`font-display font-black text-8xl md:text-[9rem] tracking-tighter ${timeLeft <= 60 ? 'text-gdg-red animate-pulse drop-shadow-[0_0_30px_rgba(234,67,53,0.5)]' : `${statusInfo.color} drop-shadow-[0_0_30px_currentColor]`}`}>
                  {fmtTime(timeLeft)}
                </div>
                {timeLeft <= 60 && <div className="font-mono text-[9px] text-white mt-6 tracking-[0.4em] uppercase bg-gdg-red/80 px-6 py-2 font-bold shadow-[0_0_20px_rgba(234,67,53,0.6)] animate-holo-flicker">CRITICAL TIME T-MINUS 60S</div>}
              </>
            ) : (
              <div className="flex flex-col items-center space-y-6 opacity-40">
                <div className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center animate-spin-slow">
                   <div className="w-16 h-16 border border-gray-500 rounded-full"></div>
                </div>
                <div className="font-mono tracking-[0.4em] uppercase text-[10px] text-gray-500 bg-dark-950 px-6 py-2 border border-white/5">SYS_STANDBY</div>
              </div>
            )}
            
            <div className="absolute top-4 left-4 w-12 h-1 bg-white/10"></div>
            <div className="absolute top-4 left-4 w-1 h-12 bg-white/10"></div>
          </div>

          {/* Phase Control Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { r: 1, id: 'TWD', title: 'Tech Word Decoder', color: 'gdg-blue' },
              { r: 2, id: 'GTT', title: 'Guess The Tech', color: 'gdg-yellow' },
              { r: 3, id: 'RLG', title: 'Reverse Logic', color: 'gdg-red' },
            ].map(({ r, id, title, color }) => {
              const isActive = status === `round${r}_active`;
              const isEnded = status === `round${r}_ended`;
              const canStart = status === 'waiting' && r === 1 || status === `round${r-1}_ended` || (status === `round${r}_ended`);

              return (
                <div key={r} className={`clip-angled tech-border p-6 flex flex-col justify-between transition-all relative overflow-hidden group ${isActive ? `bg-${color}/5 border-${color}/40 shadow-[0_0_30px_rgba(var(--${color}),0.1)] z-10` : 'bg-dark-900/50 hover:bg-white/[0.02]'}`}>
                  {isActive && <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}/10 blur-[40px] pointer-events-none`} />}
                  
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`font-mono font-bold text-xs text-${isActive ? color : 'gray-600'}`}>[{id}]</div>
                      <div className={`font-mono text-[8px] px-2 py-1 tracking-[0.3em] uppercase border ${
                        isActive ? `bg-${color}/20 text-${color} border-${color}/50 animate-pulse` :
                        isEnded ? 'bg-white/5 text-gray-500 border-white/10' :
                        'bg-transparent text-gray-700 border-dashed border-gray-700'
                      }`}>
                        {isActive ? 'LIVE' : isEnded ? 'HALTED' : 'LOCK'}
                      </div>
                    </div>
                    
                    <div className={`font-display font-black text-2xl tracking-widest mb-1 ${isActive ? `text-${color}` : 'text-white'}`}>
                      PHASE 0{r}
                    </div>
                    <div className="font-mono text-[9px] text-gray-500 tracking-[0.2em] uppercase h-8">{title}</div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-4 relative z-10">
                    <div className="flex items-center justify-between bg-dark-950 p-2 border border-white/5">
                      <label className="font-mono text-[8px] text-gray-500 tracking-[0.3em] uppercase ml-2">T-MIN</label>
                      <select value={durations[r] / 60} onChange={e => setDurations({...durations, [r]: parseInt(e.target.value) * 60})}
                        disabled={isActive}
                        className="bg-transparent text-white font-mono text-[10px] px-2 py-1 focus:outline-none focus:text-gdg-blue disabled:opacity-50 text-right appearance-none w-12 text-center cursor-pointer">
                        {[5,10,15,20,25,30].map(m => <option key={m} value={m} className="bg-dark-900">{m}</option>)}
                      </select>
                    </div>
                    
                    <div className="mt-1 flex flex-col gap-2">
                      {isActive && !session?.isPaused && (
                        <>
                          <button onClick={() => gameAction('pause_round', r)} disabled={loading}
                            className={`w-full bg-gdg-yellow/10 hover:bg-gdg-yellow/20 text-gdg-yellow border border-gdg-yellow/50 font-display font-bold text-[10px] py-3 tracking-[0.3em] transition-all shadow-[0_0_15px_rgba(251,188,5,0.2)] uppercase`}>
                            PAUSE_EXEC
                          </button>
                          <button onClick={() => gameAction('end_round', r)} disabled={loading}
                            className={`w-full bg-${color}/10 hover:bg-${color}/20 text-${color} border border-${color}/50 font-display font-bold text-[10px] py-3 tracking-[0.3em] transition-all shadow-[0_0_15px_rgba(var(--${color}),0.2)] uppercase`}>
                            HALT_EXEC
                          </button>
                        </>
                      )}
                      {isActive && session?.isPaused && (
                        <button onClick={() => gameAction('resume_round', r)} disabled={loading}
                          className={`w-full bg-gdg-green/10 hover:bg-gdg-green/20 text-gdg-green border border-gdg-green/50 font-display font-bold text-[10px] py-4 tracking-[0.3em] transition-all shadow-[0_0_15px_rgba(52,168,83,0.2)] uppercase animate-pulse`}>
                          RESUME_EXEC
                        </button>
                      )}
                      {!isActive && canStart && (
                        <button onClick={() => gameAction('start_round', r)} disabled={loading}
                          className={`w-full bg-dark-950 hover:bg-${color}/10 text-white border border-white/20 hover:border-${color}/50 py-4 font-display font-bold text-[10px] tracking-[0.3em] transition-all uppercase`}>
                          INIT_EXEC
                        </button>
                      )}
                      {!isActive && !canStart && !isEnded && (
                        <div className="w-full text-center font-mono text-[9px] text-gray-700 tracking-[0.4em] uppercase py-4 border border-dashed border-gray-800 bg-dark-950/50">
                          DENIED
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Telemetry Matrix */}
        <div className="h-full">
          <div className="tech-border clip-angled-tl bg-dark-900/80 p-8 relative h-full max-h-[800px] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gdg-blue/5 blur-[60px] pointer-events-none" />
            
            <div className="font-display font-black text-white text-xl tracking-[0.3em] flex items-center justify-between mb-8 pb-4 border-b border-white/10 relative z-10">
              <span>TL_MATRIX</span>
              <span className="text-gdg-blue animate-holo-flicker text-[9px] bg-gdg-blue/10 px-2 py-1 border border-gdg-blue/30 shadow-[0_0_10px_rgba(66,133,244,0.2)]">LIVE_LINK</span>
            </div>
            
            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 relative z-10">
              {leaderboard.map((t, i) => (
                <div key={t.teamId} className={`relative overflow-hidden bg-dark-950 border border-white/5 p-4 flex items-center gap-4 transition-all hover:border-white/20 ${
                  i === 0 ? 'border-gdg-yellow/50 bg-gdg-yellow/5' : ''
                }`}>
                  {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gdg-yellow shadow-[0_0_10px_#FBBC05]" />}
                  
                  <div className={`font-mono font-bold text-[10px] w-6 text-center ${
                    i === 0 ? 'text-gdg-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-[#CD7F32]' : 'text-gray-600'
                  }`}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-xs text-white truncate tracking-widest">{t.teamName}</div>
                    <div className="font-mono text-[8px] text-gray-500 mt-1 tracking-[0.2em] flex gap-2 uppercase">
                      <span>P1:{t.scores.round1}</span>
                      <span className="text-white/10">|</span>
                      <span>P2:{t.scores.round2}</span>
                      <span className="text-white/10">|</span>
                      <span>P3:{t.scores.round3}</span>
                    </div>
                  </div>
                  
                  <div className={`font-mono font-black text-lg ${i === 0 ? 'text-gdg-yellow' : 'text-white'}`}>
                    {t.scores.total}
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 border border-dashed border-gray-800 bg-dark-950/40">
                  <div className="font-mono text-gray-700 text-[9px] tracking-[0.4em] uppercase">NO_SIGNAL</div>
                </div>
              )}
            </div>
            <div className="absolute bottom-4 right-4 w-12 h-1 bg-white/10"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
