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

const ease = [0.25, 0.46, 0.45, 0.94];

const stepMeta = [
  { label: 'General Info',      accent: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.22)'  },
  { label: 'Parameters',        accent: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.22)' },
  { label: 'Rounds Designer',   accent: '#818cf8', bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.22)' },
  { label: 'Authorization',     accent: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.22)'  },
  { label: 'Review & Launch',   accent: '#fb923c', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.22)'  },
];

// Reusable input / label styles
const inputCls = `
  w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 
  focus:outline-none transition-all duration-200
  bg-white/[0.04] border border-white/[0.09]
  focus:bg-white/[0.06] focus:border-white/[0.22]
`;
const labelCls = "block text-[10.5px] font-semibold tracking-[0.12em] uppercase text-white/45 mb-1.5";

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
      const data = await res.json();
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
    <div style={{ background: '#0D0D10', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── AMBIENT ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '-5%', top: '-5%', width: '50vw', height: '60vh', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(63,94,251,0.10) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', right: '-8%', top: '20%', width: '45vw', height: '55vh', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(120,60,220,0.09) 0%, transparent 65%)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.022, backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
      </div>

      {/* ── HEADER ── */}
      <header style={{
        position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '14px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(13,13,16,0.82)', backdropFilter: 'blur(24px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 99,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)',
            textDecoration: 'none', letterSpacing: '0.02em', transition: 'all 0.18s'
          }}>
            <ArrowLeft size={13} />
            Portal Home
          </Link>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.10)' }} className="hidden sm:block" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }} className="hidden sm:flex">
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 8px rgba(129,140,248,0.70)', animation: 'pulse 2s infinite' }} />
            Tournament Wizard
          </div>
        </div>

        {step < 6 && (
          <div style={{
            fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em'
          }}>
            PHASE {String(step).padStart(2,'0')} / 05
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 740 }}>

          {/* ── STEP INDICATOR ── */}
          {step < 6 && (
            <div style={{ marginBottom: 28 }}>
              {/* Step pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16, overflowX: 'auto' }}>
                {stepMeta.map((s, i) => {
                  const n       = i + 1;
                  const active  = step === n;
                  const done    = step > n;
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: done ? 0 : 11.5, fontWeight: 700, fontFamily: 'monospace',
                          transition: 'all 0.25s',
                          background: done ? s.bg : active ? '#fff' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${done ? s.border : active ? '#fff' : 'rgba(255,255,255,0.10)'}`,
                          color: active ? '#0d0d10' : 'rgba(255,255,255,0.30)',
                          boxShadow: active ? '0 0 16px rgba(255,255,255,0.20)' : done ? `0 0 12px ${s.bg}` : 'none',
                        }}>
                          {done ? <CheckCircle2 size={13} style={{ color: s.accent }} /> : n}
                        </div>
                        <span style={{
                          fontSize: 11.5, fontWeight: active ? 600 : 500,
                          color: active ? '#fff' : done ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
                          whiteSpace: 'nowrap', display: 'none'
                        }} className="md-step-label">
                          {s.label}
                        </span>
                      </div>
                      {i < 4 && <div style={{ width: 32, height: 1, background: step > n ? `rgba(129,140,248,0.30)` : 'rgba(255,255,255,0.08)', margin: '0 8px', flexShrink: 0 }} />}
                    </div>
                  );
                })}
                <style>{`.md-step-label { display: none; } @media (min-width: 520px) { .md-step-label { display: block !important; } }`}</style>
              </div>

              {/* Progress bar */}
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.55, ease }}
                  style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${meta.accent}, rgba(129,140,248,0.80))`, boxShadow: `0 0 10px ${meta.accent}55` }}
                />
              </div>
            </div>
          )}

          {/* ── FORM CARD ── */}
          <div style={{
            borderRadius: 24, overflow: 'hidden',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(32px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}>
            {/* Card top accent */}
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${meta.accent}55, transparent)` }} />

            <div style={{ padding: '32px 36px 36px' }}>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', borderRadius: 12, marginBottom: 24,
                      background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)',
                      fontSize: 12.5, color: '#fca5a5'
                    }}>
                    <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">

                {/* ════ STEP 1 ════ */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28, ease }}>
                    <StepHeader n="01" title="General Information" desc="Define the core identity and metadata for your tournament session." accent={meta.accent} bg={meta.bg} border={meta.border} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <div>
                        <label className={labelCls}>
                          Tournament Name <span style={{ color: meta.accent }}>*</span>
                        </label>
                        <input
                          type="text" value={formData.quizName} autoFocus
                          onChange={e => { set('quizName', e.target.value); setError(''); }}
                          placeholder="e.g. Decode The Tech 2026: Championship"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Description <OptTag /></label>
                        <textarea rows={3} value={formData.description}
                          onChange={e => set('description', e.target.value)}
                          placeholder="A brief overview of the event — theme, scope, audience."
                          className={inputCls} style={{ resize: 'none' }}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Organization / Institution <OptTag /></label>
                        <div style={{ position: 'relative' }}>
                          <Globe size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
                          <input type="text" value={formData.organizerName}
                            onChange={e => set('organizerName', e.target.value)}
                            placeholder="e.g. Google Developer Groups"
                            className={inputCls} style={{ paddingLeft: 38 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ════ STEP 2 ════ */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28, ease }}>
                    <StepHeader n="02" title="Session Parameters" desc="Configure team structure, scoring mechanics, and session rules." accent={meta.accent} bg={meta.bg} border={meta.border} />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>

                      <ParamCard label="Players Per Team" icon={<Users size={13} style={{ color: '#60a5fa' }} />}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} type="button" onClick={() => set('playersPerTeam', n)}
                              style={{
                                flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
                                fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
                                transition: 'all 0.18s',
                                background: formData.playersPerTeam === n ? 'rgba(96,165,250,0.14)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${formData.playersPerTeam === n ? 'rgba(96,165,250,0.40)' : 'rgba(255,255,255,0.09)'}`,
                                color: formData.playersPerTeam === n ? '#93c5fd' : 'rgba(255,255,255,0.45)',
                              }}>{n}</button>
                          ))}
                        </div>
                      </ParamCard>

                      <ParamCard label="Max Registered Teams" icon={<Trophy size={13} style={{ color: '#a78bfa' }} />}>
                        <input type="number" min={1} max={500} value={formData.maxTeams}
                          onChange={e => set('maxTeams', parseInt(e.target.value) || 50)}
                          className={inputCls} style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}
                        />
                      </ParamCard>

                      <ParamCard label="Late Team Join" icon={<Shield size={13} style={{ color: '#818cf8' }} />}>
                        <TogglePair
                          opts={[{ l: 'Allowed', v: true }, { l: 'Locked', v: false }]}
                          value={formData.allowLateJoin} onChange={v => set('allowLateJoin', v)}
                          activeColor="rgba(129,140,248,0.70)"
                        />
                      </ParamCard>

                      <ParamCard label="Re-Attempt Sessions" icon={<RefreshCw size={13} style={{ color: '#34d399' }} />}>
                        <TogglePair
                          opts={[{ l: 'Yes', v: true }, { l: 'No', v: false }]}
                          value={formData.allowReAttempt} onChange={v => set('allowReAttempt', v)}
                          activeColor="rgba(52,211,153,0.70)"
                        />
                      </ParamCard>

                      <ParamCard label="Time Bonus Scoring" icon={<Zap size={13} style={{ color: '#fbbf24' }} />}>
                        <TogglePair
                          opts={[{ l: 'Active', v: true }, { l: 'Off', v: false }]}
                          value={formData.timeBonusEnabled} onChange={v => set('timeBonusEnabled', v)}
                          activeColor="rgba(251,191,36,0.70)"
                        />
                      </ParamCard>

                      <ParamCard label="Session Language" icon={<Globe size={13} style={{ color: '#38bdf8' }} />}>
                        <select value={formData.quizLanguage} onChange={e => set('quizLanguage', e.target.value)}
                          className={inputCls} style={{ background: '#0d0d10' }}>
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
                  <motion.div key="s3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28, ease }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
                      <StepHeader n="03" title="Rounds Designer" desc={`Configure up to 5 competitive rounds. ${formData.rounds.length}/5 active.`} accent={meta.accent} bg={meta.bg} border={meta.border} noMargin />
                      <button type="button" onClick={addRound}
                        style={{
                          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                          fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em',
                          background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.22)',
                          color: '#a5b4fc', transition: 'all 0.18s'
                        }}>
                        <Plus size={12} />Add Round
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                      {formData.rounds.map((round, idx) => (
                        <div key={idx} style={{
                          padding: '18px 20px', borderRadius: 16,
                          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                          {/* Round header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)',
                                fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: '#a5b4fc'
                              }}>{round.roundNumber}</div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.02em' }}>
                                ROUND {String(round.roundNumber).padStart(2,'0')}
                              </span>
                            </div>
                            <button type="button" onClick={() => removeRound(idx)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                                borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 500,
                                background: 'transparent', border: '1px solid rgba(239,68,68,0.15)',
                                color: 'rgba(239,68,68,0.55)', transition: 'all 0.18s'
                              }}>
                              <Trash2 size={11} />Remove
                            </button>
                          </div>

                          {/* Round fields */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                            <div style={{ gridColumn: 'span 2' }}>
                              <label className={labelCls}>Round Title</label>
                              <input type="text" value={round.roundName}
                                onChange={e => updateRound(idx, 'roundName', e.target.value)}
                                className={inputCls} style={{ fontSize: 13 }}
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Question Type</label>
                              <select value={round.questionType} onChange={e => updateRound(idx, 'questionType', e.target.value)}
                                className={inputCls} style={{ background: '#0d0d10' }}>
                                <option value="mcq">MCQ — Standard</option>
                                <option value="match">Match Pairs</option>
                                <option value="emoji">Emoji Clues</option>
                                <option value="truefalse">True / False</option>
                                <option value="mix">Mix — All Types</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Questions (5–30)</label>
                              <input type="number" min={5} max={30} value={round.questionCount}
                                onChange={e => updateRound(idx, 'questionCount', parseInt(e.target.value) || 5)}
                                className={inputCls} style={{ fontFamily: 'monospace', fontWeight: 700 }}
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Time Limit</label>
                              <select value={round.timeLimitSeconds / 60} onChange={e => updateRound(idx, 'timeLimitSeconds', parseInt(e.target.value) * 60)}
                                className={inputCls} style={{ background: '#0d0d10' }}>
                                {[5,10,15,20,25,30].map(m => <option key={m} value={m}>{m} min</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ════ STEP 4 ════ */}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28, ease }}>
                    <StepHeader n="04" title="Authorization" desc="Set an organizer password to control live sessions and question payloads." accent={meta.accent} bg={meta.bg} border={meta.border} />

                    <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '14px 16px', borderRadius: 14,
                        background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.16)',
                        marginBottom: 6
                      }}>
                        <Lock size={16} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65, margin: 0 }}>
                          This password is required to manage the live session, upload questions,
                          and enforce participant controls during the tournament.
                        </p>
                      </div>
                      <div>
                        <label className={labelCls}>Organizer Password <span style={{ color: meta.accent }}>*</span> <OptTag text="MIN 6 CHARS" /></label>
                        <input type="password" value={formData.organizerPassword}
                          onChange={e => { set('organizerPassword', e.target.value); setError(''); }}
                          placeholder="••••••••••••"
                          className={inputCls} style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Confirm Password <span style={{ color: meta.accent }}>*</span></label>
                        <input type="password" value={formData.confirmPassword}
                          onChange={e => { set('confirmPassword', e.target.value); setError(''); }}
                          placeholder="••••••••••••"
                          className={inputCls} style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ════ STEP 5 — REVIEW ════ */}
                {step === 5 && (
                  <motion.div key="s5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28, ease }}>
                    <StepHeader n="05" title="Review & Launch" desc="Verify your configuration before generating the live tournament cluster." accent={meta.accent} bg={meta.bg} border={meta.border} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {[
                          { k: 'Tournament',  v: formData.quizName },
                          { k: 'Organizer',   v: formData.organizerName || 'Anonymous' },
                          { k: 'Team Size',   v: `${formData.playersPerTeam} players` },
                          { k: 'Max Teams',   v: formData.maxTeams },
                          { k: 'Language',    v: formData.quizLanguage.toUpperCase() },
                          { k: 'Rounds',      v: `${formData.rounds.length} configured` },
                        ].map((item, i) => (
                          <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{item.k}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.v}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Layers size={12} style={{ color: '#818cf8' }} />Rounds Configuration
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {formData.rounds.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(129,140,248,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, fontFamily: 'monospace', color: '#a5b4fc' }}>{r.roundNumber}</span>
                                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.80)' }}>{r.roundName}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>
                                <span>{r.questionCount}Q</span>
                                <span style={{ color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>{r.questionType}</span>
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
                  <motion.div key="s6" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease }}
                    style={{ textAlign: 'center', padding: '8px 0' }}>

                    <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)', boxShadow: '0 0 32px rgba(52,211,153,0.18)' }}>
                      <CheckCircle2 size={28} style={{ color: '#34d399' }} />
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(52,211,153,0.80)', textTransform: 'uppercase', marginBottom: 10 }}>Tournament Created</div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 8 }}>Your arena is live</h2>
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, maxWidth: 360, margin: '0 auto 28px' }}>
                      Share the access code below with participants. They can join instantly from the home portal.
                    </p>

                    {/* Code display */}
                    <div style={{ position: 'relative', maxWidth: 320, margin: '0 auto 24px', padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 48px rgba(0,0,0,0.45)' }}>
                      <div style={{ fontSize: 9.5, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', marginBottom: 10 }}>Access Code</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 42, fontWeight: 900, letterSpacing: '0.20em', color: '#fff', marginBottom: 18 }}>
                        {createdCode}
                      </div>
                      <button onClick={copyCode} style={{
                        display: 'flex', alignItems: 'center', gap: 7, margin: '0 auto',
                        padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, transition: 'all 0.20s',
                        background: copied ? 'rgba(52,211,153,0.14)' : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${copied ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.12)'}`,
                        color: copied ? '#34d399' : 'rgba(255,255,255,0.70)'
                      }}>
                        {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                        {copied ? 'Copied!' : 'Copy Access Code'}
                      </button>
                    </div>

                    {/* Next steps */}
                    <div style={{ maxWidth: 360, margin: '0 auto 28px', textAlign: 'left', padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 12 }}>Next Steps</div>
                      {[
                        `Share code ${createdCode} with participants to join.`,
                        'Go to the question loader to import your content.',
                        'Use your password to manage live rounds from the host panel.',
                      ].map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 2 ? 9 : 0 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(129,140,248,0.14)', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, fontSize: 9.5, fontWeight: 800, fontFamily: 'monospace', color: '#a5b4fc' }}>{i+1}</div>
                          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.52)', lineHeight: 1.55 }}>{t}</span>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => router.push(`/host/${createdCode}/questions`)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 9,
                      padding: '13px 28px', borderRadius: 14, cursor: 'pointer',
                      fontSize: 14, fontWeight: 700, letterSpacing: '0.01em',
                      background: 'linear-gradient(135deg, #fff 0%, #e8eaf0 100%)',
                      color: '#0d0d10', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                      transition: 'all 0.2s'
                    }}>
                      <span>Load Question Payload</span>
                      <ArrowRight size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── NAV BUTTONS ── */}
              {step < 6 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <button type="button" onClick={() => { setError(''); setStep(s => s - 1); }}
                    disabled={step === 1}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 20px', borderRadius: 12, cursor: step === 1 ? 'not-allowed' : 'pointer',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.18s',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                      color: step === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.60)',
                      opacity: step === 1 ? 0 : 1,
                    }}>
                    <ArrowLeft size={13} />Back
                  </button>

                  {step < 5 ? (
                    <button type="button" onClick={nextStep} style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '11px 24px', borderRadius: 12, cursor: 'pointer',
                      fontSize: 13.5, fontWeight: 700, transition: 'all 0.2s',
                      background: 'linear-gradient(135deg, #fff, #e8eaf0)',
                      color: '#0d0d10', border: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.32)'
                    }}>
                      <span>Continue</span><ChevronRight size={15} />
                    </button>
                  ) : (
                    <button type="button" onClick={handleCreateQuiz} disabled={loading} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '11px 24px', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 13.5, fontWeight: 700, transition: 'all 0.2s',
                      background: 'linear-gradient(135deg, rgba(129,140,248,0.25), rgba(167,139,250,0.20))',
                      border: '1px solid rgba(129,140,248,0.35)', color: 'rgba(210,205,255,0.95)',
                      boxShadow: '0 4px 18px rgba(99,102,241,0.22)',
                      opacity: loading ? 0.6 : 1
                    }}>
                      {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />Creating...</> : <><Sparkles size={14} style={{ color: '#a5b4fc' }} />Create Tournament</>}
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 20, textAlign: 'center',
        padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(13,13,16,0.85)', backdropFilter: 'blur(20px)',
        fontSize: 10.5, fontFamily: 'monospace', color: 'rgba(255,255,255,0.20)',
        letterSpacing: '0.10em', textTransform: 'uppercase'
      }}>
        Intelligent Arena · Global Edition · Multi-Tenant WebSocket Architecture
      </footer>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─── Sub-components ───

function StepHeader({ n, title, desc, accent, bg, border, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 24 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '4px 12px', borderRadius: 99, marginBottom: 12,
        background: bg, border: `1px solid ${border}`,
        fontSize: 10, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.14em',
        color: accent, textTransform: 'uppercase'
      }}>
        <Radio size={10} style={{ color: accent }} />
        PHASE {n}
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.015em', color: '#fff', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.60 }}>{desc}</p>
    </div>
  );
}

function OptTag({ text = 'OPTIONAL' }) {
  return <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em', marginLeft: 6 }}>({text})</span>;
}

function ParamCard({ label, icon, children }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase' }}>{label}</label>
        {icon}
      </div>
      {children}
    </div>
  );
}

function TogglePair({ opts, value, onChange, activeColor }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {opts.map(o => (
        <button key={String(o.v)} type="button" onClick={() => onChange(o.v)} style={{
          flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
          fontSize: 12, fontWeight: 600, transition: 'all 0.18s',
          background: value === o.v ? `${activeColor}22` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${value === o.v ? activeColor : 'rgba(255,255,255,0.09)'}`,
          color: value === o.v ? activeColor : 'rgba(255,255,255,0.40)',
        }}>{o.l}</button>
      ))}
    </div>
  );
}
