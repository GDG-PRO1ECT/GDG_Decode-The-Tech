'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Database, MonitorPlay, BarChart3, Zap, Skull, Power, Play, Pause, Square, AlertTriangle, ShieldAlert, Cpu, Clock, Activity, RefreshCw } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const STATUS_MAP = {
  draft: { label: 'SETUP STAGE', color: 'text-gray-500', dot: 'bg-gray-500', glow: 'shadow-[0_0_15px_#6b7280]', hex: '#6b7280' },
  ready: { label: 'STANDBY READY', color: 'text-gdg-yellow', dot: 'bg-gdg-yellow', glow: 'shadow-[0_0_15px_#FBBC05]', hex: '#FBBC05' },
  active: { label: 'ROUND LIVE', color: 'text-gdg-blue', dot: 'bg-gdg-blue', glow: 'shadow-[0_0_15px_#4285F4]', hex: '#4285F4' },
  finished: { label: 'SIM COMPLETE', color: 'text-gdg-green', dot: 'bg-gdg-green', glow: 'shadow-[0_0_15px_#34A853]', hex: '#34A853' },
};

const GdgLogo = ({ className = "w-8 h-8" }) => (
  <Image src="/gdg-logo.png" alt="GDG Logo" width={100} height={100} className={`${className} object-contain`} />
);

