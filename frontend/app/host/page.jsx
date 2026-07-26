'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Shield, Trophy, Zap, RefreshCw, Activity, 
  ChevronRight, Lock, Settings, Plus, Trash2, CheckCircle2,
  ArrowLeft, Layers, Users, Globe, Key, AlertCircle, Copy, Sparkles, ArrowRight, Radio
} from 'lucide-react';
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-playfair' });

const ease = [0.25, 0.46, 0.45, 0.94];

const stepMeta = [
  { label: 'General Info',      accent: '#4285F4', bg: 'rgba(66,133,244,0.10)',  border: 'rgba(66,133,244,0.22)'  }, // GDG Blue
  { label: 'Parameters',        accent: '#EA4335', bg: 'rgba(234,67,53,0.10)',   border: 'rgba(234,67,53,0.22)'   }, // GDG Red
  { label: 'Rounds Designer',   accent: '#FBBC05', bg: 'rgba(251,188,5,0.10)',   border: 'rgba(251,188,5,0.22)'   }, // GDG Yellow
  { label: 'Authorization',     accent: '#34A853', bg: 'rgba(52,168,83,0.10)',   border: 'rgba(52,168,83,0.22)'   }, // GDG Green
  { label: 'Review & Launch',   accent: '#4285F4', bg: 'rgba(66,133,244,0.10)',  border: 'rgba(66,133,244,0.22)'  }, // GDG Blue
];

// Reusable input / label styles
const inputCls = `
  w-full px-5 py-4 rounded-xl text-base text-white placeholder:text-white/20 
  focus:outline-none transition-all duration-300
  bg-black/30 border border-white/10 backdrop-blur-md shadow-inner
  focus:bg-black/50 focus:border-[#4285F4]/70 focus:ring-2 focus:ring-[#4285F4]/30
`;
const labelCls = "block text-[11px] font-bold tracking-[0.15em] uppercase text-white/50 mb-3";

