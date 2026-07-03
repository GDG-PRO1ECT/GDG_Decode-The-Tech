'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, Cpu, Activity, Clock, Target, AlertTriangle, Lock, Unlock, ArrowRight, CheckCircle2, XCircle, Crosshair, Hexagon, Radar, Pause, Send, Code, Terminal, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { getSocket } from '@/lib/socket';

// --- Cyberpunk Scramble Text ---
const ScrambleText = ({ text, duration = 1200, className }) => {
  const [displayText, setDisplayText] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>';
  
  useEffect(() => {
    let startTime;
    let animationFrame;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      let newText = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          newText += ' ';
          continue;
        }
        if (Math.random() < percentage) {
          newText += text[i];
        } else {
          newText += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      
      setDisplayText(newText);
      
      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayText(text);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [text, duration]);
  
  return <span className={className}>{displayText}</span>;
};

// --- Match the Following Component ---
function MatchInterface({ data, onComplete, isSubmitting, accentColor }) {
  const [pairs, setPairs] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  
  const dotColors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A142F4', '#00F0FF', '#FF007F'];

  const handleLeftClick = (item) => {
    if (isSubmitting) return;
    setSelectedLeft(item);
  };

  const handleRightClick = (item) => {
    if (isSubmitting || !selectedLeft) return;
    
    const filtered = pairs.filter(p => p.left !== selectedLeft && p.right !== item);
    const usedColors = filtered.map(p => p.color);
    const availableColors = dotColors.filter(c => !usedColors.includes(c));
    const color = availableColors.length > 0 ? availableColors[0] : dotColors[Math.floor(Math.random() * dotColors.length)];

    setPairs([...filtered, { left: selectedLeft, right: item, color }]);
    setSelectedLeft(null);
  };

  const isPaired = (side, item) => pairs.some(p => p[side] === item);
  const getPairedWith = (side, item) => {
    const p = pairs.find(pair => pair[side] === item);
    return side === 'left' ? p?.right : p?.left;
  };
  const getPairedColor = (side, item) => {
    const p = pairs.find(pair => pair[side] === item);
    return p ? p.color : undefined;
  };

  const allPaired = pairs.length === data.left.length;

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <div className="w-full max-h-[50vh] md:max-h-[60vh] overflow-y-auto px-4 custom-scrollbar bg-black/30 p-6 rounded-3xl border border-white/10 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full max-w-5xl mx-auto relative">
          
          {/* Connector Line in the middle (visual only) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/5 -translate-x-1/2"></div>

          {/* Left Column */}
          <div className="flex flex-col gap-4 relative z-10">
            <div className="font-mono text-xs md:text-sm text-white/50 tracking-[0.4em] uppercase mb-2 text-center md:text-left border-b border-white/10 pb-2">Terminal_A (Source)</div>
            {data.left.map((item, i) => {
              const paired = isPaired('left', item);
              const color = getPairedColor('left', item);
              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02, x: 5 }}
                  onClick={() => handleLeftClick(item)}
                  className={`relative p-5 md:p-6 text-left border-l-8 transition-all duration-300 clip-slant shadow-lg ${
                    selectedLeft === item 
                      ? 'bg-white/20 border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] z-10' 
                      : paired
                        ? 'bg-black/60 border-white/20 text-white/80'
                        : 'bg-gradient-to-r from-blue-900/40 to-black/40 border-blue-500/30 text-white/70 hover:text-white hover:border-blue-400'
                  }`}
                  style={{ borderLeftColor: selectedLeft === item ? accentColor : paired ? color : undefined }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-body text-sm md:text-lg font-bold tracking-wider uppercase truncate">{item}</span>
                    {paired && <div className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color, color: color }} />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4 relative z-10">
            <div className="font-mono text-xs md:text-sm text-white/50 tracking-[0.4em] uppercase mb-2 text-center md:text-right border-b border-white/10 pb-2">Terminal_B (Destination)</div>
            {data.right.map((item, i) => {
              const pairedLeft = getPairedWith('right', item);
              const paired = isPaired('right', item);
              const color = getPairedColor('right', item);
              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02, x: -5 }}
                  onClick={() => handleRightClick(item)}
                  className={`relative p-5 md:p-6 text-right border-r-8 transition-all duration-300 clip-slant shadow-lg ${
                    paired
                      ? 'bg-black/60 border-white text-white'
                      : 'bg-gradient-to-l from-purple-900/40 to-black/40 border-purple-500/30 text-white/70 hover:text-white hover:border-purple-400'
                  }`}
                  style={{ borderRightColor: paired ? color : undefined }}
                >
                  <div className="flex items-center justify-between flex-row-reverse gap-4">
                    <span className="font-body text-sm md:text-lg font-bold tracking-wider uppercase text-right leading-tight break-words">{item}</span>
                    {pairedLeft && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color, color: color }} />
                        <div className="font-mono text-[9px] uppercase tracking-tighter text-white/70 truncate max-w-[120px] bg-black/50 px-2 py-1 rounded border border-white/20">
                          {pairedLeft}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: allPaired ? 1 : 0.3, y: 0, scale: allPaired ? 1 : 0.98 }}
        disabled={!allPaired || isSubmitting}
        onClick={() => onComplete(pairs)}
        className="group relative flex items-center justify-center gap-4 px-12 py-5 bg-white text-black font-display font-black text-lg tracking-[0.3em] uppercase clip-slant transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-full max-w-md mx-auto"
        style={{ backgroundColor: allPaired ? accentColor : 'rgba(255,255,255,0.1)', color: allPaired ? 'black' : 'rgba(255,255,255,0.2)' }}
      >
        <Send size={24} />
        Initialize Uplink
      </motion.button>
    </div>
  );
}