export default function AdminDashboard({ quizCode, initialSession = null, initialTeams = [], initialLeaderboard = [] }) {
  const { authenticatedFetch } = useAdminAuth(quizCode);
  const [session, setSession] = useState(initialSession);
  const [teams, setTeams] = useState(initialTeams);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [durations, setDurations] = useState({ 1: 900, 2: 900, 3: 900, 4: 900, 5: 900 }); // in seconds
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [showDanger, setShowDanger] = useState(false);

  useEffect(() => {
    fetchAll();
    
    const socket = getSocket();
    socket.emit('join_display', quizCode);

    const onSessionUpdate = (newSession) => setSession(newSession);
    const onLeaderboardUpdate = (newLeaderboard) => setLeaderboard(newLeaderboard);

    socket.on('session_update', onSessionUpdate);
    socket.on('leaderboard_update', onLeaderboardUpdate);

    // Dynamic polling based on game state
    const pollInterval = isLive ? 15000 : 30000;
    const poll = setInterval(() => {
      if (!document.hidden) fetchAll();
    }, pollInterval);

    const handleVisibility = () => {
      if (!document.hidden) fetchAll();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('session_update', onSessionUpdate);
      socket.off('leaderboard_update', onLeaderboardUpdate);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isLive]);

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
    if (document.hidden) return;
    try {
      const [sRes, tRes, lRes] = await Promise.all([
        fetch(`/api/game/status?quizCode=${quizCode}`), fetch(`/api/teams?quizCode=${quizCode}`), fetch(`/api/leaderboard?quizCode=${quizCode}`),
      ]);
      const sData = await sRes.json();
      setSession(sData.session);
      setTeams((await tRes.json()).teams || []);
      setLeaderboard((await lRes.json()).leaderboard || []);

      if (sData.session?.settings?.rounds) {
        const roundDurations = {};
        sData.session.settings.rounds.forEach(r => {
          roundDurations[r.roundNumber] = r.timeLimitSeconds || 900;
        });
        setDurations(prev => ({ ...roundDurations, ...prev }));
      }
    } catch {}
  }

  function showMsg(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4000);
  }

  async function gameAction(action, round) {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, round, duration: round ? durations[round] : undefined, quizCode }),
      });
      if (!res) { setLoading(false); return; } // Hook handled 401
      
      const data = await res.json();
      if (!res.ok) showMsg(data.error || 'ERR', 'error');
      else { showMsg(data.message || 'SUCCESS'); fetchAll(); }
    } catch { showMsg('NETWORK ERR', 'error'); }
    setLoading(false);
  }

  async function seedDatabase() {
    if (!confirm('CRITICAL: WIPE ALL DATA AND RE-SEED? THIS ACTION IS IRREVERSIBLE.')) return;
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/admin/seed?quizCode=${quizCode}`, { method: 'POST' });
      if (!res) { setLoading(false); return; }
      
      const data = await res.json();
      if (res.ok) showMsg(data.message || 'DB SEEDED', 'success');
      else showMsg(data.error || 'SEED FAILED', 'error');
      fetchAll();
    } catch { showMsg('NETWORK ERR', 'error'); }
    setLoading(false);
  }

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const status = session?.status || 'draft';
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.draft;
  const currentRound = session?.currentRound || 0;
  const isLive = status === 'active';

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVars = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } };

  return (
    <div className="min-h-screen relative bg-[#050505] text-gray-200 overflow-hidden font-body selection:bg-gdg-blue/30 selection:text-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none" />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-10 pointer-events-none transition-all duration-1000`} style={{ backgroundColor: statusInfo.hex }} />
      <div className="cyber-grid absolute inset-0 pointer-events-none z-0 opacity-30"></div>

      {/* Top Navbar */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative z-50 w-full pt-6 px-8 max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="glass-panel px-6 py-2 font-mono text-[10px] text-gray-400 hover:text-white transition-all flex items-center gap-2 uppercase tracking-[0.3em] rounded-full group border border-white/5 hover:border-gdg-red/50">
            <span className="text-gdg-red group-hover:animate-pulse">◄</span> EXIT_SUDO
          </Link>
          <button 
            onClick={() => { sessionStorage.removeItem(`admin_pass_${quizCode}`); window.location.reload(); }}
            className="glass-panel px-6 py-2 font-mono text-[10px] text-gray-400 hover:text-gdg-red transition-all flex items-center gap-2 uppercase tracking-[0.3em] rounded-full border border-white/5 hover:border-gdg-red/30"
          >
            LOGOUT
          </button>
        </div>
        
        <div className="flex flex-1 justify-center gap-2 px-4 overflow-x-auto custom-scrollbar">
          {[
            { href: `/host/${quizCode}/admin/teams`, icon: Network, label: 'TEAMS' },
            { href: `/host/${quizCode}/questions`, icon: Database, label: 'PAYLOAD' },
            { href: `/host/${quizCode}/admin/arena`, icon: MonitorPlay, label: 'ARENA' },
            { href: `/host/${quizCode}/admin/leaderboard`, icon: BarChart3, label: 'LEADERBOARD', external: true }
          ].map((nav) => (
            <Link key={nav.href} href={nav.href} target={nav.external ? "_blank" : "_self"} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-full transition-all group">
               <nav.icon size={14} className="text-gray-400 group-hover:text-gdg-blue" />
               <span className="font-mono text-[9px] tracking-[0.2em] text-gray-300 group-hover:text-white">{nav.label}</span>
            </Link>
          ))}
        </div>

        <div className="glass-panel rounded-full px-6 py-2 flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
          <div className={`absolute inset-0 opacity-20 ${statusInfo.glow} transition-all duration-500`} style={{ backgroundColor: statusInfo.hex }} />
          <div className="flex items-center gap-3 relative z-10">
             <GdgLogo className="w-5 h-5 animate-holo-flicker grayscale group-hover:grayscale-0 transition-all" />
             <span className="font-display font-black text-sm tracking-[0.3em] text-white">SUDO_CORE</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10 relative z-10"></div>
          <div className="flex items-center gap-2 relative z-10">
            <span className={`w-2 h-2 rounded-full ${statusInfo.dot} ${isLive ? 'animate-pulse ' + statusInfo.glow : ''}`} />
            <span className={`font-mono text-[9px] font-bold tracking-[0.3em] uppercase ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={containerVars} initial="hidden" animate="show" className="max-w-[1800px] mx-auto px-6 py-8 relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
        
        {/* LEFT COLUMN: Holographic Timer & Danger Zone */}
        <motion.div variants={itemVars} className="xl:col-span-4 flex flex-col gap-8 h-full">
          
          <AnimatePresence>
            {msg.text && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className={`p-4 font-mono text-[10px] tracking-[0.3em] uppercase rounded-xl border-l-4 shadow-lg flex items-center gap-3 ${msg.type === 'error' ? 'bg-gdg-red/10 text-gdg-red border-gdg-red' : 'bg-gdg-green/10 text-gdg-green border-gdg-green'}`}>
                  <Activity size={14} className="animate-pulse" /> {msg.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-panel p-8 rounded-[2rem] border border-white/10 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
             {/* Holographic UI Rings */}
             <div className="absolute inset-0 bg-[url('/images/cubes.png')] opacity-5 mix-blend-overlay"></div>
             
             {isLive ? (
               <>
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-${statusInfo.dot.replace('bg-','')}/30 border-t-transparent animate-[spin_4s_linear_infinite]`} />
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-dashed border-${statusInfo.dot.replace('bg-','')}/20 animate-[spin_10s_linear_infinite_reverse]`} />
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-${statusInfo.dot.replace('bg-','')}/5 blur-[40px] animate-pulse`} />
                 
                 <div className={`font-mono text-[10px] font-bold tracking-[0.4em] mb-4 flex items-center justify-center gap-3 ${session?.isPaused ? 'text-gdg-yellow' : statusInfo.color} uppercase relative z-10`}>
                   <span className={`w-2 h-2 ${session?.isPaused ? 'bg-gdg-yellow shadow-[0_0_10px_#FBBC05]' : statusInfo.dot + ' ' + statusInfo.glow} animate-pulse`}></span>
                   PHASE 0{currentRound} {session?.isPaused ? 'PAUSED' : 'EXECUTION'}
                 </div>
                 <div className={`font-display font-black text-7xl tracking-tighter relative z-10 transition-colors duration-300 ${timeLeft <= 60 ? 'text-gdg-red animate-pulse drop-shadow-[0_0_30px_rgba(234,67,53,0.8)]' : `text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]`}`}>
                   {fmtTime(timeLeft)}
                 </div>
                 {timeLeft <= 60 && <div className="font-mono text-[9px] text-white mt-8 tracking-[0.4em] uppercase bg-gdg-red/80 px-6 py-2 font-bold shadow-[0_0_20px_rgba(234,67,53,0.6)] animate-holo-flicker rounded-full relative z-10">CRITICAL TIME T-MINUS 60S</div>}
               </>
             ) : (
               <div className="flex flex-col items-center space-y-8 opacity-50 relative z-10">
                 <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-dashed border-gray-600 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-4 border border-gray-500 rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
                    <Cpu size={32} className="text-gray-500" />
                 </div>
                 <div className="font-mono tracking-[0.4em] uppercase text-[10px] text-gray-400 bg-white/5 px-6 py-2 border border-white/10 rounded-full">SYSTEM STANDBY</div>
               </div>
             )}
          </div>

          <div className="glass-panel p-6 rounded-[2rem] border border-white/5 relative overflow-hidden transition-all duration-500">
            <button onClick={() => setShowDanger(!showDanger)} className="w-full flex items-center justify-between text-gray-400 hover:text-white transition-colors group">
              <div className="flex items-center gap-3">
                 <ShieldAlert size={18} className={`${showDanger ? 'text-gdg-red' : ''} transition-colors`} />
                 <span className="font-display font-bold text-sm tracking-[0.2em] uppercase">SYSTEM_OVERRIDE</span>
              </div>
              <span className="font-mono text-[10px]">{showDanger ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
              {showDanger && (
                <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 20 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="overflow-hidden">
                  <div className="flex flex-col gap-3">
                    <button onClick={() => controlGame('finish')} disabled={loading} className="w-full bg-dark-900 border border-gdg-yellow/30 hover:bg-gdg-yellow/20 hover:border-gdg-yellow text-gdg-yellow py-4 px-6 rounded-xl font-display font-bold text-[10px] tracking-[0.3em] uppercase transition-all flex items-center justify-between group shadow-[inset_0_0_20px_rgba(251,188,5,0.05)]">
                      <span>TERMINATE_SIM</span>
                      <Power size={14} className="group-hover:animate-pulse" />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={seedDatabase} disabled={loading} className="bg-dark-900 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white py-3 px-4 rounded-xl font-mono text-[9px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2">
                        <RefreshCw size={12} /> SEED_DB
                      </button>
                      <button onClick={() => { if (confirm('CRITICAL: PURGE ALL?')) gameAction('reset'); }} disabled={loading} className="bg-dark-900 border border-gdg-red/30 hover:bg-gdg-red/20 text-gdg-red py-3 px-4 rounded-xl font-mono text-[9px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 shadow-[inset_0_0_15px_rgba(234,67,53,0.05)]">
                        <Skull size={12} /> PURGE_ALL
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </motion.div>

        {/* MIDDLE COLUMN: Phase Controls */}
        <motion.div variants={itemVars} className="xl:col-span-5 flex flex-col gap-6 h-full">
           <div className="font-display font-bold text-white text-lg tracking-[0.2em] flex items-center gap-3 mb-2">
             <Zap size={20} className="text-gdg-blue" /> PHASE_MATRIX
           </div>
           
           <div className="grid grid-cols-1 gap-6 flex-1">
             {(session?.settings?.rounds || []).map((round) => {
                const r = round.roundNumber;
                const id = round.questionType.toUpperCase();
                const title = round.roundName;

                const colors = ['gdg-blue', 'gdg-yellow', 'gdg-red', 'gdg-green', 'neon-magenta'];
                const hexes = ['#4285F4', '#FBBC05', '#EA4335', '#34A853', '#FF007F'];
                const idx = (r - 1) % colors.length;
                const color = colors[idx];
                const hex = hexes[idx];

                const isActive = status === 'active' && currentRound === r;
                const isEnded = (status === 'ready' && currentRound >= r) || status === 'finished';
                const canStart = (status === 'ready' && (currentRound === r - 1 || currentRound === r));

                return (
                  <div key={r} className={`glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-500 flex flex-col justify-between ${isActive ? `border-${color}/50 shadow-[0_0_30px_rgba(var(--${color}),0.15)] scale-[1.02] z-10` : 'border-white/5 hover:border-white/20 hover:bg-white/[0.02]'}`}>
                    {isActive && <div className={`absolute top-0 right-0 w-48 h-48 blur-[60px] pointer-events-none transition-opacity duration-1000`} style={{ backgroundColor: hex, opacity: 0.15 }} />}
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <div className={`font-mono font-bold text-xs mb-1 ${isActive ? `text-${color}` : 'text-gray-500'}`}>[{id}]</div>
                        <div className={`font-display font-black text-2xl tracking-widest ${isActive ? `text-${color} drop-shadow-[0_0_10px_currentColor]` : 'text-white'}`}>
                          PHASE 0{r}
                        </div>
                        <div className="font-mono text-[9px] text-gray-400 tracking-[0.2em] uppercase mt-1">{title}</div>
                      </div>

                      <div className={`font-mono text-[8px] px-3 py-1.5 rounded-full tracking-[0.3em] uppercase border flex items-center gap-2 ${
                        isActive ? `bg-${color}/20 text-${color} border-${color}/50` :
                        isEnded ? 'bg-white/5 text-gray-500 border-white/10' :
                        'bg-transparent text-gray-700 border-dashed border-gray-700'
                      }`}>
                        {isActive && <span className={`w-1.5 h-1.5 rounded-full bg-${color}`}></span>}
                        {isActive ? 'LIVE' : isEnded ? 'HALTED' : 'LOCK'}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-4 relative z-10">
                       
                        <div className="flex items-center bg-dark-950 rounded-xl px-3 py-2 border border-white/5 gap-2">
                          <Clock size={12} className="text-gray-500" />
                          <input
                            type="number"
                            min="1"
                            max="7200"
                            step="10"
                            value={durations[r] === 0 ? '' : durations[r]}
                            onChange={e => {
                              const val = parseInt(e.target.value);
                              setDurations({...durations, [r]: isNaN(val) ? 0 : val});
                            }}
                            disabled={isActive}
                            className="bg-transparent text-white font-mono text-[10px] focus:outline-none focus:text-gdg-blue disabled:opacity-50 w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-gray-500 font-mono text-[10px]">SEC</span>
                        </div>

                       <div className="flex items-center gap-2">
                         {isActive && !session?.isPaused && (
                           <>
                             <button onClick={() => gameAction('pause_round', r)} disabled={loading}
                               className="p-3 rounded-xl bg-gdg-yellow/10 hover:bg-gdg-yellow/20 text-gdg-yellow border border-gdg-yellow/30 transition-all group" title="Pause Phase">
                               <Pause size={14} className="group-hover:scale-110 transition-transform" />
                             </button>
                             <button onClick={() => gameAction('end_round', r)} disabled={loading}
                               className={`px-6 py-3 rounded-xl bg-${color}/10 hover:bg-${color}/20 text-${color} border border-${color}/30 font-display font-bold text-[9px] tracking-[0.3em] uppercase transition-all flex items-center gap-2`}>
                               <Square size={10} fill="currentColor" /> HALT
                             </button>
                           </>
                         )}
                         {isActive && session?.isPaused && (
                           <button onClick={() => gameAction('resume_round', r)} disabled={loading}
                             className="px-6 py-3 rounded-xl bg-gdg-green/10 hover:bg-gdg-green/20 text-gdg-green border border-gdg-green/50 font-display font-bold text-[9px] tracking-[0.3em] uppercase transition-all shadow-[0_0_15px_rgba(52,168,83,0.2)] animate-pulse flex items-center gap-2">
                             <Play size={10} fill="currentColor" /> RESUME
                           </button>
                         )}
                         {!isActive && canStart && (
                           <button onClick={() => gameAction('start_round', r)} disabled={loading}
                             className={`px-8 py-3 rounded-xl bg-white/5 hover:bg-${color}/10 text-white hover:text-${color} border border-white/10 hover:border-${color}/50 font-display font-bold text-[9px] tracking-[0.3em] uppercase transition-all flex items-center gap-2 group`}>
                             <Play size={10} className="group-hover:text-current" /> INITIATE
                           </button>
                         )}
                         {!isActive && !canStart && !isEnded && (
                           <div className="px-8 py-3 rounded-xl bg-dark-950/50 text-gray-700 font-mono text-[9px] tracking-[0.4em] uppercase border border-dashed border-gray-800">
                             DENIED
                           </div>
                         )}
                       </div>

                    </div>
                  </div>
                );
             })}
           </div>
        </motion.div>

        {/* RIGHT COLUMN: Live Telemetry */}
        <motion.div variants={itemVars} className="xl:col-span-3 h-[600px] xl:h-auto">
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 relative h-full flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gdg-blue/5 blur-[50px] pointer-events-none" />
            
            <div className="font-display font-bold text-white text-sm tracking-[0.2em] flex items-center justify-between mb-6 pb-4 border-b border-white/5 relative z-10">
              <span className="flex items-center gap-2"><Network size={16} className="text-gdg-blue" /> TELEMETRY</span>
              <span className="text-gdg-blue animate-holo-flicker text-[8px] bg-gdg-blue/10 px-2 py-1 rounded-full border border-gdg-blue/30 shadow-[0_0_10px_rgba(66,133,244,0.2)]">LIVE</span>
            </div>
            
            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 relative z-10">
              {leaderboard.map((t, i) => (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }} key={t.teamId} className={`relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center gap-3 transition-all hover:border-white/20 hover:bg-white/[0.05] ${
                  i === 0 ? 'border-gdg-yellow/30 bg-gdg-yellow/5' : ''
                }`}>
                  {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gdg-yellow shadow-[0_0_10px_#FBBC05]" />}
                  
                  <div className={`font-mono font-bold text-[10px] w-5 text-center ${
                    i === 0 ? 'text-gdg-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-[#CD7F32]' : 'text-gray-600'
                  }`}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-[11px] text-white truncate tracking-widest">{t.teamName}</div>
                    <div className="font-mono text-[7px] text-gray-500 mt-1 tracking-[0.2em] flex gap-2 uppercase">
                      <span>P1:{t.scores.round1}</span>
                      <span className="text-white/10">|</span>
                      <span>P2:{t.scores.round2}</span>
                      <span className="text-white/10">|</span>
                      <span>P3:{t.scores.round3}</span>
                    </div>
                  </div>
                  
                  <div className={`font-mono font-black text-sm ${i === 0 ? 'text-gdg-yellow' : 'text-white'}`}>
                    {t.scores.total}
                  </div>
                </motion.div>
              ))}
              {leaderboard.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                  <AlertTriangle size={20} className="text-gray-700 mb-2" />
                  <div className="font-mono text-gray-600 text-[9px] tracking-[0.4em] uppercase">NO SIGNAL</div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
