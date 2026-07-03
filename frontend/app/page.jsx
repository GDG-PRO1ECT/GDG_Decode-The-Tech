'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, Lock, Shield, Zap, Layers,
  Activity, Clock, ArrowUpRight,
  Trophy, Sparkles, FileText, Users, BarChart3,
  Cpu, Globe, Check, ChevronRight
} from 'lucide-react';

const kineticWords = ['velocity.', 'precision.', 'mastery.', 'momentum.'];

const ease = [0.25, 0.46, 0.45, 0.94];

const hostSteps = [
  { n: '01', title: 'Set Event Details',    body: 'Name, description, institution and session configuration.'     },
  { n: '02', title: 'Design Rounds',        body: 'Build 5 dynamic game modes with AI-parsed or manual questions.' },
  { n: '03', title: 'Invite Participants',  body: 'Share the generated code — teams join instantly, no install.'   },
  { n: '04', title: 'Go Live',              body: 'Monitor real-time scores, leaderboards and integrity alerts.'    },
];

const hostCapabilities = [
  'AI DOCX Question Parser', 'Multi-Team Management', 'Live Leaderboards',
  'Anti-Cheat Engine',       'WebSocket Cluster',      '5 Tournament Modes',
];

export default function Page() {
  const router = useRouter();

  // State
  const [tab, setTab]           = useState('join');   // 'join' | 'host'
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [focused, setFocused]   = useState(false);
  const [sysTime, setSysTime]   = useState('');
  const [wordIdx, setWordIdx]   = useState(0);
  const [chars, setChars]       = useState(['','','','','','']);

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSysTime(fmt());
    const t1 = setInterval(() => setSysTime(fmt()), 1000);
    const t2 = setInterval(() => setWordIdx(p => (p + 1) % kineticWords.length), 3400);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const changeCode = useCallback((val) => {
    const v = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(v);
    setError('');
    const c = Array(6).fill('');
    v.split('').forEach((ch, i) => { c[i] = ch; });
    setChars(c);
  }, []);

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (code.length !== 6) { setError('Please enter your complete 6-character access code.'); return; }
    setLoading(true); setError('');
    try {
      const upper = code.toUpperCase();
      const res   = await fetch(`/api/game/status?quizCode=${upper}`);
      const data  = await res.json();
      if (!res.ok || !data.session) {
        setError('Access code not found — please verify with your organizer.');
        setLoading(false); return;
      }
      if (data.session.status === 'draft') {
        setError('This session is still being prepared by the host.');
        setLoading(false); return;
      }
      router.push(`/quiz/${upper}`);
    } catch {
      setError('Connection failed. Please check your network.');
      setLoading(false);
    }
  };

  // ─── derived
  const cardReady = tab === 'join' ? (code.length === 6 && !loading) : true;

  return (
    <div className="relative h-screen max-h-screen flex flex-col font-sans overflow-hidden"
      style={{ background: '#0D0D10', color: '#fff' }}>

      {/* ─── BACKGROUND ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Very subtle blue-indigo ambient glow left */}
        <div style={{
          position: 'absolute', left: '-5%', top: '-5%',
          width: '55vw', height: '70vh',
          background: 'radial-gradient(ellipse at 25% 30%, rgba(63,94,251,0.12) 0%, rgba(40,60,160,0.05) 50%, transparent 72%)',
          filter: 'blur(80px)'
        }} />
        {/* Subtle warm indigo right */}
        <div style={{
          position: 'absolute', right: '-8%', bottom: '5%',
          width: '50vw', height: '60vh',
          background: 'radial-gradient(ellipse at 70% 70%, rgba(120,60,220,0.10) 0%, rgba(60,30,120,0.05) 55%, transparent 72%)',
          filter: 'blur(90px)'
        }} />
        {/* Refined micro-grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '52px 52px'
        }} />
        {/* Top/bottom hairlines */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.08) 60%, transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, transparent)' }} />
      </div>

      {/* ─── HEADER ─── */}
      <header className="relative z-20 shrink-0 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,16,0.80)', backdropFilter: 'blur(24px)' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
            border: '1px solid rgba(255,255,255,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L15 5v6L8 15 1 11V5L8 1z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M8 5l4 2.5v3L8 13l-4-2.5v-3L8 5z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
            </svg>
          </div>
          <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.90)' }}>
            Intelligent Arena
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.12em',
            padding: '2px 7px', borderRadius: 20,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: 'rgba(165,163,255,0.90)'
          }}>GLOBAL</span>
        </div>

        {/* Header right */}
        <div className="flex items-center gap-3">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 99,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'
          }} className="hidden sm:flex">
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <span className="animate-ping" style={{ position: 'absolute', inset: 0, width: 6, height: 6, borderRadius: '50%', background: '#4ade80', opacity: 0.5 }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>All systems operational</span>
          </div>
          <div className="hidden md:flex" style={{
            fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.38)',
            padding: '5px 11px', borderRadius: 7,
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)'
          }}>
            {sysTime || '--:--:--'}
          </div>
        </div>
      </header>

      {/* ─── MAIN SPLIT ─── */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1340px] mx-auto px-6 sm:px-10 lg:px-16 grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16 py-3">

        {/* ════ LEFT: EDITORIAL ════ */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } } }}
          className="flex flex-col"
        >
          {/* Live badge */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
            className="mb-6 flex items-center gap-2"
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 99,
              background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)',
              fontSize: 11.5, fontWeight: 500, color: 'rgba(178,176,255,0.85)'
            }}>
              <Globe size={11} style={{ color: '#818cf8' }} />
              Enterprise Assessment Platform — Global Rollout
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }}
            style={{ fontSize: 'clamp(2rem, 4vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.07, marginBottom: 18, color: '#fff' }}
          >
            Where knowledge<br />meets{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.32, ease }}
                  style={{
                    display: 'inline-block',
                    background: 'linear-gradient(125deg, #a5b4fc 0%, #818cf8 40%, #c4b5fd 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                  }}
                >
                  {kineticWords[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
            style={{ fontSize: 14.5, lineHeight: 1.72, color: 'rgba(255,255,255,0.45)', maxWidth: 400, marginBottom: 28 }}
          >
            Built for global scale — sub-millisecond WebSocket synchronization, AI-powered
            question generation, and enterprise-grade anti-cheat enforcement.
          </motion.p>

          {/* Feature rows */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
            className="flex flex-col gap-2.5 mb-8"
          >
            {[
              { icon: Zap,    text: 'Sub-15ms real-time WebSocket synchronization' },
              { icon: Shield, text: 'AI background-tab monitoring & penalty system' },
              { icon: Layers, text: 'One-click AI question generation from DOCX files' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.20)'
                }}>
                  <f.icon size={10} style={{ color: '#a5b4fc' }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.52)' }}>{f.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Stats strip */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6, delay: 0.28 } } }}
            style={{ display: 'flex', alignItems: 'center', gap: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            {[
              { v: '<15ms', l: 'WebSocket Latency' },
              { v: '5',     l: 'Tournament Modes'  },
              { v: '100%',  l: 'Real-Time Sync'    },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>{s.v}</span>
                <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.32)', fontWeight: 500 }}>{s.l}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ════ RIGHT: SINGLE PREMIUM CARD ════ */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.70, delay: 0.16, ease }}
          style={{ width: '100%', maxWidth: 480, justifySelf: 'end' }}
        >
          <div style={{
            borderRadius: 24,
            background: 'rgba(255,255,255,0.030)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}>

            {/* Tab switcher */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              padding: '6px 6px 0',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(0,0,0,0.2)',
            }}>
              {[
                { id: 'join', label: 'Join Tournament' },
                { id: 'host', label: 'Host Tournament' },
              ].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setError(''); }}
                  style={{
                    padding: '10px 0', fontSize: 12.5, fontWeight: 600,
                    borderRadius: '10px 10px 0 0',
                    cursor: 'pointer', transition: 'all 0.2s',
                    color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.38)',
                    background: tab === t.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: 'none',
                    borderBottom: tab === t.id ? '2px solid rgba(129,140,248,0.70)' : '2px solid transparent',
                    letterSpacing: '0.01em',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Card body */}
            <div style={{ padding: '24px 28px 28px' }}>
              <AnimatePresence mode="wait">

                {/* ── JOIN TAB ── */}
                {tab === 'join' && (
                  <motion.div key="join"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease }}>

                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: '#fff', marginBottom: 4 }}>
                        Enter access code
                      </h2>
                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.40)', lineHeight: 1.6 }}>
                        Your event coordinator will provide a 6-character code.
                      </p>
                    </div>

                    <form onSubmit={handleJoin}>
                      {/* OTP boxes */}
                      <div style={{ marginBottom: 16, position: 'relative' }}>
                        <input type="text" maxLength={6} value={code} disabled={loading}
                          onChange={e => changeCode(e.target.value)}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'text', zIndex: 10 }}
                          autoFocus
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                          {chars.map((ch, idx) => {
                            const cur    = focused && code.length === idx;
                            const filled = ch !== '';
                            return (
                              <motion.div key={idx}
                                animate={{
                                  borderColor: filled ? 'rgba(165,180,252,0.60)' : cur ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.10)',
                                  background:  filled ? 'rgba(129,140,248,0.09)' : 'rgba(255,255,255,0.025)',
                                }}
                                transition={{ duration: 0.15 }}
                                style={{
                                  aspectRatio: '3/4', maxHeight: 64, borderRadius: 12,
                                  border: '1px solid',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontFamily: 'monospace', fontSize: 20, fontWeight: 800,
                                  boxShadow: filled ? '0 0 14px rgba(129,140,248,0.18)' : 'none',
                                }}>
                                <AnimatePresence mode="wait">
                                  {ch ? (
                                    <motion.span key={`${idx}${ch}`}
                                      initial={{ opacity: 0, scale: 0.5, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.5, y: -6 }} transition={{ duration: 0.12 }}
                                      style={{ color: '#c7d2fe' }}>
                                      {ch}
                                    </motion.span>
                                  ) : cur ? (
                                    <motion.span
                                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                                      style={{ width: 2, height: 18, background: 'rgba(255,255,255,0.55)', borderRadius: 2, display: 'block' }}
                                    />
                                  ) : null}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      <AnimatePresence>
                        {error && (
                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '9px 13px', borderRadius: 10, marginBottom: 14,
                              background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.22)',
                              fontSize: 11.5, fontFamily: 'monospace', color: '#fca5a5'
                            }}>
                            <Lock size={11} style={{ color: '#f87171', flexShrink: 0 }} />{error}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button type="submit" disabled={loading || code.length !== 6}
                        style={{
                          width: '100%', padding: '12px 0', borderRadius: 12,
                          fontSize: 14, fontWeight: 600, letterSpacing: '0.01em',
                          cursor: code.length === 6 && !loading ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s',
                          background: code.length === 6 && !loading
                            ? 'linear-gradient(135deg, #fff 0%, #e8eaf0 100%)'
                            : 'rgba(255,255,255,0.05)',
                          color: code.length === 6 && !loading ? '#0d0d10' : 'rgba(255,255,255,0.22)',
                          border: code.length === 6 && !loading ? 'none' : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: code.length === 6 && !loading ? '0 8px 24px rgba(0,0,0,0.35)' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}>
                        {loading
                          ? <><Activity size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Connecting...</span></>
                          : <><span>Join Session</span><ArrowRight size={14} /></>}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ── HOST TAB ── */}
                {tab === 'host' && (
                  <motion.div key="host"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease }}>

                    <div style={{ marginBottom: 18 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: '#fff', marginBottom: 4 }}>
                        Create a tournament
                      </h2>
                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.40)', lineHeight: 1.6 }}>
                        AI-powered setup in four guided steps. No technical expertise needed.
                      </p>
                    </div>

                    {/* 4-step process */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 18, position: 'relative' }}>
                      {/* Connector line */}
                      <div style={{
                        position: 'absolute', left: 15, top: 20, bottom: 20, width: 1,
                        background: 'linear-gradient(180deg, rgba(129,140,248,0.40) 0%, rgba(129,140,248,0.10) 100%)'
                      }} />
                      {hostSteps.map((s, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.07, ease }}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0' }}>
                          {/* Step number pill */}
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.04em',
                            background: 'rgba(129,140,248,0.14)', border: '1px solid rgba(129,140,248,0.28)',
                            color: 'rgba(165,180,252,0.90)'
                          }}>
                            {s.n}
                          </div>
                          <div style={{ paddingTop: 5 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.80)', marginBottom: 2 }}>{s.title}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{s.body}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Capabilities grid — 3 columns */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 6, marginBottom: 20,
                      padding: '12px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)'
                    }}>
                      {hostCapabilities.map((cap, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(129,140,248,0.70)', flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.48)', lineHeight: 1.3 }}>{cap}</span>
                        </div>
                      ))}
                    </div>

                    {/* Host CTA */}
                    <Link href="/host" style={{ display: 'block', width: '100%' }}>
                      <button style={{
                        width: '100%', padding: '12px 0', borderRadius: 12,
                        fontSize: 14, fontWeight: 600, letterSpacing: '0.01em',
                        cursor: 'pointer', transition: 'all 0.2s',
                        background: 'linear-gradient(135deg, rgba(129,140,248,0.20) 0%, rgba(167,139,250,0.15) 100%)',
                        border: '1px solid rgba(129,140,248,0.30)',
                        color: 'rgba(210,205,255,0.95)',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.20)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}>
                        <Sparkles size={14} style={{ color: '#a5b4fc' }} />
                        <span>Launch New Tournament</span>
                        <ArrowUpRight size={13} style={{ color: 'rgba(165,180,252,0.60)' }} />
                      </button>
                    </Link>

                    {/* Host KPIs */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                      marginTop: 18, paddingTop: 16,
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                      textAlign: 'center'
                    }}>
                      {[
                        { v: '<2 min', l: 'Setup Time',    c: '#a78bfa' },
                        { v: '∞',      l: 'Team Capacity', c: '#60a5fa' },
                        { v: '99.9%',  l: 'Uptime SLA',    c: '#34d399' },
                      ].map((m, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: m.c }}>{m.v}</div>
                          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.28)', marginTop: 2, fontWeight: 500 }}>{m.l}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-20 shrink-0 px-6 sm:px-10 lg:px-16 py-3.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(13,13,16,0.85)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 20px' }}>
            {[
              { icon: Zap,    l: 'Sub-15ms Sync',  c: '#60a5fa' },
              { icon: Shield, l: 'Anti-Cheat AI',  c: '#34d399' },
              { icon: Layers, l: 'DOCX AI Parsing',c: '#a78bfa' },
              { icon: Globe,  l: 'Global Scale',   c: '#818cf8' },
            ].map((p, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>
                <p.icon size={11} style={{ color: p.c, opacity: 0.5 }} />{p.l}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)', flexShrink: 0 }}>
            © 2026 Intelligent Arena · Global
          </span>
        </div>
      </footer>
    </div>
  );
}