export default function HostSetupWizard() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);
  const [createdCode, setCreatedCode] = useState('');

  const [formData, setFormData] = useState({
    quizName: '',
    description: '',
    organizerName: '',
    playersPerTeam: 3,
    allowLateJoin: true,
    maxTeams: 50,
    quizLanguage: 'en',
    showLeaderboardDuringGame: true,
    allowReAttempt: false,
    timeBonusEnabled: true,
    organizerPassword: '',
    confirmPassword: '',
    rounds: [
      { roundNumber: 1, roundName: 'Round 1 — Tech Trivia', questionType: 'mcq', questionCount: 10, timeLimitSeconds: 600 }
    ]
  });

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const nextStep = () => {
    if (step === 1 && !formData.quizName.trim()) { setError('Tournament name is required to continue.'); return; }
    if (step === 4) {
      if (formData.organizerPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (formData.organizerPassword !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    }
    setError('');
    setStep(s => s + 1);
  };

  const addRound = () => {
    if (formData.rounds.length >= 5) { setError('Maximum of 5 rounds supported.'); return; }
    const n = formData.rounds.length + 1;
    setFormData(prev => ({
      ...prev,
      rounds: [...prev.rounds, { roundNumber: n, roundName: `Round ${n} — Challenge`, questionType: 'mcq', questionCount: 10, timeLimitSeconds: 600 }]
    }));
  };

  const removeRound = (idx) => {
    if (formData.rounds.length === 1) { setError('A tournament must have at least one round.'); return; }
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.filter((_, i) => i !== idx).map((r, i) => ({ ...r, roundNumber: i + 1 }))
    }));
  };

  const updateRound = (idx, field, val) => {
    const updated = [...formData.rounds];
    updated[idx][field] = val;
    setFormData(prev => ({ ...prev, rounds: updated }));
  };

  const handleCreateQuiz = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/quiz/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Server connection failed. Please ensure the backend is running.');
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create tournament');
      setCreatedCode(data.quizCode);
      setStep(6);
    } catch (err) {
      setError(err.message || 'Connection failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const meta = step <= 5 ? stepMeta[step - 1] : stepMeta[4];
  const progress = Math.min((step / 5) * 100, 100);

  return (
    <div className={`min-h-screen bg-[#020202] text-white selection:bg-[#4285F4] selection:text-white ${inter.variable} ${playfair.variable} font-sans flex flex-col relative`}>
      <style dangerouslySetInnerHTML={{__html: `
        .font-serif { font-family: var(--font-playfair), serif; }
        .noise-overlay {
            position: fixed;
            inset: 0;
            z-index: 50;
            pointer-events: none;
            opacity: 0.05;
            mix-blend-mode: overlay;
            background-image: url("https://grainy-gradients.vercel.app/noise.svg");
        }
      `}} />

      {/* ── AMBIENT ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="noise-overlay" />
        <div className="absolute top-[10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#4285F4] mix-blend-screen filter blur-[180px] opacity-[0.18]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#EA4335] mix-blend-screen filter blur-[180px] opacity-[0.12]"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
            <ArrowLeft size={14} />
            Portal Home
          </Link>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-3 text-[13px] font-bold text-white/60 tracking-widest uppercase">
            <div className="flex gap-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4] shadow-[0_0_8px_#4285F4]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#EA4335] shadow-[0_0_8px_#EA4335]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#FBBC05] shadow-[0_0_8px_#FBBC05]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#34A853] shadow-[0_0_8px_#34A853]"></div>
            </div>
            Tournament Wizard
          </div>
        </div>

        {step < 6 && (
          <div className="text-xs font-mono font-bold px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 tracking-widest shadow-inner">
            PHASE {String(step).padStart(2,'0')} / 05
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 relative z-10 flex items-start justify-center pt-16 pb-32 px-6">
        <div className="w-full max-w-[880px]">

          {/* ── STEP INDICATOR ── */}
          {step < 6 && (
            <div className="mb-12">
              {/* Step pills */}
              <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {stepMeta.map((s, i) => {
                  const n       = i + 1;
                  const active  = step === n;
                  const done    = step > n;
                  return (
                    <div key={n} className="flex items-center flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-mono font-bold text-sm
                          ${done ? 'bg-white/5 border border-white/10 text-white/50' : 
                            active ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-110' : 
                            'bg-transparent border border-white/10 text-white/30'}`}
                        >
                          {done ? <CheckCircle2 size={18} /> : n}
                        </div>
                        <span className={`text-[13px] tracking-wide whitespace-nowrap transition-all hidden md:block
                          ${active ? 'font-bold text-white' : done ? 'font-bold text-white/50' : 'font-medium text-white/30'}`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < 4 && <div className={`w-12 h-px mx-4 flex-shrink-0 ${step > n ? 'bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-white/10'}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease }}
                  className="h-full rounded-full"
                  style={{ background: meta.accent, boxShadow: `0 0 20px ${meta.accent}` }}
                />
              </div>
            </div>
          )}

          {/* ── FORM CARD ── */}
          <div className="rounded-[32px] bg-white/[0.04] border border-white/10 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden transition-all duration-500" style={{ borderColor: `${meta.accent}60` }}>
            
            {/* Card ambient glow inside */}
            <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full blur-[120px] pointer-events-none transition-colors duration-700" style={{ backgroundColor: `${meta.accent}15` }}></div>

            <div className="p-6 sm:p-10 md:p-14 relative z-10">

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-4 px-6 py-5 rounded-2xl mb-10 bg-red-500/10 border border-red-500/30 text-[14px] font-medium text-red-300 shadow-[0_10px_30px_rgba(239,68,68,0.1)]">
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">

                {/* ════ STEP 1 ════ */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease }}>
                    <StepHeader n="01" title="General Information" desc="Define the core identity and metadata for your tournament session." accent={meta.accent} />

                    <div className="flex flex-col gap-8">
                      <div>
                        <label className={labelCls}>
                          Tournament Name <span style={{ color: meta.accent }}>*</span>
                        </label>
                        <input title="Enter the name of the tournament"
                          type="text" value={formData.quizName} autoFocus
                          onChange={e => { set('quizName', e.target.value); setError(''); }}
                          placeholder="e.g. Decode The Tech 2026: Championship"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Description <OptTag /></label>
                        <textarea title="Enter a description for the tournament" rows={3} value={formData.description}
                          onChange={e => set('description', e.target.value)}
                          placeholder="A brief overview of the event — theme, scope, audience."
                          className={inputCls} style={{ resize: 'none' }}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Organization / Institution <OptTag /></label>
                        <div className="relative">
                          <Globe size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
                          <input title="Enter the name of the organizer" type="text" value={formData.organizerName}
                            onChange={e => set('organizerName', e.target.value)}
                            placeholder="e.g. Google Developer Groups"
                            className={inputCls} style={{ paddingLeft: 54 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ════ STEP 2 ════ */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease }}>
                    <StepHeader n="02" title="Session Parameters" desc="Configure team structure, scoring mechanics, and session rules." accent={meta.accent} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      <ParamCard label="Players Per Team" icon={<Users size={18} className="text-[#4285F4]" />}>
                        <div className="flex gap-3">
                          {[1,2,3,4,5].map(n => (
                            <button title="Set players per team to this number" key={n} type="button" onClick={() => set('playersPerTeam', n)}
                              className={`flex-1 py-3.5 rounded-xl font-mono text-[16px] font-bold transition-all shadow-sm ${
                                formData.playersPerTeam === n 
                                  ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-[1.02]' 
                                  : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                              }`}>{n}</button>
                          ))}
                        </div>
                      </ParamCard>

                      <ParamCard label="Max Registered Teams" icon={<Trophy size={18} className="text-[#EA4335]" />}>
                        <input title="Set the maximum number of teams" type="number" min={1} max={500} value={formData.maxTeams}
                          onChange={e => set('maxTeams', parseInt(e.target.value) || 50)}
                          className={inputCls} style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800 }}
                        />
                      </ParamCard>

                      <ParamCard label="Late Team Join" icon={<Shield size={18} className="text-[#FBBC05]" />}>
                        <TogglePair
                          opts={[{ l: 'Allowed', v: true }, { l: 'Locked', v: false }]}
                          value={formData.allowLateJoin} onChange={v => set('allowLateJoin', v)}
                          activeColor="#FBBC05"
                        />
                      </ParamCard>

                      <ParamCard label="Re-Attempt Sessions" icon={<RefreshCw size={18} className="text-[#34A853]" />}>
                        <TogglePair
                          opts={[{ l: 'Yes', v: true }, { l: 'No', v: false }]}
                          value={formData.allowReAttempt} onChange={v => set('allowReAttempt', v)}
                          activeColor="#34A853"
                        />
                      </ParamCard>

                      <ParamCard label="Time Bonus Scoring" icon={<Zap size={18} className="text-[#4285F4]" />}>
                        <TogglePair
                          opts={[{ l: 'Active', v: true }, { l: 'Off', v: false }]}
                          value={formData.timeBonusEnabled} onChange={v => set('timeBonusEnabled', v)}
                          activeColor="#4285F4"
                        />
                      </ParamCard>

                      <ParamCard label="Session Language" icon={<Globe size={18} className="text-[#EA4335]" />}>
                        <select title="Select the language for the tournament" value={formData.quizLanguage} onChange={e => set('quizLanguage', e.target.value)}
                          className={inputCls} style={{ background: '#111' }}>
                          <option value="en">English (EN)</option>
                          <option value="es">Español (ES)</option>
                          <option value="fr">Français (FR)</option>
                          <option value="de">Deutsch (DE)</option>
                          <option value="hi">हिन्दी (HI)</option>
                        </select>
                      </ParamCard>

                    </div>
                  </motion.div>
                )}

                {/* ════ STEP 3 ════ */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                      <StepHeader n="03" title="Rounds Designer" desc={`Configure up to 5 competitive rounds. ${formData.rounds.length}/5 active.`} accent={meta.accent} noMargin />
                      <button title="Add a new round to the tournament" type="button" onClick={addRound}
                        className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[14px] font-bold tracking-wide bg-white/10 border border-white/20 text-white hover:bg-white text-hover-black hover:text-black transition-all shadow-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        <Plus size={16} />Add Round
                      </button>
                    </div>

                    <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {formData.rounds.map((round, idx) => (
                        <div key={idx} className="p-5 sm:p-8 rounded-[24px] bg-white/[0.03] border border-white/10 relative overflow-hidden shadow-xl hover:bg-white/[0.05] transition-colors">
                          {/* Round header */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/20 text-[15px] font-mono font-bold text-white shadow-inner">
                                {round.roundNumber}
                              </div>
                              <span className="text-[16px] font-bold text-white tracking-widest uppercase">
                                ROUND {String(round.roundNumber).padStart(2,'0')}
                              </span>
                            </div>
                            <button title="Remove this round" type="button" onClick={() => removeRound(idx)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all">
                              <Trash2 size={16} />Remove
                            </button>
                          </div>

                          {/* Round fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className={labelCls}>Round Title</label>
                              <input title="Enter the name of this round" type="text" value={round.roundName}
                                onChange={e => updateRound(idx, 'roundName', e.target.value)}
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Question Type</label>
                              <select title="Select the type of questions for this round" value={round.questionType} onChange={e => updateRound(idx, 'questionType', e.target.value)}
                                className={inputCls} style={{ background: '#111' }}>
                                <option value="mcq">MCQ — Standard</option>
                                <option value="match">Match Pairs</option>
                                <option value="emoji">Emoji Clues</option>
                                <option value="truefalse">True / False</option>
                                <option value="mix">Mix — All Types</option>
                              </select>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-5">
                              <div className="flex-1">
                                <label className={labelCls}>Questions</label>
                                <input title="Set the number of questions for this round" type="number" min={5} max={30} value={round.questionCount}
                                  onChange={e => updateRound(idx, 'questionCount', parseInt(e.target.value) || 5)}
                                  className={inputCls} style={{ fontFamily: 'monospace', fontWeight: 800 }}
                                />
                              </div>
                              <div className="flex-1">
                                <label className={labelCls}>Time Limit</label>
                                <select title="Set the time limit for this round" value={round.timeLimitSeconds / 60} onChange={e => updateRound(idx, 'timeLimitSeconds', parseInt(e.target.value) * 60)}
                                  className={inputCls} style={{ background: '#111' }}>
                                  {[5,10,15,20,25,30].map(m => <option key={m} value={m}>{m} min</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ════ STEP 4 ════ */}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease }}>
                    <StepHeader n="04" title="Authorization" desc="Set an organizer password to control live sessions and question payloads." accent={meta.accent} />

                    <div className="max-w-[550px] flex flex-col gap-8">
                      <div className="flex items-start gap-5 p-6 rounded-[20px] bg-[#34A853]/10 border border-[#34A853]/30 mb-2 shadow-[inset_0_1px_1px_rgba(52,168,83,0.2)]">
                        <Lock size={24} className="text-[#34A853] mt-1 flex-shrink-0" />
                        <p className="text-[15px] font-medium text-white/80 leading-relaxed m-0">
                          This password is required to manage the live session, upload questions,
                          and enforce participant controls during the tournament.
                        </p>
                      </div>
                      <div>
                        <label className={labelCls}>Organizer Password <span style={{ color: meta.accent }}>*</span> <OptTag text="MIN 6 CHARS" /></label>
                        <input title="Create a password for the organizer" type="password" value={formData.organizerPassword}
                          onChange={e => { set('organizerPassword', e.target.value); setError(''); }}
                          placeholder="••••••••••••"
                          className={inputCls} style={{ fontFamily: 'monospace', letterSpacing: '0.25em', fontSize: '20px' }}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Confirm Password <span style={{ color: meta.accent }}>*</span></label>
                        <input title="Confirm the organizer password" type="password" value={formData.confirmPassword}
                          onChange={e => { set('confirmPassword', e.target.value); setError(''); }}
                          placeholder="••••••••••••"
                          className={inputCls} style={{ fontFamily: 'monospace', letterSpacing: '0.25em', fontSize: '20px' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ════ STEP 5 — REVIEW ════ */}
                {step === 5 && (
                  <motion.div key="s5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease }}>
                    <StepHeader n="05" title="Review & Launch" desc="Verify your configuration before generating the live tournament cluster." accent={meta.accent} />

                    <div className="flex flex-col gap-6 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {[
                          { k: 'Tournament',  v: formData.quizName },
                          { k: 'Organizer',   v: formData.organizerName || 'Anonymous' },
                          { k: 'Team Size',   v: `${formData.playersPerTeam} players` },
                          { k: 'Max Teams',   v: formData.maxTeams },
                          { k: 'Language',    v: formData.quizLanguage.toUpperCase() },
                          { k: 'Rounds',      v: `${formData.rounds.length} configured` },
                        ].map((item, i) => (
                          <div key={i} className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-lg backdrop-blur-sm">
                            <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">{item.k}</div>
                            <div className="text-[16px] font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap">{item.v}</div>
                          </div>
                        ))}
                      </div>

                      <div className="p-5 sm:p-7 rounded-[24px] bg-white/[0.03] border border-white/10 mt-3 shadow-xl">
                        <div className="text-[13px] font-bold text-white/60 uppercase tracking-widest mb-6 flex items-center gap-3">
                          <Layers size={18} className="text-[#4285F4]" />Rounds Configuration
                        </div>
                        <div className="flex flex-col gap-4">
                          {formData.rounds.map((r, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-white/5 border border-white/10 gap-4 sm:gap-0">
                              <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[13px] font-bold font-mono text-white/90 shadow-inner">{r.roundNumber}</span>
                                <span className="font-bold text-[16px] text-white tracking-wide">{r.roundName}</span>
                              </div>
                              <div className="flex items-center gap-5 text-[13px] font-bold text-white/50 bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                                <span>{r.questionCount}Q</span>
                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                <span className="text-[#FBBC05] uppercase tracking-widest">{r.questionType}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                <span>{r.timeLimitSeconds/60}m</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ════ STEP 6 — SUCCESS ════ */}
                {step === 6 && (
                  <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }}
                    className="text-center py-6">

                    <div className="w-24 h-24 mx-auto mb-8 rounded-[24px] flex items-center justify-center bg-[#34A853]/20 border border-[#34A853]/40 shadow-[0_0_60px_rgba(52,168,83,0.3)]">
                      <CheckCircle2 size={44} className="text-[#34A853]" />
                    </div>

                    <div className="text-[13px] font-bold tracking-[0.25em] text-[#34A853] uppercase mb-4">Tournament Created</div>
                    <h2 className="text-5xl font-serif mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">Your arena is live</h2>
                    <p className="text-base text-white/50 leading-relaxed max-w-[440px] mx-auto mb-12">
                      Share the access code below with participants. They can join instantly from the home portal.
                    </p>

                    {/* Code display */}
                    <div className="relative max-w-[460px] mx-auto mb-12 p-10 rounded-[32px] bg-white/[0.04] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md">
                      <div className="text-[11px] font-mono font-bold tracking-[0.25em] text-white/40 uppercase mb-5">Access Code</div>
                      <div className="font-mono text-4xl md:text-6xl font-black tracking-[0.25em] text-white mb-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] break-all">
                        {createdCode}
                      </div>
                      <button title="Copy the access code to clipboard" onClick={copyCode} className={`flex items-center gap-3 mx-auto px-6 py-3 rounded-xl font-bold text-[15px] transition-all ${
                        copied ? 'bg-[#34A853]/20 border border-[#34A853]/50 text-[#34A853] shadow-[0_0_20px_rgba(52,168,83,0.3)]' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                      }`}>
                        {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy Access Code'}
                      </button>
                    </div>

                    <button title="Proceed to load questions" onClick={() => router.push(`/host/${createdCode}/questions`)} className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-[16px] bg-white text-black hover:scale-105 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)]">
                      <span>Load Question Payload</span>
                      <ArrowRight size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── NAV BUTTONS ── */}
              {step < 6 && (
                <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center mt-14 pt-10 border-t border-white/10 gap-4 sm:gap-0">
                  <button title="Go back to the previous step" type="button" onClick={() => { setError(''); setStep(s => s - 1); }}
                    disabled={step === 1}
                    className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold transition-all ${
                      step === 1 ? 'opacity-0 pointer-events-none hidden sm:flex' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}>
                    <ArrowLeft size={18} />Back
                  </button>

                  {step < 5 ? (
                    <button title="Proceed to the next step" type="button" onClick={nextStep} className="flex items-center justify-center gap-3 px-10 py-4 rounded-xl text-[15px] font-bold bg-white text-black hover:scale-105 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.15)]">
                      <span>Continue</span><ChevronRight size={18} />
                    </button>
                  ) : (
                    <button title="Create the tournament" type="button" onClick={handleCreateQuiz} disabled={loading} className="flex items-center justify-center gap-3 px-10 py-4 rounded-xl text-[15px] font-bold bg-[#4285F4] text-white hover:bg-[#3b78e7] transition-all shadow-[0_15px_40px_rgba(66,133,244,0.4)] disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
                      {loading ? <><RefreshCw size={18} className="animate-spin" />Creating...</> : <><Sparkles size={18} />Create Tournament</>}
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-20 text-center p-8 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <span className="text-[11px] font-mono font-bold text-white/30 tracking-[0.2em] uppercase">
          Intelligent Arena · Global Edition · Powered by Google Cloud
        </span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; border: 2px solid rgba(0,0,0,0); background-clip: padding-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───

function StepHeader({ n, title, desc, accent }) {
  return (
    <div className="mb-10">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-5 text-[12px] font-bold font-mono tracking-widest uppercase border shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" style={{ color: accent, backgroundColor: `${accent}15`, borderColor: `${accent}30` }}>
        <Radio size={14} />
        PHASE {n}
      </div>
      <h3 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 mb-4 tracking-tight pb-1">{title}</h3>
      <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-[500px]">{desc}</p>
    </div>
  );
}

function OptTag({ text = 'OPTIONAL' }) {
  return <span className="text-[10px] font-bold text-white/30 tracking-[0.15em] ml-2 bg-white/5 px-2 py-1 rounded-md">({text})</span>;
}

function ParamCard({ label, icon, children }) {
  return (
    <div className="p-6 rounded-[20px] bg-white/[0.03] hover:bg-white/[0.06] transition-colors border border-white/10 hover:border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <label className="text-[11px] font-bold tracking-[0.15em] text-white/50 uppercase">{label}</label>
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          {icon}
        </div>
      </div>
      {children}
    </div>
  );
}

function TogglePair({ opts, value, onChange, activeColor }) {
  return (
    <div className="flex gap-3">
      {opts.map(o => (
        <button title="Toggle this setting" key={String(o.v)} type="button" onClick={() => onChange(o.v)} className="flex-1 py-3.5 rounded-xl text-[14px] font-bold transition-all shadow-sm"
          style={{
            backgroundColor: value === o.v ? `${activeColor}20` : 'rgba(255,255,255,0.03)',
            borderColor: value === o.v ? activeColor : 'rgba(255,255,255,0.1)',
            color: value === o.v ? activeColor : 'rgba(255,255,255,0.4)',
            boxShadow: value === o.v ? `0 0 15px ${activeColor}40` : 'none'
          }}>{o.l}</button>
      ))}
    </div>
  );
}