export default function PlayClient({ initialQuestions, initialTeam, initialSession }) {
  const { teamId, quizCode } = useParams();
  const router = useRouter();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [questions, setQuestions] = useState(initialQuestions || []);
  const firstUnanswered = initialQuestions?.findIndex(q => !q.isAnswered) ?? 0;
  const [currentQIdx, setCurrentQIdx] = useState(firstUnanswered >= 0 ? firstUnanswered : 0);
  const [team, setTeam] = useState(initialTeam);
  const [session, setSession] = useState(initialSession);
  const [leaderboard, setLeaderboard] = useState([]);
  const [allAnswered, setAllAnswered] = useState(initialQuestions?.length > 0 && initialQuestions?.every(q => q.isAnswered));
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (initialSession?.roundEndTime) {
      const left = Math.max(0, Math.floor((new Date(initialSession.roundEndTime) - Date.now()) / 1000));
      return left;
    }
    return 0;
  });
  const [totalTime, setTotalTime] = useState(initialSession?.roundDurations?.[`round${initialSession?.currentRound || 1}`] || (initialSession?.currentRound === 3 ? 1500 : 1200));
  const [isDisqualifiedLocal, setIsDisqualifiedLocal] = useState(initialTeam?.isDisqualified || false);
  const timerRef = useRef(null);
  const hasStartedRef = useRef(true);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (e) {
      console.error("Fullscreen failed", e);
    }
  }, []);

  const triggerDisqualification = useCallback(async (reason = 'Exited fullscreen during active phase') => {
    setIsDisqualifiedLocal(true);
    try {
      await fetch(`/api/teams/${teamId}/disqualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDisqualified: true, reason, quizCode }),
      });
    } catch (e) {
      console.error('Failed to disqualify', e);
    }
  }, [teamId, quizCode]);

  useEffect(() => {
    const handler = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs && hasStartedRef.current && !allAnswered) {
        triggerDisqualification('Exited fullscreen during active phase — anti-cheat protocol triggered.');
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [allAnswered, triggerDisqualification]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasStartedRef.current && !allAnswered) {
        triggerDisqualification('Background navigation detected during active phase.');
      }
    };
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U') ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [allAnswered, triggerDisqualification]);

  useEffect(() => {
    if (!teamId || !quizCode) return;
    fetchData();
    
    const socket = getSocket();
    socket.emit('join_team', { teamId, quizCode });

    const onSessionUpdate = (newSession) => setSession(newSession);
    const onLeaderboardUpdate = (newLeaderboard) => setLeaderboard(newLeaderboard);

    socket.on('session_update', onSessionUpdate);
    socket.on('leaderboard_update', onLeaderboardUpdate);

    // Fallback polling (much slower)
    const interval = setInterval(() => {
      if (!document.hidden) fetchData();
    }, 60000);

    const handleVisibility = () => {
      if (!document.hidden) fetchData();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('session_update', onSessionUpdate);
      socket.off('leaderboard_update', onLeaderboardUpdate);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [teamId, quizCode]);

  useEffect(() => {
    // Force redirect to dashboard if the round is not active or time is up
    const isActuallyActive = session?.status === 'active' || session?.status === `round${session?.currentRound || 1}_active`;
    const isTimeOver = timeLeft === 0 && session?.roundEndTime && (new Date(session.roundEndTime) <= new Date());
    
    if (!isActuallyActive || isTimeOver) {
      // Always redirect to the team dashboard so they can see Historical Insights
      router.push(`/quiz/${quizCode}/team/${teamId}`);
    }
  }, [session?.status, timeLeft, router, teamId, session?.roundEndTime, session?.currentRound, allAnswered]);

  useEffect(() => {
    // Auto-redirect immediately upon answering all questions
    if (allAnswered) {
      const timer = setTimeout(() => {
        if (session?.currentRound === 3) router.push(`/quiz/${quizCode}/leaderboard`);
        else router.push(`/quiz/${quizCode}/team/${teamId}`);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [allAnswered, session?.currentRound, router, teamId, quizCode]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (!session?.roundEndTime) return;
    if (session?.isPaused && session?.timeRemainingAtPause != null) {
      setTimeLeft(Math.floor(session.timeRemainingAtPause / 1000));
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(session.roundEndTime) - Date.now()) / 1000));
      setTimeLeft(left);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.roundEndTime, session?.isPaused, session?.timeRemainingAtPause]);

  async function fetchData() {
    if (!quizCode || !teamId) return;
    try {
      const sessionRes = await fetch(`/api/game/status?quizCode=${quizCode}`);
      const { session } = await sessionRes.json();
      setSession(session);

      const round = session?.currentRound || 1;
      const dur = session?.roundDurations?.[`round${round}`] || (round === 3 ? 1500 : 1200);
      setTotalTime(dur);

      const qRes = await fetch(`/api/game/questions?teamId=${teamId}&round=${round}&quizCode=${quizCode}`, { cache: 'no-store' });
      if (!qRes.ok) return;
      const data = await qRes.json();
      
      setQuestions(data.questions || []);
      setTeam(data.team);
      if (data.team?.isDisqualified) setIsDisqualifiedLocal(true);
      
      setAllAnswered(data.questions?.length > 0 && data.questions?.every(q => q.isAnswered));

      const lbRes = await fetch(`/api/leaderboard?quizCode=${quizCode}&limit=10&teamId=${teamId}`);
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        let finalLb = lbData.leaderboard || [];
        if (lbData.targetTeam && !finalLb.some(t => t.teamId === teamId)) {
          finalLb.push(lbData.targetTeam);
        }
        setLeaderboard(finalLb);
      }
    } catch {}
  }

  async function fetchSessionOnly() {
    if (document.hidden || !quizCode || !teamId) return;
    try {
      const [sessionRes, lbRes] = await Promise.all([
        fetch(`/api/game/status?quizCode=${quizCode}`),
        fetch(`/api/leaderboard?quizCode=${quizCode}&limit=10&teamId=${teamId}`)
      ]);
      const { session } = await sessionRes.json();
      setSession(session);
      
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        let finalLb = lbData.leaderboard || [];
        if (lbData.targetTeam && !finalLb.some(t => t.teamId === teamId)) {
          finalLb.push(lbData.targetTeam);
        }
        setLeaderboard(finalLb);
      }
    } catch {}
  }

  const currentQ = questions[currentQIdx];
  const round = session?.currentRound || 1;
  const isRoundActive = session?.status === 'active' || session?.status === `round${round}_active`;

  async function submitAnswer(answer) {
    if (submitting || currentQ?.isAnswered) return;
    setSelectedAnswer(answer);
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/game/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, questionId: currentQ._id, answer, round, quizCode }),
      });
      const data = await res.json();
      
      const updatedQuestions = questions.map((q, i) => i === currentQIdx ? { ...q, isAnswered: true } : q);
      setQuestions(updatedQuestions);
      
      if (data.totalScore !== undefined) {
        setTeam(prev => {
          if (!prev) return prev;
          const newScores = { ...prev.scores };
          if (data.points) newScores[`round${round}`] = (newScores[`round${round}`] || 0) + data.points;
          newScores.total = data.totalScore;
          return { ...prev, scores: newScores };
        });
      }

      // No result overlay - move to next question instantly
      nextQuestion(updatedQuestions);
    } catch {
      setSubmitting(false);
    }
  }

  function nextQuestion(updatedQuestions = questions) {
    setSelectedAnswer(null);
    setSubmitting(false);
    
    const next = updatedQuestions.findIndex((q, i) => i > currentQIdx && !q.isAnswered);
    if (next >= 0) {
      setCurrentQIdx(next);
    } else {
      const anyUnanswered = updatedQuestions.findIndex(q => !q.isAnswered);
      if (anyUnanswered >= 0) {
        setCurrentQIdx(anyUnanswered);
      } else {
        setAllAnswered(true);
      }
    }
  }

  // Remove early return for disqualified teams - they can now play but with a warning banner

  if (isDisqualifiedLocal || team?.isDisqualified) {
    const isDQ = isDisqualifiedLocal || team?.isDisqualified;
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-[#020205] overflow-hidden select-none font-body">
        <div className="absolute inset-0 bg-red-950/20 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center max-w-3xl w-full mx-6 text-center">
          <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/50 flex items-center justify-center mb-10 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            {isDQ ? <ShieldAlert size={48} className="text-red-500" /> : <XCircle size={48} className="text-red-500" />}
          </div>
          <h1 className="font-display font-black text-5xl md:text-7xl text-white mb-6 tracking-[0.1em] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            {isDQ ? 'ACCESS REVOKED' : 'PHASE TERMINATED'}
          </h1>
          <div className="bg-black/60 border border-red-500/20 p-8 rounded-3xl backdrop-blur-3xl mb-10 w-full">
            <p className="text-xl md:text-2xl text-red-500/80 font-mono tracking-widest mb-4 uppercase">
              {isDQ ? 'Anti-Cheat Protocol Triggered' : 'Qualification Protocol Failed'}
            </p>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              {isDQ 
                ? 'Your connection has been severed due to a security violation (exiting full-screen or background navigation). This unit is no longer authorized to attend questions.'
                : `Your team failed to meet the cycle threshold for Phase 0${team?.eliminatedAtRound || 1}. Access to subsequent levels has been revoked.`}
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/quiz/${quizCode}/team/${teamId}`)} 
              className="px-10 py-4 bg-red-500/10 border border-red-500/50 text-red-500 font-display font-bold uppercase tracking-[0.3em] clip-slant hover:bg-red-500 hover:text-white transition-all"
            >
              Return to Terminal
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentHexColor = round === 1 ? '#00F0FF' : round === 2 ? '#FFC933' : '#FF007F';
  const timePct = totalTime > 0 ? timeLeft / totalTime : 0;
  const isUrgent = timeLeft <= 60 && timeLeft > 0;

  if (!isFullscreen) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center text-center p-6 bg-[#020205] overflow-hidden font-body">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
           <div className="w-[120vw] h-[120vw] max-w-[1200px] max-h-[1200px] rounded-full border border-[#00F0FF]/20 animate-[spin_40s_linear_infinite]" style={{ transform: 'rotateX(60deg)' }} />
           <div className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full border-2 border-[#00F0FF]/10 border-dashed animate-[spin_20s_linear_infinite_reverse]" style={{ transform: 'rotateX(60deg)' }} />
        </div>
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="z-10 flex flex-col items-center max-w-3xl relative w-full">
          <div className="absolute -inset-20 bg-[#00F0FF]/5 blur-[100px] rounded-full animate-pulse pointer-events-none" />
          <Lock size={64} strokeWidth={1} className="text-[#00F0FF] mb-10 drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]" />
          <div className="border border-[#00F0FF]/30 bg-black/80 backdrop-blur-3xl p-12 md:p-20 w-full shadow-[0_0_100px_rgba(0,240,255,0.1),inset_0_0_30px_rgba(0,240,255,0.05)] clip-angled-lg relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent" />
            <h1 className="font-display font-black text-4xl md:text-5xl text-white mb-6 tracking-[0.2em] uppercase">Secure Terminal</h1>
            <p className="text-lg md:text-xl text-[#00F0FF]/70 font-mono tracking-widest mb-12 uppercase">Focal Control Validation Required</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={enterFullscreen} className="relative group w-full py-6 flex items-center justify-center gap-4 bg-[#00F0FF]/10 border border-[#00F0FF]/50 text-[#00F0FF] font-display font-black text-xl md:text-2xl tracking-[0.3em] uppercase overflow-hidden transition-all shadow-[inset_0_0_20px_rgba(0,240,255,0.2)] hover:bg-[#00F0FF] hover:text-black clip-slant">
              <Unlock size={24} className="relative z-10" />
              <span className="relative z-10">Grant Access</span>
            </motion.button>
            <div className="mt-10 bg-red-500/10 border-l-4 border-red-500 p-6 text-left">
               <span className="text-red-500 font-bold flex items-center gap-3 text-sm uppercase tracking-widest mb-2"><AlertTriangle size={18}/> Warning</span>
               <p className="text-white/50 font-mono text-xs uppercase tracking-wider leading-relaxed">Exiting full screen during an active phase will trigger an immediate anti-cheat disqualification.</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] text-white overflow-hidden relative font-body selection:bg-[#00F0FF]/30 flex flex-col" onContextMenu={e => e.preventDefault()}>
      <style dangerouslySetInnerHTML={{__html: `
        .clip-angled-lg { clip-path: polygon(30px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 30px); }
        .clip-slant { clip-path: polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%); }
        .clip-hex { clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(1000%); } }
      `}} />

      {/* HUD & Background stays the same */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,${currentHexColor}15_0%,rgba(0,0,0,1)_80%)] opacity-90 transition-colors duration-1000`} />
         <div className="absolute bottom-[-20%] left-[-50%] w-[200%] h-[100%] [transform:perspective(600px)_rotateX(70deg)] opacity-20 mix-blend-screen" style={{ backgroundImage: `linear-gradient(to right, ${currentHexColor} 1px, transparent 1px), linear-gradient(to bottom, ${currentHexColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
         <div className="absolute top-0 left-0 w-full h-[2px] opacity-30 animate-[scan_5s_linear_infinite]" style={{ backgroundColor: currentHexColor, boxShadow: `0 0 20px ${currentHexColor}` }} />
      </div>

      {/* Disqualification Banner */}
      {(isDisqualifiedLocal || team?.isDisqualified) && (
        <div className="relative z-[100] w-full bg-red-600/90 backdrop-blur-md border-b border-red-400/50 py-2 px-6 flex items-center justify-center gap-4 shadow-[0_5px_20px_rgba(220,38,38,0.5)]">
          <ShieldAlert size={18} className="text-white animate-pulse" />
          <span className="font-display font-black text-[10px] md:text-xs tracking-[0.3em] text-white uppercase">
            Anti-Cheat Protocol Triggered: Team Disqualified. Observations only — cycles will not be recorded.
          </span>
        </div>
      )}

      <div className="relative z-40 w-full bg-[#000]/60 backdrop-blur-2xl border-b border-white/10 flex flex-col">
        <div className="w-full h-1 bg-white/10 relative overflow-hidden">
           <motion.div className="absolute top-0 left-0 h-full" style={{ width: `${timePct * 100}%`, backgroundColor: isUrgent ? '#FF003C' : currentHexColor, transition: 'width 1s linear', boxShadow: `0 0 15px ${isUrgent ? '#FF003C' : currentHexColor}` }} />
        </div>
        <div className="flex items-center justify-between px-6 md:px-12 py-5">
           <div className="flex items-center gap-4">
              <Image src="/gdg-logo.png" alt="GDG" width={40} height={40} className="w-10 h-10 object-contain mr-4 hidden md:block" />

              <div className="flex flex-col">
                 <span className="font-mono text-xs text-white/50 tracking-[0.5em] uppercase">Active Operator</span>
                 <span className="font-display font-black text-2xl text-white uppercase">
                   {team?.players?.[(team?.currentPlayerIndex ?? 0)]?.name || 'OPERATOR'}
                 </span>
              </div>
           </div>
           <div className={`hidden md:flex items-center gap-4 font-display font-black text-4xl tracking-[0.2em] ${isUrgent ? 'text-[#FF003C] animate-pulse' : 'text-white'}`}>
              <Clock size={32} className="text-white/30" />
              {Math.floor(timeLeft / 60)}<span className="text-white/30 mx-1">:</span>{String(timeLeft % 60).padStart(2, '0')}
           </div>
           <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                 <span className="font-mono text-xs text-white/50 tracking-[0.5em] uppercase">Cycles</span>
                 <span className="font-display font-black text-3xl md:text-4xl text-white">{team?.scores?.[`round${round}`] || 0}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="relative flex-1 w-full flex flex-col items-center justify-center px-6 md:px-12 py-8 z-20">
         <div className="w-full max-w-6xl flex flex-col items-center justify-center h-full">
            {!isRoundActive ? (
               <div className="bg-[#000]/40 border border-white/10 rounded-[30px] p-12 backdrop-blur-3xl text-center max-w-xl w-full">
                 <Radar className="w-14 h-14 mx-auto mb-6 animate-spin" style={{ color: currentHexColor }} />
                 <h2 className="font-display font-light text-3xl text-white mb-4 uppercase">
                   <ScrambleText text={session?.status === 'waiting' ? 'Awaiting Uplink' : 'System Suspended'} duration={1200} />
                 </h2>
               </div>
            ) : allAnswered ? (
               <div className="bg-[#000]/40 border border-[#00FF66]/20 rounded-[30px] p-12 backdrop-blur-3xl text-center max-w-xl w-full">
                 <CheckCircle2 className="w-14 h-14 mx-auto mb-6 text-[#00FF66]" />
                 <h2 className="font-display font-light text-4xl text-[#00FF66] mb-4 uppercase">Phase Secured</h2>
                 <button onClick={() => {
                   if (round === 3) router.push(`/quiz/${quizCode}/leaderboard`);
                   else router.push(`/quiz/${quizCode}/team/${teamId}`);
                 }} className="mt-8 px-10 py-4 border border-[#00FF66]/40 text-[#00FF66] hover:bg-[#00FF66]/10 font-mono text-xs tracking-[0.2em] uppercase rounded-full transition-colors">
                   {round === 3 ? 'View Leaderboard' : 'Dashboard'}
                 </button>
               </div>
            ) : (
               <AnimatePresence mode="wait">
                 {currentQ && (
                   <motion.div 
                     key={currentQ._id}
                     initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                     className="w-full h-full flex flex-col items-center"
                   >
                      {/* Progress Bar */}
                      <div className="w-full max-w-3xl mb-12">
                        <div className="flex items-center justify-between mb-4 px-2">
                           <div className="flex flex-col">
                              <span className="font-mono text-xs text-white/30 uppercase tracking-[0.4em]">Mission Progress</span>
                              <span className="font-display font-black text-3xl text-white tracking-widest">
                                 {questions.filter(q => q.isAnswered).length} / {questions.length}
                                 <span className="text-xs text-white/30 ml-3 font-mono tracking-normal uppercase">Nodes Attended</span>
                              </span>
                           </div>
                           <div className="text-right">
                              <span className="font-mono text-xs text-white/30 uppercase tracking-[0.4em]">Completion</span>
                              <div className="font-display font-black text-3xl text-white tracking-widest">
                                 {Math.round((questions.filter(q => q.isAnswered).length / questions.length) * 100)}%
                              </div>
                           </div>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/10">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(questions.filter(q => q.isAnswered).length / questions.length) * 100}%` }}
                              className="h-full rounded-full shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                              style={{ backgroundColor: currentHexColor }}
                           />
                        </div>
                      </div>

                      <div className="font-mono text-xs text-white/50 tracking-[0.8em] uppercase mb-6 flex items-center gap-4 w-full max-w-3xl">
                         <span className="h-[1px] flex-1 opacity-30" style={{ backgroundColor: currentHexColor }} />
                         NODE {currentQIdx + 1} / {questions.length}
                         <span className="h-[1px] flex-1 opacity-30" style={{ backgroundColor: currentHexColor }} />
                      </div>

                     <div className="relative bg-[#000]/60 backdrop-blur-2xl border border-white/10 p-6 md:p-8 text-center w-full max-w-3xl clip-angled-lg mb-6">
                        {/* Emoji Clue Display — shown prominently for Round 2 */}
                        {currentQ.emojiClue && (
                          <div className="text-6xl md:text-7xl mb-4 tracking-widest leading-relaxed">
                            {currentQ.emojiClue}
                          </div>
                        )}
                        <h2 className="font-display font-bold text-3xl md:text-4xl text-white leading-tight">
                           <ScrambleText text={currentQ.question} duration={1000} />
                        </h2>
                     </div>

                     {currentQ.type === 'match' ? (
                       <MatchInterface 
                         data={currentQ.matchData} 
                         onComplete={submitAnswer} 
                         isSubmitting={submitting} 
                         accentColor={currentHexColor} 
                       />
                     ) : (
                       <div className="w-full flex flex-col items-center gap-8 bg-black/40 p-8 rounded-3xl border border-white/5 shadow-2xl">
                          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentQ.options?.map((opt, i) => (
                              <motion.button
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => !submitting && setSelectedAnswer(opt)}
                                disabled={submitting}
                                className={`relative p-5 md:p-6 text-left border rounded-xl backdrop-blur-md transition-all ${
                                  selectedAnswer === opt 
                                    ? 'border-white bg-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                                    : 'border-white/10 bg-white/5 hover:border-white/40 hover:bg-white/10'
                                }`}
                                style={{ borderColor: selectedAnswer === opt ? currentHexColor : undefined }}
                              >
                                {selectedAnswer === opt && (
                                  <div className="absolute inset-0 rounded-xl opacity-20 pointer-events-none" style={{ backgroundColor: currentHexColor }} />
                                )}
                                <div className="flex items-center gap-5 relative z-10">
                                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-display font-black text-xl transition-colors shadow-lg ${
                                    selectedAnswer === opt ? 'bg-black text-white border-white' : 'border-white/20 text-white/50 bg-black/50'
                                  }`} style={{ borderColor: selectedAnswer === opt ? currentHexColor : undefined }}>
                                    {['A', 'B', 'C', 'D'][i]}
                                  </div>
                                  <span className={`text-lg md:text-xl font-body font-bold tracking-wide transition-colors ${selectedAnswer === opt ? 'text-white' : 'text-white/70'}`}>{opt}</span>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                          
                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: selectedAnswer ? 1 : 0, y: selectedAnswer ? 0 : 10 }}
                            disabled={!selectedAnswer || submitting}
                            onClick={() => submitAnswer(selectedAnswer)}
                            className="group relative flex items-center justify-center gap-4 px-12 py-5 bg-white text-black font-display font-black text-lg tracking-[0.3em] uppercase rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-0 shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-full max-w-md"
                            style={{ backgroundColor: currentHexColor }}
                          >
                            <Send size={24} />
                            Transmit Signature
                          </motion.button>
                        </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
            )}
         </div>
      </div>

      {/* F1-Style Live Leaderboard */}
      {isRoundActive && (
        <div className="absolute right-0 top-[88px] z-50 w-72 hidden xl:flex flex-col">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes f1-scan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(400%); opacity: 0; } }
            @keyframes rank-pulse { 0%,100% { box-shadow: 0 0 0px currentColor; } 50% { box-shadow: 0 0 12px currentColor; } }
            @keyframes data-flicker { 0%,100% { opacity: 1; } 95% { opacity: 0.7; } }
            .f1-row-enter { animation: f1-row-in 0.4s cubic-bezier(0.16,1,0.3,1) both; }
            @keyframes f1-row-in { from { opacity:0; transform: translateX(30px); } to { opacity:1; transform: translateX(0); } }
            .lb-score { animation: data-flicker 4s infinite; }
          `}} />

          {/* Panel Header */}
          <div className="relative bg-black/80 backdrop-blur-2xl border-l border-t border-b border-white/10 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}>
            
            {/* Accent top bar */}
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(to right, transparent, ${currentHexColor}, transparent)` }} />
            
            {/* Scan line */}
            <div className="absolute left-0 w-full h-8 opacity-10 pointer-events-none" 
              style={{ background: `linear-gradient(to bottom, transparent, ${currentHexColor}, transparent)`, animation: 'f1-scan 4s linear infinite' }} />

            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Activity size={13} style={{ color: currentHexColor }} />
                  <div className="absolute inset-0 animate-ping opacity-40" style={{ color: currentHexColor }}>
                    <Activity size={13} />
                  </div>
                </div>
                <span className="font-display font-black text-[10px] uppercase tracking-[0.35em] text-white">Live Timing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentHexColor, boxShadow: `0 0 6px ${currentHexColor}` }} />
                <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: currentHexColor }}>
                  Phase 0{round}
                </span>
              </div>
            </div>
          </div>

          {/* Rank Rows */}
          <div className="bg-black/70 backdrop-blur-2xl border-l border-b border-white/[0.07] flex flex-col overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 0px) 100%, 16px 100%, 0 100%)' }}>
            
            {(() => {
              const topN = leaderboard.slice(0, 8);
              const myTeam = leaderboard.find(t => t.teamId === team?.teamId);
              const myRankInTopN = topN.find(t => t.teamId === team?.teamId);
              const rows = [...topN];
              
              // Medal colors for top 3
              const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
              const medalGlows  = ['rgba(255,215,0,0.3)', 'rgba(192,192,192,0.2)', 'rgba(205,127,50,0.2)'];

              return (
                <>
                  {rows.map((t, idx) => {
                    const isMe = t.teamId === team?.teamId;
                    const isMedal = idx < 3;
                    const accentCol = isMedal ? medalColors[idx] : isMe ? currentHexColor : 'rgba(255,255,255,0.3)';
                    const score = t.scores?.[`round${round}`] || 0;

                    return (
                      <motion.div
                        key={t.teamId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className="relative flex items-center group"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isMe
                            ? `linear-gradient(to right, ${currentHexColor}18, ${currentHexColor}08, transparent)`
                            : isMedal
                            ? `linear-gradient(to right, ${medalColors[idx]}10, transparent)`
                            : 'transparent',
                        }}
                      >
                        {/* Left accent bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300"
                          style={{
                            backgroundColor: isMe ? currentHexColor : isMedal ? medalColors[idx] : 'transparent',
                            boxShadow: isMe ? `0 0 8px ${currentHexColor}` : isMedal ? `0 0 6px ${medalColors[idx]}` : 'none',
                          }} />

                        {/* Rank Number */}
                        <div className="flex-shrink-0 w-10 flex items-center justify-center py-3 pl-3">
                          {isMedal ? (
                            <div className="w-6 h-6 rounded-sm flex items-center justify-center font-display font-black text-[11px]"
                              style={{
                                backgroundColor: `${medalColors[idx]}22`,
                                color: medalColors[idx],
                                boxShadow: `0 0 8px ${medalGlows[idx]}`,
                                border: `1px solid ${medalColors[idx]}50`,
                              }}>
                              {t.rank}
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] font-bold" style={{ color: isMe ? currentHexColor : 'rgba(255,255,255,0.25)' }}>
                              {String(t.rank).padStart(2, '0')}
                            </span>
                          )}
                        </div>

                        {/* Team Name */}
                        <div className="flex-1 min-w-0 pr-2 py-3">
                          <div className={`font-display font-black text-[11px] uppercase tracking-wider truncate transition-colors ${isMe ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>
                            {t.teamName}
                          </div>
                          {isMe && (
                            <div className="font-mono text-[8px] tracking-[0.3em] uppercase mt-0.5" style={{ color: currentHexColor }}>
                              ◆ YOU
                            </div>
                          )}
                        </div>

                        {/* Score */}
                        <div className="flex-shrink-0 pr-4 py-3 text-right">
                          <div className="lb-score font-display font-black text-sm leading-none"
                            style={{ color: isMe ? currentHexColor : isMedal ? medalColors[idx] : 'rgba(255,255,255,0.6)' }}>
                            {score}
                          </div>
                          <div className="font-mono text-[7px] text-white/20 tracking-widest uppercase mt-0.5">pts</div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Separator + current team if not in top 8 */}
                  {myTeam && !myRankInTopN && (
                    <>
                      <div className="flex items-center gap-2 px-4 py-1">
                        <div className="flex-1 h-[1px] bg-white/5" />
                        <span className="font-mono text-[8px] text-white/20 tracking-widest">• • •</span>
                        <div className="flex-1 h-[1px] bg-white/5" />
                      </div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative flex items-center"
                        style={{ background: `linear-gradient(to right, ${currentHexColor}22, ${currentHexColor}0a, transparent)` }}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{ backgroundColor: currentHexColor, boxShadow: `0 0 8px ${currentHexColor}` }} />
                        <div className="flex-shrink-0 w-10 flex items-center justify-center py-3 pl-3">
                          <span className="font-mono text-[11px] font-bold" style={{ color: currentHexColor }}>
                            {String(myTeam.rank).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pr-2 py-3">
                          <div className="font-display font-black text-[11px] uppercase tracking-wider truncate text-white">
                            {myTeam.teamName}
                          </div>
                          <div className="font-mono text-[8px] tracking-[0.3em] uppercase mt-0.5" style={{ color: currentHexColor }}>◆ YOU</div>
                        </div>
                        <div className="flex-shrink-0 pr-4 py-3 text-right">
                          <div className="font-display font-black text-sm leading-none" style={{ color: currentHexColor }}>
                            {myTeam.scores?.[`round${round}`] || 0}
                          </div>
                          <div className="font-mono text-[7px] text-white/20 tracking-widest uppercase mt-0.5">pts</div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </>
              );
            })()}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04]">
              <span className="font-mono text-[8px] text-white/15 uppercase tracking-[0.4em]">
                {leaderboard.length} Nodes
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-white/20 animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
