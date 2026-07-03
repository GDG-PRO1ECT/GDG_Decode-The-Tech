'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { 
  ArrowLeft, Plus, Trash2, Edit, Check, X, Upload, AlertTriangle, 
  Sparkles, Layers, CheckCircle2, ListFilter, Copy, HelpCircle, 
  FileText, Database, Shield, Activity, RefreshCw 
} from 'lucide-react';

export default function HostQuestionsPanel() {
  const params = useParams();
  const router = useRouter();
  const quizCode = params?.quizCode;
  const { authenticatedFetch } = useAdminAuth(quizCode);

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRound, setFilterRound] = useState(0);
  
  // Form State
  const [form, setForm] = useState({
    type: 'mcq',
    round: 1,
    question: '',
    emojiClue: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    matchPairs: [{ left: '', right: '' }],
    actualFact: 'True',
    hasReverseLogic: false,
    explanation: '',
    basePoints: 10
  });

  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (quizCode) {
      fetchQuizSession();
    }
  }, [quizCode]);

  async function fetchQuizSession() {
    try {
      const res = await fetch(`/api/game/status?quizCode=${quizCode}`);
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        // Default form round to first round
        if (data.session.settings?.rounds?.length > 0) {
          const firstRound = data.session.settings.rounds[0];
          setForm(prev => ({
            ...prev,
            round: firstRound.roundNumber,
            type: firstRound.questionType === 'mix' ? 'mcq' : firstRound.questionType,
            basePoints: firstRound.basePoints || 10
          }));
        }
        await fetchQuestions();
      } else {
        showMsg('Failed to sync quiz settings', 'error');
      }
    } catch {
      showMsg('Network error while syncing settings', 'error');
    }
  }

  async function fetchQuestions() {
    const res = await fetch(`/api/questions?quizCode=${quizCode}`);
    const data = await res.json();
    if (res.ok) {
      setQuestions(data.questions || []);
    }
    setLoading(false);
  }

  function showMsg(text, type = 'success') {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }

  // Get active round settings
  const getRoundConfig = (roundNum) => {
    return session?.settings?.rounds?.find(r => r.roundNumber === parseInt(roundNum));
  };

  function startEdit(q) {
    setEditing(q._id);
    const roundConf = getRoundConfig(q.round);
    setForm({ 
      type: q.type || 'mcq',
      round: q.round, 
      question: q.question, 
      emojiClue: q.emojiClue || '', 
      options: (q.options || []).concat(['','','','']).slice(0,4), 
      correctAnswer: q.correctAnswer || '', 
      matchPairs: q.matchPairs && q.matchPairs.length > 0 ? q.matchPairs : [{ left: '', right: '' }],
      actualFact: q.actualFact || 'True', 
      hasReverseLogic: q.hasReverseLogic || false,
      explanation: q.explanation || '', 
      basePoints: q.basePoints || roundConf?.basePoints || 10 
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditing(null);
    const currentRoundNum = form.round;
    const roundConf = getRoundConfig(currentRoundNum);
    setForm({
      type: roundConf?.questionType === 'mix' ? 'mcq' : (roundConf?.questionType || 'mcq'),
      round: currentRoundNum,
      question: '',
      emojiClue: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      matchPairs: [{ left: '', right: '' }],
      actualFact: 'True',
      hasReverseLogic: false,
      explanation: '',
      basePoints: roundConf?.basePoints || 10
    });
    setShowForm(false);
  }

  function updateOption(idx, val) {
    const opts = [...form.options];
    opts[idx] = val;
    setForm({ ...form, options: opts });
  }
  
  function addMatchPair() {
    setForm({ ...form, matchPairs: [...form.matchPairs, { left: '', right: '' }] });
  }

  function updateMatchPair(idx, field, val) {
    const pairs = [...form.matchPairs];
    pairs[idx][field] = val;
    setForm({ ...form, matchPairs: pairs });
  }

  function removeMatchPair(idx) {
    if (form.matchPairs.length <= 1) return;
    setForm({ ...form, matchPairs: form.matchPairs.filter((_, i) => i !== idx) });
  }

  async function saveQuestion(e) {
    e.preventDefault();
    setSaving(true);
    
    // Sanitize payload
    const payload = { 
      ...form, 
      round: parseInt(form.round), 
      basePoints: parseInt(form.basePoints),
      options: form.type === 'mcq' || form.type === 'emoji' ? form.options.filter(Boolean) : (form.type === 'truefalse' ? ['True', 'False'] : []),
      matchPairs: form.type === 'match' ? form.matchPairs.filter(p => p.left && p.right) : []
    };

    if (payload.type === 'mcq' && !payload.options.includes(payload.correctAnswer)) { 
      showMsg('Correct answer must match one of the options exactly!', 'error'); 
      setSaving(false); 
      return; 
    }
    
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { _id: editing, ...payload } : payload;
      const res = await authenticatedFetch('/api/questions', { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...body, quizCode }) 
      });
      if (!res) return; // Hook handled 401
      
      if (res.ok) { 
        showMsg(editing ? 'Question updated!' : 'Question added!'); 
        resetForm(); 
        fetchQuestions(); 
      } else {
        const errorData = await res.json();
        showMsg(errorData.error || 'Save failed', 'error');
      }
    } catch { 
      showMsg('Network error', 'error'); 
    }
    setSaving(false);
  }

  async function deleteQuestion(id, q) {
    if (!confirm(`Delete: "${q.slice(0, 60)}..."?`)) return;
    const res = await authenticatedFetch(`/api/questions?id=${id}&quizCode=${quizCode}`, { 
      method: 'DELETE'
    });
    if (!res) return;
    if (res.ok) {
      showMsg('Question deleted'); 
      fetchQuestions();
    } else {
      showMsg('Failed to delete question', 'error');
    }
  }

  async function deleteAll() {
    if (!confirm('WARNING: DELETE ALL QUESTIONS FOR THIS QUIZ? THIS IS IRREVERSIBLE.')) return;
    const res = await authenticatedFetch(`/api/questions/all?quizCode=${quizCode}`, { method: 'DELETE' });
    if (!res) return;
    if (res.ok) { showMsg('All questions purged', 'success'); fetchQuestions(); }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quizCode', quizCode);

    try {
      const res = await authenticatedFetch('/api/questions/import', {
        method: 'POST',
        body: formData
      });
      if (!res) { setImporting(false); return; }
      const data = await res.json();
      if (res.ok) {
        showMsg(data.message);
        fetchQuestions();
      } else {
        showMsg(data.error || 'Import failed', 'error');
      }
    } catch {
      showMsg('Network error during import', 'error');
    }
    setImporting(false);
    e.target.value = ''; // Reset input
  }

  // Launch Quiz (changes status from draft -> ready)
  async function launchQuiz() {
    // authenticatedFetch handles session verification and 401 redirects automatically
    try {
      const res = await authenticatedFetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'launch', quizCode })
      });
      if (!res) return; // Hook handled 401

      const d = await res.json();
      if (res.ok) {
        showMsg('✓ Quiz compiled & launched! Redirecting...', 'success');
        setTimeout(() => router.push(`/host/${quizCode}/admin`), 1500);
      } else {
        showMsg(d.error || 'Failed to launch quiz', 'error');
      }
    } catch {
      showMsg('Network failure — make sure the backend is running.', 'error');
    }
  }


  // Count validation checking
  const roundValidation = session?.settings?.rounds?.map(r => {
    const count = questions.filter(q => q.round === r.roundNumber).length;
    const required = r.questionCount || 10;
    const met = count >= required;
    return {
      roundNumber: r.roundNumber,
      roundName: r.roundName,
      type: r.questionType,
      count,
      required,
      met
    };
  }) || [];

  const isAllValid = roundValidation.length > 0 && roundValidation.every(v => v.met);

  const filtered = filterRound === 0 ? questions : questions.filter(q => q.round === filterRound);

  return (
    <div className="min-h-screen relative bg-[#020202] text-white font-sans overflow-y-auto selection:bg-white/20 flex flex-col justify-between">
      {/* Ambient background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[60vw] max-w-[600px] max-h-[900px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[50vw] max-w-[900px] max-h-[800px] bg-indigo-600/5 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5"></div>
      </div>

      {/* Sticky Frosted Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-2xl sticky top-0 z-40 shadow-xl">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href={`/host/${quizCode}/admin`} 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-wider text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <ArrowLeft size={14} />
              <span>SUDO_CORE DASHBOARD</span>
            </Link>
            <span className="font-mono text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              ARENA: {quizCode}
            </span>
          </div>

          <div className="font-mono font-bold text-sm text-white tracking-widest flex items-center gap-2.5 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
            <Database size={16} className="text-blue-400" />
            <span>PAYLOAD LOADER ({questions.length})</span>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="inline-flex items-center gap-2 font-mono text-xs tracking-wider bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 px-4 py-2.5 rounded-xl transition-all uppercase cursor-pointer">
              <Upload size={14} className="text-purple-400" />
              <span>{importing ? 'IMPORTING...' : 'IMPORT DOCS/CSV'}</span>
              <input type="file" accept=".docx,.csv,.json" onChange={handleImport} className="hidden" disabled={importing} />
            </label>
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="inline-flex items-center gap-2 font-mono font-bold text-xs tracking-wider bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl transition-all uppercase shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              <Plus size={14} />
              <span>NEW QUESTION</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">
        {msg && (
          <div className={`p-4 font-mono text-xs tracking-wider rounded-xl shadow-lg flex items-center gap-3 uppercase border backdrop-blur-xl ${
            msgType === 'error' 
              ? 'border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
              : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          }`}>
            <Activity size={16} className="animate-pulse flex-shrink-0" /> 
            <span>{msg}</span>
          </div>
        )}

        {/* Validation Dashboard Checklist */}
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-white/60 uppercase">
              <Shield size={16} className="text-emerald-400" />
              <span>STAGE VALIDATION PROTOCOL</span>
            </div>
            <span className={`px-3 py-1 rounded-full font-mono text-xs border ${
              isAllValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              {isAllValid ? 'ALL PHASES OPERATIONAL ✓' : 'ACTION REQUIRED ⚠️'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {roundValidation.map((validation, idx) => (
              <div 
                key={idx}
                className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                  validation.met 
                    ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50' 
                    : 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[10px] tracking-widest text-white/50 uppercase">
                      ROUND 0{validation.roundNumber} &bull; {validation.type.toUpperCase()}
                    </span>
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      validation.met ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                    }`}>
                      {validation.met ? 'READY' : 'INCOMPLETE'}
                    </span>
                  </div>
                  <h5 className="font-bold text-base text-white mb-2">{validation.roundName}</h5>
                </div>
                <div className="flex items-baseline gap-1.5 mt-3 pt-3 border-t border-white/5">
                  <span className="font-mono text-3xl font-black text-white">{validation.count}</span>
                  <span className="font-mono text-xs text-white/40">/ {validation.required} payloads inserted</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
            <p className="font-light text-xs sm:text-sm text-white/60">
              {isAllValid 
                ? 'All configured rounds meet minimum question criteria. Compile and launch to activate live player uplinks.'
                : 'Insert required question payloads for each round to unlock arena compilation.'}
            </p>
            {session?.status === 'draft' ? (
              <button
                type="button"
                disabled={!isAllValid}
                onClick={launchQuiz}
                className={`px-8 py-4 font-mono font-bold tracking-wider text-xs uppercase transition-all rounded-xl flex items-center gap-2 ${
                  isAllValid 
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:opacity-90 shadow-[0_0_25px_rgba(16,185,129,0.4)]' 
                    : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                }`}
              >
                <Sparkles size={16} />
                <span>COMPILE & LAUNCH ARENA</span>
              </button>
            ) : (
              <div className="px-5 py-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs rounded-xl uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={16} />
                <span>ARENA STATUS: OPERATIONAL ({session?.status?.toUpperCase()})</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button 
            onClick={() => setFilterRound(0)}
            className={`px-5 py-2.5 font-mono text-xs tracking-wider uppercase border rounded-xl transition-all flex items-center gap-2 flex-shrink-0 ${
              filterRound === 0 
                ? 'bg-white text-black font-bold border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
            }`}
          >
            <ListFilter size={14} />
            <span>ALL ROUNDS ({questions.length})</span>
          </button>
          {session?.settings?.rounds?.map((r, idx) => (
            <button 
              key={idx}
              onClick={() => setFilterRound(r.roundNumber)}
              className={`px-5 py-2.5 font-mono text-xs tracking-wider uppercase border rounded-xl transition-all flex-shrink-0 ${
                filterRound === r.roundNumber 
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400 font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              R0{r.roundNumber} ({questions.filter(q => q.round === r.roundNumber).length})
            </button>
          ))}
        </div>

        {/* Dynamic Add / Edit Form */}
        {showForm && (
          <div className="bg-black/80 backdrop-blur-3xl border border-white/15 p-6 sm:p-8 rounded-2xl shadow-2xl relative z-20 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="font-bold text-xl text-white tracking-wide flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" /> 
                {editing ? 'EDIT QUESTION PAYLOAD' : 'INSERT NEW QUESTION PAYLOAD'}
              </div>
              <button 
                onClick={resetForm} 
                className="font-mono text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 uppercase transition-all flex items-center gap-1.5"
              >
                <X size={14} /> CANCEL
              </button>
            </div>
            
            <form onSubmit={saveQuestion} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="font-mono text-xs text-blue-400 tracking-wider block mb-2 uppercase font-semibold">ROUND *</label>
                  <select 
                    value={form.round} 
                    onChange={e => {
                      const r = parseInt(e.target.value);
                      const roundConf = getRoundConfig(r);
                      setForm({ 
                        ...form, 
                        round: r, 
                        type: roundConf?.questionType === 'mix' ? 'mcq' : (roundConf?.questionType || 'mcq'),
                        basePoints: roundConf?.basePoints || 10
                      });
                    }}
                    className="w-full bg-[#0a0a0e] border border-white/10 text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                  >
                    {session?.settings?.rounds?.map((r, i) => (
                      <option key={i} value={r.roundNumber}>Round 0{r.roundNumber} ({r.roundName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs text-purple-400 tracking-wider block mb-2 uppercase font-semibold">QUESTION TYPE *</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    disabled={getRoundConfig(form.round)?.questionType !== 'mix'}
                    className="w-full bg-[#0a0a0e] border border-white/10 text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 disabled:opacity-50 transition-all"
                  >
                    <option value="mcq">MCQ (Multiple Choice)</option>
                    <option value="match">Match The Following</option>
                    <option value="emoji">Emoji Clue MCQ</option>
                    <option value="truefalse">True / False</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs text-emerald-400 tracking-wider block mb-2 uppercase font-semibold">POINTS *</label>
                  <input 
                    type="number" 
                    value={form.basePoints} 
                    onChange={e => setForm({ ...form, basePoints: e.target.value })}
                    className="w-full bg-[#0a0a0e] border border-white/10 text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-white/80 tracking-wider block mb-2 uppercase font-semibold">QUESTION / STATEMENT *</label>
                <textarea 
                  required 
                  value={form.question} 
                  onChange={e => setForm({ ...form, question: e.target.value })} 
                  rows={3}
                  placeholder="e.g. Which programming language is known for its mascot, Ferris the Crab?"
                  className="w-full bg-white/[0.03] border border-white/10 text-white font-sans text-sm px-5 py-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white/[0.05] transition-all resize-none" 
                />
              </div>

              {form.type === 'emoji' && (
                <div>
                  <label className="font-mono text-xs text-yellow-400 tracking-wider block mb-2 uppercase font-semibold">EMOJI CLUE 🎯</label>
                  <input 
                    value={form.emojiClue} 
                    onChange={e => setForm({ ...form, emojiClue: e.target.value })}
                    placeholder="e.g. 🦀 🛡️ ⚙️" 
                    className="w-full bg-white/[0.03] border border-yellow-500/30 text-white text-3xl px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-500 text-center tracking-[0.3em] transition-all" 
                  />
                </div>
              )}

              {form.type === 'mcq' || form.type === 'emoji' ? (
                <div className="bg-white/[0.02] p-6 border border-white/5 rounded-2xl space-y-4">
                  <label className="font-mono text-xs text-blue-400 tracking-wider block uppercase font-semibold">OPTIONS *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-stretch rounded-xl overflow-hidden border border-white/10 bg-black/40">
                        <span className="font-mono text-xs font-bold text-white/60 w-12 flex items-center justify-center bg-white/5 border-r border-white/10">
                          {['A','B','C','D'][i]}
                        </span>
                        <input 
                          value={opt} 
                          onChange={e => updateOption(i, e.target.value)}
                          placeholder={`Option ${['A','B','C','D'][i]}`}
                          className="flex-1 bg-transparent text-white font-sans text-xs px-4 py-3 focus:outline-none focus:bg-white/[0.05] transition-all" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : form.type === 'match' ? (
                <div className="bg-white/[0.02] p-6 border border-white/5 rounded-2xl space-y-4">
                  <label className="font-mono text-xs text-blue-400 tracking-wider block uppercase font-semibold">MATCHING PAIRS *</label>
                  <div className="space-y-3">
                    {form.matchPairs.map((pair, i) => (
                      <div key={i} className="flex flex-col md:flex-row items-center gap-3">
                        <input 
                          value={pair.left} 
                          onChange={e => updateMatchPair(i, 'left', e.target.value)}
                          placeholder="Left Item" 
                          className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl text-white font-sans text-xs px-4 py-3 focus:outline-none focus:border-blue-500 transition-all" 
                        />
                        <span className="text-blue-400 font-bold">&harr;</span>
                        <input 
                          value={pair.right} 
                          onChange={e => updateMatchPair(i, 'right', e.target.value)}
                          placeholder="Right Item" 
                          className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl text-white font-sans text-xs px-4 py-3 focus:outline-none focus:border-blue-500 transition-all" 
                        />
                        <button 
                          type="button" 
                          onClick={() => removeMatchPair(i)} 
                          className="text-white/40 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={addMatchPair} 
                      className="w-full py-3 border border-dashed border-white/20 hover:border-white/40 text-white/60 hover:text-white rounded-xl font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add Match Pair
                    </button>
                  </div>
                </div>
              ) : form.type === 'truefalse' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] p-6 border border-white/5 rounded-2xl">
                  <div>
                    <label className="font-mono text-xs text-emerald-400 tracking-wider block mb-2 uppercase font-semibold">CORRECT VAL *</label>
                    <select 
                      value={form.correctAnswer} 
                      onChange={e => setForm({ ...form, correctAnswer: e.target.value })}
                      className="w-full bg-[#0a0a0e] border border-emerald-500/30 text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-all"
                    >
                      <option value="">— Select Correct Value —</option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="hasReverseLogic"
                      checked={form.hasReverseLogic}
                      onChange={e => setForm({ ...form, hasReverseLogic: e.target.checked })}
                      className="h-4 w-4 bg-black/40 border border-white/10 rounded text-blue-500 focus:ring-0"
                    />
                    <label htmlFor="hasReverseLogic" className="font-mono text-xs text-white/80 uppercase tracking-wider cursor-pointer">
                      Enable reverse logic (players must answer opposite)
                    </label>
                  </div>
                </div>
              ) : null}

              {(form.type === 'mcq' || form.type === 'emoji') && (
                <div className="bg-white/[0.02] p-6 border border-white/5 rounded-2xl">
                  <label className="font-mono text-xs text-emerald-400 tracking-wider block mb-2 uppercase font-semibold">CORRECT ANSWER *</label>
                  <select 
                    required 
                    value={form.correctAnswer} 
                    onChange={e => setForm({ ...form, correctAnswer: e.target.value })}
                    className="w-full bg-[#0a0a0e] border border-emerald-500/30 text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="">— Select Option —</option>
                    {form.options.filter(Boolean).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="font-mono text-xs text-white/50 tracking-wider block mb-2 uppercase font-semibold">EXPLANATION / TRIVIA LOG</label>
                <input 
                  value={form.explanation} 
                  onChange={e => setForm({ ...form, explanation: e.target.value })}
                  placeholder="Details revealed post-submission (optional)..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl text-white font-sans text-xs px-5 py-4 focus:outline-none focus:border-blue-500 focus:bg-white/[0.05] transition-all" 
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-mono font-bold tracking-wider text-xs uppercase px-8 py-4 rounded-xl flex-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  <span>{saving ? 'UPLOADING...' : editing ? 'SAVE QUESTION PAYLOAD' : 'COMMIT QUESTION PAYLOAD'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white px-8 py-4 rounded-xl font-mono text-xs uppercase tracking-wider transition-all"
                >
                  ABORT
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4 pt-4">
          <div className="font-mono font-bold text-white/50 text-xs tracking-wider mb-6 border-b border-white/10 pb-4 flex items-center justify-between uppercase">
            <span>{filterRound ? `ROUND 0${filterRound} PAYLOADS` : 'ALL QUESTION PAYLOADS'}</span>
            <span>{filtered.length} PAYLOADS FOUND</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 border border-white/5 border-dashed bg-white/[0.01] rounded-2xl">
              <Database className="w-12 h-12 mx-auto mb-4 text-white/20" />
              <div className="font-mono text-white/40 text-xs tracking-widest uppercase">No question payloads found in this sector.</div>
            </div>
          ) : (
            filtered.map((q, idx) => (
              <div 
                key={q._id} 
                className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 p-6 sm:p-8 rounded-2xl relative transition-all flex flex-col md:flex-row justify-between gap-6 group"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 uppercase tracking-wider">
                      ROUND 0{q.round} &bull; {q.type?.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs text-white/40">ID: {q.questionNumber || idx + 1}</span>
                  </div>

                  {q.emojiClue && <div className="text-4xl tracking-widest my-2">{q.emojiClue}</div>}
                  <h4 className="font-sans font-semibold text-white text-base sm:text-lg leading-relaxed">{q.question}</h4>

                  {q.type === 'match' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-black/40 p-4 rounded-xl border border-white/5">
                      {q.matchPairs?.map((pair, i) => (
                        <div key={i} className="font-mono text-xs text-white/80 flex items-center gap-2">
                          <span>{pair.left}</span> 
                          <span className="text-blue-400 font-bold">&rarr;</span> 
                          <span className="text-emerald-400">{pair.right}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-black/40 p-4 rounded-xl border border-white/5">
                      {q.options?.map((opt, i) => (
                        <div 
                          key={i} 
                          className={`font-mono text-xs px-3.5 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                            opt === q.correctAnswer 
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                              : 'border-white/5 text-white/60 bg-white/[0.01]'
                          }`}
                        >
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-white/5 text-[10px]">{['A','B','C','D'][i]}</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="font-mono text-xs text-white/60 bg-white/[0.02] border-l-2 border-blue-500 pl-3 py-1.5 rounded-r">
                      <span className="text-blue-400 font-semibold">LOG:</span> {q.explanation}
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto justify-end items-center md:items-end border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-2 rounded-xl uppercase tracking-wider">
                    {q.basePoints} CYC
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEdit(q)} 
                      className="font-mono text-xs tracking-wider text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 uppercase rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Edit size={14} /> EDIT
                    </button>
                    <button 
                      onClick={() => deleteQuestion(q._id, q.question)} 
                      className="font-mono text-xs tracking-wider text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 uppercase rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> DELETE
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
