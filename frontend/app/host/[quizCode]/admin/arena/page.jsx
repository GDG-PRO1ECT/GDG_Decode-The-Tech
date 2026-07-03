'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const ROUND_LABELS = {
  1: 'DECODE THE JARGON',
  2: 'EMOJI PATTERN ANALYSIS',
  3: 'REVERSE LOGIC GATE',
};
const ROUND_COLORS = {
  1: { border: 'border-neon-cyan', text: 'text-neon-cyan', bg: 'bg-neon-cyan/10', hex: '#00F0FF' },
  2: { border: 'border-neon-yellow', text: 'text-neon-yellow', bg: 'bg-neon-yellow/10', hex: '#FFC933' },
  3: { border: 'border-neon-magenta', text: 'text-neon-magenta', bg: 'bg-neon-magenta/10', hex: '#FF007F' },
};

export default function AdminArenaPage() {
  const params = useParams();
  const quizCode = params?.quizCode;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRound, setFilterRound] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchQuestions(); }, []);

  async function fetchQuestions() {
    try {
      const adminPass = sessionStorage.getItem(`admin_pass_${quizCode}`) || '';
      const res = await fetch('/api/admin/questions', {
        headers: { 'x-admin-password': adminPass },
      });
      if (!res.ok) { setError('Unauthorized — please log in as admin'); setLoading(false); return; }
      const { questions } = await res.json();
      setQuestions(questions || []);
    } catch {
      setError('Failed to load questions');
    }
    setLoading(false);
  }

  const filtered = filterRound === 0 ? questions : questions.filter(q => q.round === filterRound);
  const counts = {
    1: questions.filter(q => q.round === 1).length,
    2: questions.filter(q => q.round === 2).length,
    3: questions.filter(q => q.round === 3).length,
  };

  return (
    <div className="min-h-screen relative bg-[#020202] text-gray-200 overflow-hidden font-body">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('/images/stardust.png')] opacity-10 mix-blend-screen pointer-events-none" />
      <div className="cyber-grid absolute inset-0 pointer-events-none" />
      <div className="scanline" />
      <div className="ambient-orb orb-red opacity-30" />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href={`/host/${quizCode}/admin`} className="font-display font-bold text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest bg-white/5 px-6 py-2.5 rounded-full border border-white/5 hover:bg-white/10">
            <span className="text-neon-cyan text-lg leading-none -mt-1">←</span> ADMIN HQ
          </Link>

          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_10px_#00F0FF]" />
            <span className="font-display font-black text-xl tracking-[0.3em] text-white">ARENA PREVIEW</span>
            <span className="font-mono text-[9px] text-neon-cyan/70 tracking-widest border border-neon-cyan/30 px-3 py-1 rounded-full bg-neon-cyan/5">ADMIN VIEW — ANSWERS VISIBLE</span>
          </div>

          <div className="font-mono text-[10px] text-gray-400 tracking-widest bg-dark-900/80 px-6 py-2.5 rounded-full border border-white/5 shadow-inner">
            {questions.length} TOTAL QUESTIONS
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10 relative z-10">

        {/* Round filter tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[1, 2, 3].map(r => {
            const c = ROUND_COLORS[r];
            const active = filterRound === r;
            return (
              <button key={r} onClick={() => setFilterRound(active ? 0 : r)}
                className={`glass-panel p-6 rounded-[2rem] text-center transition-all border ${active ? `${c.border} ${c.bg} scale-[1.02] shadow-[0_0_30px_rgba(0,0,0,0.3)]` : 'border-white/5 hover:border-white/20'}`}>
                <div className={`font-display font-black text-5xl mb-2 ${active ? c.text : 'text-white'}`}>{counts[r]}</div>
                <div className="font-mono text-[10px] text-gray-400 tracking-[0.3em] uppercase">PHASE 0{r}</div>
                <div className={`font-body text-xs font-bold mt-1 tracking-widest ${active ? 'text-white' : 'text-gray-500'}`}>{ROUND_LABELS[r]}</div>
              </button>
            );
          })}
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-20 glass-panel rounded-[2rem] border border-neon-red/30">
            <div className="text-4xl mb-4">🚫</div>
            <div className="font-mono text-neon-red text-sm tracking-widest">{error}</div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20">
            <span className="w-10 h-10 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin inline-block mb-4 shadow-[0_0_15px_#00F0FF]" />
            <div className="font-mono text-[10px] text-neon-cyan tracking-[0.3em] uppercase">Loading questions...</div>
          </div>
        )}

        {/* Questions list */}
        {!loading && !error && (
          <div className="space-y-4">
            <div className="font-mono text-[10px] text-gray-500 tracking-[0.3em] mb-6 border-b border-white/5 pb-4 flex items-center justify-between uppercase">
              <span>{filterRound ? `PHASE 0${filterRound} QUESTIONS` : 'ALL QUESTIONS'}</span>
              <span className="bg-dark-950 px-4 py-1 border border-white/5 rounded-full">{filtered.length} NODES</span>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-24 border border-white/5 border-dashed bg-dark-900/50 rounded-[2rem]">
                <div className="text-5xl mb-6 opacity-30">📭</div>
                <div className="font-mono text-gray-500 text-[10px] tracking-[0.4em] uppercase">No questions found.</div>
              </div>
            )}

            {filtered.map((q, idx) => {
              const c = ROUND_COLORS[q.round];
              const isExpanded = expandedId === q._id;
              return (
                <div key={q._id}
                  className={`glass-panel rounded-[2rem] border-l-4 overflow-hidden transition-all ${c.border} ${isExpanded ? 'shadow-[0_0_40px_rgba(0,0,0,0.4)]' : ''}`}>

                  {/* Question header — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : q._id)}
                    className="w-full text-left p-6 flex items-start gap-6 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Round badge */}
                    <div className={`flex-shrink-0 font-mono text-[9px] font-bold px-3 py-1.5 rounded-lg border tracking-widest uppercase ${c.border} ${c.text} ${c.bg}`}>
                      P0{q.round}
                    </div>

                    {/* Emoji clue if round 2 */}
                    {q.emojiClue && (
                      <div className="flex-shrink-0 text-3xl tracking-widest">{q.emojiClue}</div>
                    )}

                    {/* Question text */}
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-white font-bold text-lg leading-relaxed mb-1 pr-4">
                        {q.question}
                      </div>
                      <div className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">
                        {ROUND_LABELS[q.round]} • {q.basePoints} pts
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <div className={`flex-shrink-0 font-mono text-[10px] tracking-widest transition-transform mt-1 ${c.text} ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
                  </button>

                  {/* Expanded: options with correct answer highlighted */}
                  {isExpanded && (
                    <div className="px-6 pb-8 border-t border-white/5">
                      {/* Options grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 mb-6">
                        {q.options?.map((opt, i) => {
                          const letter = ['A', 'B', 'C', 'D'][i];
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div
                              key={i}
                              className={`p-5 rounded-[1.5rem] flex items-center gap-4 font-display font-bold text-lg relative overflow-hidden border transition-all ${
                                isCorrect
                                  ? 'bg-neon-green/15 border-neon-green shadow-[0_0_20px_rgba(0,255,102,0.15)] text-white'
                                  : 'bg-dark-900/60 border-white/5 text-gray-400'
                              }`}
                            >
                              {isCorrect && (
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-neon-green shadow-[0_0_10px_#00FF66]" />
                              )}
                              <span className={`font-mono text-sm ${isCorrect ? 'text-neon-green' : 'text-gray-600'}`}>
                                [{letter}]
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isCorrect && (
                                <span className="text-neon-green text-xl">✓</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Correct answer highlight */}
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 bg-neon-green/10 border border-neon-green/40 rounded-2xl px-6 py-4 flex items-center gap-3">
                          <span className="text-neon-green text-xl">✓</span>
                          <div>
                            <div className="font-mono text-[9px] text-neon-green/70 tracking-[0.3em] uppercase mb-1">Correct Answer</div>
                            <div className="font-display font-bold text-white text-lg">{q.correctAnswer}</div>
                          </div>
                        </div>

                        {q.round === 3 && q.actualFact && (
                          <div className="flex-1 bg-neon-yellow/10 border border-neon-yellow/40 rounded-2xl px-6 py-4 flex items-center gap-3">
                            <span className="text-neon-yellow text-xl">📋</span>
                            <div>
                              <div className="font-mono text-[9px] text-neon-yellow/70 tracking-[0.3em] uppercase mb-1">Actual Fact</div>
                              <div className="font-display font-bold text-white text-lg">{q.actualFact}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {q.explanation && (
                        <div className="mt-4 bg-dark-900/80 border border-white/5 rounded-2xl px-6 py-4">
                          <div className="font-mono text-[9px] text-gray-500 tracking-[0.3em] uppercase mb-2">Explanation</div>
                          <div className="font-body text-gray-300 text-sm leading-relaxed">{q.explanation}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
