'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, Send, Lock, Cpu, Flag, Zap, Gauge, Timer } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useAnimationFrame } from 'framer-motion';
import LeaderboardPage from '@/app/quiz/[quizCode]/leaderboard/page';

// --- Standby State: Powered Down Hypercar Console ---
// --- Standby State: Powered Down Hypercar Console ---
function PoweredDownConsole({ team, session, isTimeExpired }) {
  const currentRound = session?.currentRound || 1;
  const status = session?.status || 'waiting';
  const isRoundEnded = status.endsWith('_ended') || (status === 'ready' && currentRound > 0) || status === 'finished' || isTimeExpired;

  // Player sequence:
  // Pre-game / Round 1 waiting/active → Player 1 is current (index 0)
  // After Round 1 ends → Player 2 is next (index 1)
  // Round 2 waiting/active → Player 2 is current (index 1)
  // After Round 2 ends → Player 3 is next (index 2)
  // Round 3 waiting/active → Player 3 is current (index 2)
  // finished → no display

  let displayPlayerIndex = 0;
  let isNextPlayer = false;

  if (status === 'finished') {
    displayPlayerIndex = -1;
  } else if (status === 'round1_ended' || (status === 'ready' && currentRound === 1)) {
    displayPlayerIndex = 1; // Next: Player 2 (index 1)
    isNextPlayer = true;
  } else if (status === 'round2_ended' || (status === 'ready' && currentRound === 2)) {
    displayPlayerIndex = 2; // Next: Player 3 (index 2)
    isNextPlayer = true;
  } else {
    // waiting, active states — currentPlayerIndex is set correctly by the API
    displayPlayerIndex = Math.max(0, currentRound - 1);
    isNextPlayer = false;
  }

  // Get actual player — do NOT use modulo (that causes wrong player to show)
  const playerAtIndex = displayPlayerIndex >= 0 ? team?.players?.[displayPlayerIndex] : null;
  // If player doesn't exist at that index, show a numbered placeholder
  const displayPlayer = playerAtIndex || (displayPlayerIndex >= 0 ? { name: `PLAYER ${displayPlayerIndex + 1}` } : null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 1.05, filter: 'blur(20px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center justify-center w-full max-w-[1400px] h-[500px]"
    >
      <div className="absolute inset-0 bg-[#050508]/80 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)_inset] flex flex-col items-center justify-center overflow-hidden" style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>

        {/* Cyber-grid and Ambient Orbs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#4285F4]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#EA4335]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Horizontal Scanner Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-[#4285F4] shadow-[0_0_20px_#4285F4] animate-[scan_4s_ease-in-out_infinite]" />

        <div className="relative z-10 flex flex-col items-center">
          {/* GDG / Cyberpunk Lock Icon */}
          <div className="w-24 h-24 border border-white/10 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 border-2 border-dashed border-[#4285F4]/30 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-4 border border-[#EA4335]/30 rounded-full animate-[spin_5s_linear_infinite_reverse]" />
            <Image src="/gdg-logo.png" alt="GDG Logo" width={40} height={40} className="w-10 h-10 animate-pulse" priority />
          </div>

          <div className="text-xs font-mono tracking-[0.8em] text-[#4285F4] uppercase mb-2">GDG_CORE // TELEMETRY LINK</div>
          <div className="text-5xl font-black tracking-[0.4em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {isRoundEnded ? 'HALTED' : 'STANDBY'}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${isRoundEnded ? 'bg-red-600' : 'bg-[#FBBC05]'}`} />
            <div className="text-xs font-mono tracking-[0.4em] text-gray-400 uppercase">
              {isRoundEnded
                ? 'Protocol Terminated. Synchronization Required.'
                : 'Awaiting Arena Initialization...'}
            </div>
          </div>

          {displayPlayer && (
            <div className="mt-10 flex flex-col items-center">
              <div className="text-xs font-mono tracking-[0.6em] text-white/40 uppercase mb-3 italic">
                {isNextPlayer ? 'UPNEXT_OPERATOR' : 'CURRENT_OPERATOR'}
              </div>
              <div className="px-10 py-3 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="text-xl font-display font-black tracking-[0.3em] text-[#FBBC05] uppercase drop-shadow-[0_0_10px_rgba(251,184,0,0.3)]">
                  {displayPlayer.name}
                </div>
              </div>
              {isNextPlayer && (
                <div className="mt-4 font-mono text-xs text-red-600 animate-pulse tracking-[0.4em] uppercase">Prepare for Tactical Integration</div>
              )}
            </div>
          )}
        </div>

        {/* Angular Background Lines */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </div>
    </motion.div>
  );
}

// --- Active State: Angular Hypercar Speedometer ---
function ActiveHyperSpeedometer({ session, team }) {
  const round = session?.currentRound || 1;
  const isR1 = round === 1;
  const isR2 = round === 2;

  // High-end Hypercar Colors
  const themeColor = isR1 ? '#00E5FF' : isR2 ? '#FFB800' : '#FF003C';
  const targetPct = isR1 ? 0.35 : isR2 ? 0.68 : 0.98;

  // Physical, heavy spring for the needle
  const motionPct = useMotionValue(0);
  const springPct = useSpring(motionPct, { stiffness: 90, damping: 12, mass: 1.5 });

  useEffect(() => {
    // Dramatic power-on sweep
    const t1 = setTimeout(() => motionPct.set(1), 500); // Rev to max
    const t2 = setTimeout(() => motionPct.set(targetPct), 1200); // Settle at target

    const interval = setInterval(() => {
      // Violent mechanical jitter
      if (Math.random() > 0.85) {
        // "Gear shift" drop
        motionPct.set(Math.max(0, targetPct - (0.15 + Math.random() * 0.1)));
        setTimeout(() => motionPct.set(targetPct + Math.random() * 0.05), 250);
      } else {
        // Constant vibration
        motionPct.set(targetPct + (Math.random() - 0.5) * 0.02);
      }
    }, 500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(interval); };
  }, [targetPct, motionPct]);

  // Polygon calculations (Custom angular shape instead of perfect circle)
  // We'll create a sweeping arc using a path, but make the needle an angular physical object
  const cx = 700, cy = 500, r = 450;

  // Angles: -70 to 70 for a flatter, wider sweep common in supercars
  const angleRange = 140;
  const startAngle = -70;
  const needleAngle = useTransform(springPct, [0, 1], [startAngle, startAngle + angleRange]);

  // Track fill percentage for an SVG path dashoffset is tricky for arbitrary paths,
  // but we can map the dashoffset of a massive circle exactly to the angle range.
  const circum = 2 * Math.PI * r;
  const visibleArcLength = (angleRange / 360) * circum;

  // Offset goes from visibleArcLength (empty) to 0 (full)
  const trackOffset = useTransform(springPct, [0, 1], [visibleArcLength, 0]);

  // Digital RPM
  const rpmValue = useTransform(springPct, [0, 1], [0, 12000]);
  const [displayRpm, setDisplayRpm] = useState('00000');
  useAnimationFrame(() => {
    setDisplayRpm(Math.round(rpmValue.get()).toString().padStart(5, '0'));
  });

  // Ticks for the angular path
  const ticks = [];
  for (let i = 0; i <= 40; i++) {
    const pct = i / 40;
    const angle = startAngle + (pct * angleRange);
    const rad = (angle - 90) * Math.PI / 180; // -90 because 0 is straight up in our rotation logic

    const isMajor = i % 5 === 0;
    const rIn = isMajor ? r - 40 : r - 15;
    const rOut = r;

    let tickColor = 'rgba(255,255,255,0.1)';
    if (pct <= 0.35) tickColor = 'rgba(0, 229, 255, 0.4)';
    else if (pct <= 0.68) tickColor = 'rgba(255, 184, 0, 0.4)';
    else tickColor = 'rgba(255, 0, 60, 0.4)';

    ticks.push(
      <line
        key={`t${i}`}
        x1={cx + rIn * Math.cos(rad)} y1={cy + rIn * Math.sin(rad)}
        x2={cx + rOut * Math.cos(rad)} y2={cy + rOut * Math.sin(rad)}
        stroke={tickColor} strokeWidth={isMajor ? "6" : "3"}
        strokeLinecap="square"
      />
    );

    if (isMajor) {
      const numR = r - 70;
      const val = Math.round(pct * 12);
      ticks.push(
        <text key={`n${i}`} x={cx + numR * Math.cos(rad)} y={cy + numR * Math.sin(rad) + 10}
          fill={pct <= 0.35 ? '#00E5FF' : pct <= 0.68 ? '#FFB800' : '#FF003C'}
          fontSize="36" fontFamily="sans-serif" fontStyle="italic" fontWeight="900" textAnchor="middle" opacity="0.8">
          {val}
        </text>
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateX: 30 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ duration: 1.2, type: 'spring', bounce: 0.2 }}
      className="relative flex items-center justify-center w-full max-w-[1400px] h-[450px] md:h-[550px]"
      style={{ perspective: '1000px' }}
    >
      <div className="absolute top-[60%] w-[100%] h-[40%] bg-gradient-to-t from-black to-transparent z-20 pointer-events-none" />

      {/* Massive Angular Dashboard Canvas */}
      <svg viewBox="0 0 1400 600" className="w-full h-full relative z-10 overflow-visible drop-shadow-[0_30px_50px_rgba(0,0,0,0.9)]">
        <defs>
          <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="hyper-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4 12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="solidTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#FFB800" />
            <stop offset="100%" stopColor="#FF003C" />
          </linearGradient>
        </defs>

        {/* Dark Brushed Metal Base shape */}
        <path d={`M 100,600 L 300,100 L 1100,100 L 1300,600 Z`} fill="#080808" stroke="#222" strokeWidth="4" />
        <path d={`M 120,600 L 310,120 L 1090,120 L 1280,600 Z`} fill="none" stroke="#111" strokeWidth="2" />

        {/* Track Background */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke="#111" strokeWidth="60"
          strokeDasharray={`${visibleArcLength} ${circum}`}
          style={{ transform: `rotate(${startAngle - 90}deg)`, transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Ticks */}
        <g>{ticks}</g>

        {/* Liquid Light Active Track */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke="url(#solidTrack)" strokeWidth="60"
          strokeDasharray={`${visibleArcLength} ${circum}`}
          style={{
            strokeDashoffset: trackOffset,
            transform: `rotate(${startAngle - 90}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            filter: 'url(#neon)'
          }}
        />

        {/* Telemetry Geometry (Left & Right Wings) */}
        <g opacity="0.8">
          {/* Left Wing - Scores */}
          <path d="M 200,450 L 350,250 L 500,250 L 400,450 Z" fill="#030303" stroke="#222" strokeWidth="2" />
          <text x="350" y="320" fill="gray" fontSize="14" fontFamily="mono" tracking="widest" textAnchor="middle">SCORE</text>
          <text x="360" y="400" fill="#fff" fontSize="64" fontFamily="sans-serif" fontStyle="italic" fontWeight="900" textAnchor="middle">{team?.scores?.total || 0}</text>

          {/* Right Wing - Phase Info */}
          <path d="M 1200,450 L 1050,250 L 900,250 L 1000,450 Z" fill="#030303" stroke="#222" strokeWidth="2" />
          <text x="1050" y="320" fill="gray" fontSize="14" fontFamily="mono" tracking="widest" textAnchor="middle">GEAR</text>
          <text x="1040" y="400" fill={themeColor} fontSize="64" fontFamily="sans-serif" fontStyle="italic" fontWeight="900" textAnchor="middle" filter="url(#neon)">0{round}</text>

        </g>

        {/* Massive Center Block */}
        <path d={`M ${cx - 150},${cy} L ${cx - 100},${cy - 180} L ${cx + 100},${cy - 180} L ${cx + 150},${cy} Z`} fill="#0a0a0a" stroke="#111" strokeWidth="8" />

        <text x={cx} y={cy - 140} fill="rgba(255,255,255,0.2)" fontSize="18" fontFamily="mono" tracking="widest" textAnchor="middle">REV/MIN</text>
        <text x={cx} y={cy - 50} fill="#fff" fontSize="80" fontFamily="sans-serif" fontStyle="italic" fontWeight="900" textAnchor="middle" filter="url(#neon)">
          {displayRpm}
        </text>

        {/* Aggressive Angular Needle */}
        <motion.g style={{ rotate: needleAngle, originX: `${cx}px`, originY: `${cy}px` }}>

          {/* Faint trails */}
          <polygon points={`${cx},${cy - 20} ${cx},${cy} ${cx},${cy - r + 80}`} fill={themeColor} opacity="0.3" filter="url(#hyper-blur)" transform={`rotate(-4, ${cx}, ${cy})`} />
          <polygon points={`${cx},${cy - 20} ${cx},${cy} ${cx},${cy - r + 80}`} fill={themeColor} opacity="0.5" filter="url(#hyper-blur)" transform={`rotate(-2, ${cx}, ${cy})`} />

          {/* Physical Shard Base */}
          <polygon points={`${cx - 30},${cy + 20} ${cx + 30},${cy + 20} ${cx},${cy - r + 50}`} fill="#111" />
          <polygon points={`${cx - 15},${cy + 10} ${cx + 15},${cy + 10} ${cx},${cy - r + 60}`} fill="#222" />

          {/* Glowing Center Line */}
          <polygon points={`${cx - 2},${cy} ${cx + 2},${cy} ${cx},${cy - r + 20}`} fill="#fff" filter="url(#neon)" />

          {/* Glowing Tip */}
          <polygon points={`${cx - 10},${cy - r + 100} ${cx + 10},${cy - r + 100} ${cx},${cy - r - 10}`} fill={themeColor} filter="url(#neon)" />

          {/* Central Hub */}
          <path d={`M ${cx - 50},${cy + 40} L ${cx - 30},${cy - 30} L ${cx + 30},${cy - 30} L ${cx + 50},${cy + 40} Z`} fill="#050505" stroke="#222" strokeWidth="4" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

// --- Player Dashboard Overhaul ---
export default function TeamClient({ initialTeam, initialSession }) {
  const { teamId, quizCode } = useParams();
  const router = useRouter();
  const [team, setTeam] = useState(initialTeam);
  const [session, setSession] = useState(initialSession);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  useEffect(() => {
    if (!session?.roundEndTime) {
      setIsTimeExpired(false);
      return;
    }
    const checkExpiration = () => {
      const expired = new Date(session.roundEndTime) <= new Date();
      setIsTimeExpired(expired);
    };
    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [session?.roundEndTime]);

  useEffect(() => {
    if (!teamId || !quizCode) return;
    fetchTeam();

    const socket = getSocket();
    socket.emit('join_team', { teamId, quizCode });

    const onSessionUpdate = (newSession) => setSession(newSession);
    const onLeaderboardUpdate = (newLeaderboard) => {
      setLeaderboardData(newLeaderboard);
      const myRank = newLeaderboard.find(t => t.teamId === teamId);
      if (myRank) {
        setRankInfo({
          rank: myRank.rank,
          total: newLeaderboard.length
        });
      }
    };

    socket.on('session_update', onSessionUpdate);
    socket.on('leaderboard_update', onLeaderboardUpdate);

    // Fallback polling (much slower)
    const interval = setInterval(() => {
      if (!document.hidden) fetchTeam();
    }, 60000);

    const handleVisibility = () => {
      if (!document.hidden) fetchTeam();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('session_update', onSessionUpdate);
      socket.off('leaderboard_update', onLeaderboardUpdate);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [teamId, quizCode]);

  async function fetchTeam() {
    if (document.hidden) return;
    try {
      const res = await fetch(`/api/teams/${teamId}?quizCode=${quizCode}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setTeam(data.team);
      setSession(data.session);
    } catch { }
  }

  const globalStyles = `
    body { background-color: #030303; margin: 0; padding: 0; }
    @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }

  `;



  const isActive = session?.status === 'active' || session?.status?.includes('_active');
  const isFinished = session?.status === 'finished';
  const [analysisQuestions, setAnalysisQuestions] = useState([]);
  const [analysisRound, setAnalysisRound] = useState(0);
  const [briefingQuestions, setBriefingQuestions] = useState([]);

  const latestAvailableRound = useMemo(() => {
    const r = session?.currentRound || 1;
    const roundKey = `round${r}`;
    const answeredCount = team?.answeredQuestions?.[roundKey]?.length || 0;
    const hasFinishedCurrentRound = (briefingQuestions && briefingQuestions.length > 0) && answeredCount >= briefingQuestions.length;
    const isRoundEnded = session?.status === `round${r}_ended` || session?.status === 'finished' || (session?.currentRound > r);

    if (team?.isEliminated || team?.isDisqualified) return r;
    if (isFinished || hasFinishedCurrentRound || isRoundEnded) return r;
    if (r > 1) return r - 1;
    return 0;
  }, [
    team?.isEliminated, 
    team?.isDisqualified,
    team?.eliminatedAtRound, 
    team?.answeredQuestions, 
    session?.currentRound, 
    session?.status,
    isFinished, 
    briefingQuestions?.length
  ]);

  useEffect(() => {
    if (latestAvailableRound > 0) {
      setAnalysisRound(latestAvailableRound);
    }
  }, [latestAvailableRound]);

  const currentRound = session?.currentRound || 1;
  const isPastRound = analysisRound < currentRound;
  const isRoundCompleted = analysisQuestions.length > 0 && (team?.answeredQuestions?.[`round${analysisRound}`]?.length === analysisQuestions.length);
  const isCurrentRoundEnded = session?.status === `round${analysisRound}_ended`;
  const isAnalysisUnlocked = isPastRound || isFinished || isRoundCompleted || isCurrentRoundEnded || team?.isEliminated || team?.isDisqualified;

  const answeredCountCurrentRound = team?.answeredQuestions?.[`round${currentRound}`]?.length || 0;
  const hasFinishedCurrentRound = briefingQuestions.length > 0 && answeredCountCurrentRound >= briefingQuestions.length;

  // Analysis section: a round button appears when the team has ANY answers for that round
  // AND the round is in the past OR the session is finished
  const visibleRounds = [];
  for (let r = 1; r <= 3; r++) {
    const roundIsOfficiallyDone =
      session?.status === 'finished' ||
      session?.status === `round${r}_ended` ||
      (session?.status === 'ready' && r === session?.currentRound) ||
      r < (session?.currentRound || 1) ||
      team?.isEliminated || 
      team?.isDisqualified;
    
    const answeredForRound = team?.answeredQuestions?.[`round${r}`]?.length || 0;
    const roundKey = `round${r}`;
    
    // Show round if it's officially done OR if the team has finished it early
    if (roundIsOfficiallyDone || (answeredForRound > 0 && r === (session?.currentRound || 1))) {
      visibleRounds.push(r);
    }
  }

  useEffect(() => {
    if (analysisRound > 0) {
      fetchAnalysis(analysisRound);
    }
  }, [analysisRound]);

  useEffect(() => {
    const round = session?.currentRound || 1;
    fetchBriefing(round);
  }, [session?.currentRound]);

  async function fetchBriefing(round) {
    try {
      const res = await fetch(`/api/game/questions?teamId=${teamId}&round=${round}&quizCode=${quizCode}`, { cache: 'no-store' });
      const data = await res.json();
      setBriefingQuestions(data.questions || []);
    } catch { }
  }

  async function fetchAnalysis(round) {
    try {
      const res = await fetch(`/api/game/questions?teamId=${teamId}&round=${round}&quizCode=${quizCode}`, { cache: 'no-store' });
      const data = await res.json();
      setAnalysisQuestions(data.questions || []);
    } catch { }
  }

  // Leaderboard and Qualification Logic
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [rankInfo, setRankInfo] = useState(null);
  const [showQualificationOverlay, setShowQualificationOverlay] = useState(false);

  useEffect(() => {
    if (!quizCode || !teamId) return;
    async function fetchLeaderboard() {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/leaderboard?quizCode=${quizCode}&limit=10&teamId=${teamId}`);
        const lbData = await res.json();
        
        let finalLb = lbData.leaderboard || [];
        if (lbData.targetTeam && !finalLb.some(t => t.teamId === teamId)) {
          finalLb.push(lbData.targetTeam);
        }
        setLeaderboardData(finalLb);

        const myRank = lbData.targetTeam;
        if (myRank) {
          setRankInfo({
            rank: myRank.rank,
            total: lbData.totalTeams || finalLb.length
          });
        }
      } catch { }
    }
    fetchLeaderboard();
    return () => {};
  }, [teamId, quizCode]);

  // Qualification: use a ref to track which rounds have shown overlay (resets per page load)
  const shownRoundsRef = useRef(new Set());
  const currentRoundNum = session?.currentRound || 1;
  const roundEnded = session?.status === `round${currentRoundNum}_ended` || session?.status === 'finished' || (session?.currentRound > currentRoundNum);

  useEffect(() => {
    if (!roundEnded || team?.isDisqualified || team?.isEliminated) return;
    const key = `r${currentRoundNum}`;
    if (shownRoundsRef.current.has(key)) return;
    // Show with a short delay regardless of rankInfo (we may not have it yet)
    const timer = setTimeout(() => {
      shownRoundsRef.current.add(key);
      setShowQualificationOverlay(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [roundEnded, currentRoundNum]);

  const acknowledgeQualification = () => {
    setShowQualificationOverlay(false);
  };

  // Qualification Calculation: Top 80% of leaderboard
  const isQualified = rankInfo ? rankInfo.rank <= Math.max(1, Math.floor(rankInfo.total * 0.8)) : true;
  const showQualificationStatus = roundEnded;

  const isGameFinished = session?.status === 'finished' || session?.status === 'round3_ended';
  const shouldShowLeaderboard = team?.isDisqualified || team?.isEliminated || isGameFinished || hasFinishedCurrentRound;

  if (shouldShowLeaderboard) {
    return <LeaderboardPage />;
  }

  return (
    <div className="min-h-screen w-full bg-[#030303] text-white font-sans flex flex-col relative selection:bg-red-600/30 overflow-y-auto">
      <style>{globalStyles}</style>

      {/* Brutalist Background */}
      <div className="absolute inset-0 bg-[url('/images/carbon-fibre.png')] opacity-20 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none z-0 opacity-20" />

      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-[#030303]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Image src="/gdg-logo.png" alt="GDG" width={48} height={48} className="w-12 h-12 object-contain" />
          <div className="w-1 h-8 bg-red-600/30" />
          <div className="flex flex-col">
            <div className="font-display font-black text-xl tracking-[0.3em] uppercase opacity-90">{team?.teamName}</div>
            {team?.teamNumber && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.4em]">TEAM ID</span>
                <span className="font-display font-black text-sm tracking-[0.3em] text-[#FFB800] drop-shadow-[0_0_8px_rgba(251,184,0,0.5)]">
                  {String(team.teamNumber).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>

        <Link href="/" className="font-mono text-xs text-gray-500 hover:text-white tracking-[0.5em] uppercase transition-colors">
          [ Disconnect ]
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center relative z-10 pt-20 pb-40">

        <div className="flex gap-4 mb-8">
          <button onClick={() => document.getElementById('briefing-section')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-mono text-xs tracking-widest text-gray-400 uppercase transition-all">Quick_Link: Briefing</button>
          {visibleRounds.length > 0 && analysisRound > 0 && analysisQuestions.length > 0 && (
            <button onClick={() => document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 rounded-full font-mono text-xs tracking-widest text-red-500 uppercase transition-all">Quick_Link: Analysis</button>
          )}
        </div>

        {/* Disqualification / Warning Banner */}
        {(team?.isDisqualified) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl px-6 mb-10"
          >
            <div className="bg-red-600/10 border-2 border-red-600/50 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 shadow-[0_0_50px_rgba(220,38,38,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />
              <ShieldAlert size={48} className="text-red-600 animate-pulse" />
              <div className="flex flex-col gap-2 text-center md:text-left">
                <span className="font-display font-black text-2xl text-red-600 tracking-[0.2em] uppercase">Security Breach Detected</span>
                <p className="font-mono text-xs text-red-400/80 leading-relaxed uppercase tracking-widest">
                  Anti-cheat protocol has been triggered for this unit. You have been placed in observation mode. Cycles (scores) will not be registered in the global mainframe.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* High-End Tactical Assessment Overlay */}
        <AnimatePresence>
          {showQualificationOverlay && showQualificationStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-[20px] flex items-center justify-center p-4 md:p-8"
            >
              {/* Animated HUD Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px]" />
                <motion.div
                  animate={{ y: ['0%', '100%'], opacity: [0, 1, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-white/[0.05] to-transparent"
                />
              </div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.9, rotateX: 10 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    rotateX: 0,
                    transition: { duration: 1, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1 }
                  }
                }}
                initial="hidden"
                animate="visible"
                className="relative w-full max-w-4xl flex flex-col items-center justify-center scale-90 md:scale-100"
              >
                {/* Orbital Status Ring */}
                <div className="relative mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={`absolute -inset-12 border-2 border-dashed rounded-full opacity-10 ${isQualified ? 'border-gdg-green' : 'border-red-600'}`}
                  />

                  <motion.div
                    variants={{ hidden: { scale: 0 }, visible: { scale: 1 } }}
                    className={`w-24 h-24 rounded-full bg-black border-4 flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(0,0,0,1)] ${isQualified ? 'border-gdg-green' : 'border-red-600'}`}
                  >
                    {isQualified ?
                      <Zap size={36} className="text-gdg-green drop-shadow-[0_0_12px_#34A853]" /> :
                      <ShieldAlert size={36} className="text-red-600 drop-shadow-[0_0_12px_#EA4335]" />
                    }
                  </motion.div>
                </div>

                {/* Primary Data Readout */}
                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col items-center mb-10">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs tracking-[0.6em] uppercase opacity-40">System_Assessment // Phase_0{currentRoundNum}</span>
                  </div>

                  <h2 className={`text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-3 ${isQualified ? 'text-white' : 'text-red-600'}`}>
                    {isQualified ? 'QUALIFIED' : 'ELIMINATED'}
                  </h2>

                  <div className={`px-6 py-1.5 rounded-full border font-mono text-xs tracking-[0.3em] uppercase ${isQualified ? 'bg-gdg-green/10 border-gdg-green/40 text-gdg-green' : 'bg-red-600/10 border-red-600/40 text-red-600'}`}>
                    {isQualified ? 'ACCESS_GRANTED' : 'MISSION_CRITICAL_FAILURE'}
                  </div>
                </motion.div>

                {/* Metric Grid - High End Cards */}
                {rankInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-12">
                    {[
                      { label: 'GLOBAL STANDING', val: `${rankInfo.rank} / ${rankInfo.total}`, icon: Flag, color: '#4285F4' },
                      { label: 'TACTICAL ACCURACY', val: `${Math.round((team?.scores?.[`round${currentRoundNum}`] / 10) * 100) || 0}%`, icon: Cpu, color: isQualified ? '#34A853' : '#EA4335' },
                      { label: 'SURVIVAL INDEX', val: `${Math.round((1 - (rankInfo.rank - 1) / rankInfo.total) * 100)}th`, icon: Gauge, color: '#FBBC05' }
                    ].map((m, i) => (
                      <motion.div
                        key={i}
                        variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}
                        className="group relative bg-[#080808]/80 border border-white/5 p-6 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-full -translate-y-8 translate-x-8" />
                        <div className="relative z-10">
                          <m.icon size={14} style={{ color: m.color }} className="mb-3 opacity-70" />
                          <div className="font-mono text-xs text-gray-500 tracking-[0.3em] uppercase mb-1">{m.label}</div>
                          <div className="text-3xl font-display font-black italic text-white tracking-wider">{m.val}</div>
                        </div>
                        <motion.div
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none"
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full max-w-4xl mb-12 flex items-center justify-center py-8 gap-3">
                    <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
                    <span className="font-mono text-xs text-white/30 tracking-[0.4em] uppercase">Loading Tactical Data...</span>
                    <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
                  </div>
                )}

                {/* Action Interface */}
                <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="w-full max-w-xs mt-4">
                  <button
                    onClick={acknowledgeQualification}
                    className={`group relative w-full py-4 font-display font-black tracking-[0.5em] uppercase transition-all overflow-hidden rounded-xl border ${isQualified ? 'bg-gdg-green border-gdg-green text-black' : 'bg-red-600 border-red-600 text-white'
                      }`}
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10">CONTINUE</span>
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Speedometer Section */}
        <div id="telemetry-link" className="w-full flex items-center justify-center min-h-[400px] md:min-h-[500px]">
          <AnimatePresence mode="wait">
            {isActive && !isTimeExpired ? (
              <ActiveHyperSpeedometer key="speedometer" session={session} team={team} />
            ) : (
              <PoweredDownConsole key="console" team={team} session={session} isTimeExpired={isTimeExpired} />
            )}
          </AnimatePresence>
        </div>

        {/* Mission Briefing Section (Racing Style) */}
        <div id="briefing-section" className="w-full max-w-5xl px-6 mt-20 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/checkered-flag.png')] opacity-5 pointer-events-none mix-blend-overlay" />

          <div className="flex items-center gap-6 mb-12">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />
            <div className="flex flex-col items-center">
              <span className="font-display font-black text-3xl md:text-4xl tracking-[0.3em] text-white uppercase drop-shadow-[0_0_15px_rgba(255,0,0,0.4)] italic">Track Briefing</span>
              <span className="font-mono text-xs text-gray-400 tracking-[0.5em] uppercase mt-2">Race Parameters // Gear 0{session?.currentRound || 1}</span>
            </div>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            {/* Left: Track Specs */}
            <div className="bg-black/40 border border-white/10 p-8 rounded-tr-[3rem] rounded-bl-[3rem] backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full group-hover:bg-red-600/20 transition-all" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent" />

              <div className="font-mono text-[12px] font-bold text-red-500 tracking-[0.4em] uppercase mb-8 flex items-center gap-3">
                <Gauge size={16} className="text-red-500" /> TRACK_SPECS
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center border-b border-white/10 pb-4 group-hover:border-red-600/30 transition-colors">
                  <span className="font-mono text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Flag size={14} className="text-gray-500" /> Checkpoints
                  </span>
                  <span className="font-display font-black italic text-2xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{briefingQuestions.length}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4 group-hover:border-red-600/30 transition-colors">
                  <span className="font-mono text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-gray-500" /> Circuit Type
                  </span>
                  <span className="font-display font-black italic text-xl text-white">
                    {briefingQuestions.some(q => q.type === 'match') ? 'HYBRID' : 'SPRINT'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4 group-hover:border-red-600/30 transition-colors">
                  <span className="font-mono text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Timer size={14} className="text-gray-500" /> Time Limit
                  </span>
                  <span className="font-display font-black italic text-2xl text-white">
                    {Math.floor((session?.roundDurations?.[`round${session?.currentRound || 1}`] || (session?.currentRound === 3 ? 1500 : 1200)) / 60)} MIN
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Race Regulations */}
            <div className="bg-black/40 border border-white/10 p-8 rounded-tl-[3rem] rounded-br-[3rem] backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#FFB800]/10 blur-3xl rounded-full group-hover:bg-[#FFB800]/20 transition-all" />
              <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-[#FFB800] to-transparent" />

              <div className="font-mono text-[12px] font-bold text-[#FFB800] tracking-[0.4em] uppercase mb-8 flex items-center gap-3">
                <ShieldAlert size={16} className="text-[#FFB800]" /> RACE_REGULATIONS
              </div>

              <ul className="space-y-5 relative z-10">
                {[
                  "Stay on track. Full-screen mode is mandatory to avoid penalties.",
                  "Only the designated Driver can submit checkpoint data.",
                  "Speed and accuracy determine your final lap time (score).",
                  "Pit lane interference (background dev-tools) leads to disqualification."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center font-mono text-[10px] text-[#FFB800] font-bold">
                      {i + 1}
                    </div>
                    <span className="font-mono text-xs text-gray-300 uppercase tracking-wider leading-relaxed pt-1">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Operational Analysis Section */}
        {visibleRounds.length > 0 && (
          <div id="analysis-section" className="w-full max-w-5xl px-6 mt-20">
            <div className="flex items-center gap-6 mb-12">
              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />
              <div className="flex flex-col items-center">
                <span className="font-display font-black text-3xl tracking-[0.3em] text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Historical Insights</span>
                <span className="font-mono text-xs text-gray-500 tracking-[0.5em] uppercase mt-2">Past Mission Data // Answer Log</span>
              </div>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />
            </div>

            <div className="flex justify-center gap-4 mb-10">
              {visibleRounds.map(r => (
                <button
                  key={r}
                  onClick={() => setAnalysisRound(r)}
                  className={`px-6 py-2 font-mono text-xs tracking-[0.3em] border transition-all ${analysisRound === r
                    ? 'bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(255,0,0,0.3)]'
                    : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
                    }`}
                >
                  PHASE_0{r}
                </button>
              ))}
            </div>

            {analysisQuestions.length > 0 ? (
              !isAnalysisUnlocked ? (
                <div className="flex flex-col items-center justify-center py-20 border border-white/5 bg-white/[0.02] rounded-[2rem] gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <div className="text-center px-6">
                    <div className="font-mono text-xs text-gray-500 tracking-[0.3em] uppercase">Security Encryption Active</div>
                    <div className="text-gray-400 text-xs font-mono mt-1 uppercase tracking-widest max-w-sm">Phase 0{analysisRound} is currently in progress. Complete all questions to view telemetry analysis.</div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6">

                  {analysisQuestions.map((q, idx) => {
                    const status = q.isAnswered ? (q.isCorrect ? 'SUCCESS' : 'FAILURE') : 'MISSED';
                    const statusColor = status === 'SUCCESS' ? 'text-gdg-green border-gdg-green/30 bg-gdg-green/10' :
                      status === 'FAILURE' ? 'text-gdg-red border-gdg-red/30 bg-gdg-red/10' :
                        'text-gray-500 border-gray-500/30 bg-gray-500/10';

                    return (
                      <motion.div
                        key={q._id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-black/40 border border-white/5 p-8 rounded-[2rem] backdrop-blur-xl hover:border-white/20 transition-all relative overflow-hidden"
                      >
                        <div className={`absolute top-0 right-0 px-6 py-2 font-mono text-xs font-black tracking-[0.3em] rounded-bl-2xl border-l border-b ${statusColor}`}>
                          {status}
                        </div>

                        <div className="flex items-start justify-between mb-8">
                          <div className="flex flex-col gap-2">
                            <div className="font-mono text-xs text-white/50 tracking-[0.8em] uppercase mb-4 flex items-center gap-4 w-full max-w-3xl">
                              <span className="h-[1px] flex-1 opacity-30 bg-white" />
                              NODE {idx + 1} / {analysisQuestions.length}
                              <span className="h-[1px] flex-1 opacity-30 bg-white" />
                            </div>
                            <h3 className="text-2xl font-bold tracking-wide text-white group-hover:text-gdg-blue transition-colors">
                              {q.emojiClue && <span className="mr-4 text-3xl align-middle">{q.emojiClue}</span>}
                              {q.question}
                            </h3>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-4">
                          {/* Correct Answer */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-gdg-green shadow-[0_0_10px_#34A853]" />
                              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Decrypted Signature</span>
                            </div>
                            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-gdg-green font-bold text-lg shadow-inner">
                              {q.type === 'match' ? (
                                <div className="grid gap-2">
                                  {q.matchPairs?.map((pair, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                      <span className="text-white/60">{pair.left}</span>
                                      <span className="text-gdg-green/40">→</span>
                                      <span>{pair.right}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                q.correctAnswer || 'Data Encrypted'
                              )}
                            </div>
                          </div>

                          {/* Explanation */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-gdg-blue shadow-[0_0_10px_#4285F4]" />
                              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Central Intelligence Log</span>
                            </div>
                            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl relative">
                              <p className="text-gray-400 text-sm leading-relaxed italic pr-4">
                                "{q.explanation || "No additional telemetry available for this node."}"
                              </p>
                              <div className="absolute bottom-2 right-2 font-mono text-[8px] text-white/10">CORE_INTEL_V1.2</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )) : (
              <div className="flex flex-col items-center justify-center py-20 border border-white/5 bg-white/[0.02] rounded-[2rem] gap-4">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                  <Send size={20} className="text-gray-700" />
                </div>

                <div className="text-center">
                  <div className="font-mono text-[10px] text-gray-500 tracking-[0.3em] uppercase">No Telemetry Recorded</div>
                  <div className="text-gray-600 text-[9px] font-mono mt-1 uppercase tracking-widest">Phase is currently active or has not been initialized.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Launch Button */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[500px] px-6 z-50"
      >
        <button
          onClick={() => { if (isActive && !hasFinishedCurrentRound && !isTimeExpired) router.push(`/quiz/${quizCode}/play/${teamId}`); }}
          className={`relative w-full h-20 overflow-hidden transition-all duration-300 ${isActive && !hasFinishedCurrentRound && !isTimeExpired
            ? 'bg-red-600/10 border-t-2 border-b-2 border-red-600 hover:bg-red-600/20 cursor-pointer shadow-[0_0_30px_rgba(255,0,0,0.2)]'
            : 'bg-[#111] border-t-2 border-b-2 border-[#333] cursor-not-allowed opacity-50 grayscale'
            }`}
          style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0% 100%)' }}
        >
          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            <div className={`text-2xl font-black tracking-[0.4em] uppercase ${(isActive && !hasFinishedCurrentRound && !isTimeExpired) ? 'text-white drop-shadow-[0_0_10px_#fff]' : 'text-gray-500'}`}>
              {team?.isEliminated ? 'QUALIFICATION FAILED' :
                isFinished ? 'SIMULATION COMPLETE' :
                  hasFinishedCurrentRound ? 'GEAR COMPLETE' :
                    (isActive && !isTimeExpired) ? 'ENGAGE IGNITION' :
                      'SYSTEM LOCKED'}
            </div>
          </div>
        </button>
      </motion.div>

    </div>
  );
}
