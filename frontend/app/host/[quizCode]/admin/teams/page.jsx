'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const GdgLogo = ({ className = "w-6 h-6" }) => (
  <Image src="/gdg-logo.png" alt="GDG Logo" width={100} height={100} className={`${className} object-contain drop-shadow-md`} />
);

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const params = useParams();
  const quizCode = params?.quizCode;
  const [form, setForm] = useState({ teamName: '', teamNumber: '', p1: '', p2: '', p3: '' });
  const [bulkText, setBulkText] = useState('');
  const [scoreForm, setScoreForm] = useState({ round1: 0, round2: 0, round3: 0, bonusPoints: 0 });
  const [baseUrl, setBaseUrl] = useState('');
  const [copied, setCopied] = useState('');
  const { authenticatedFetch } = useAdminAuth(quizCode);

  useEffect(() => { 
    if (quizCode) {
      fetchTeams();
      if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
    }
  }, [quizCode]);

  async function fetchTeams() {
    if (!quizCode) return;
    const res = await fetch(`/api/teams?quizCode=${quizCode}`);
    const { teams } = await res.json();
    setTeams(teams || []);
    setLoading(false);
  }

  function showMsg(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4000);
  }

  async function addTeam(e) {
    e.preventDefault();
    setAdding(true);
    try {
      const players = [form.p1, form.p2, form.p3].filter(Boolean).map(name => ({ name }));
      const res = await authenticatedFetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: form.teamName, teamNumber: parseInt(form.teamNumber), players, quizCode }),
      });
      if (!res) { setAdding(false); return; }
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || 'Error', 'error'); }
      else {
        showMsg(`Node "${form.teamName}" initialized successfully!`);
        setForm({ teamName: '', teamNumber: '', p1: '', p2: '', p3: '' });
        setShowManual(false);
        fetchTeams();
      }
    } catch { showMsg('Network error', 'error'); }
    setAdding(false);
  }

  async function deleteTeam(teamId, teamName) {
    if (!confirm(`Delete node "${teamName}" completely?`)) return;
    const res = await authenticatedFetch(`/api/teams/${teamId}?quizCode=${quizCode}`, { 
      method: 'DELETE'
    });
    if (!res) return;
    showMsg(`Node "${teamName}" removed from matrix`);
    fetchTeams();
  }

  async function setDisqualification(teamId, isDisqualified) {
    const actionStr = isDisqualified ? 'Disqualify' : 'Reinstate';
    if (!confirm(`${actionStr} this node?`)) return;
    
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/teams/${teamId}/disqualify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDisqualified, quizCode })
      });
      if (!res) return;
      if (res.ok) { showMsg(`Node ${actionStr}d successfully`); fetchTeams(); }
      else { showMsg(`Error processing request`, 'error'); }
    } catch { showMsg('Network error', 'error'); }
  }

  async function deleteAll() {
    if (!confirm('WARNING: PURGE ALL NODES? This action cannot be undone!')) return;
    const res = await authenticatedFetch(`/api/teams?quizCode=${quizCode}`, { 
      method: 'DELETE'
    });
    if (!res) return;
    showMsg('All nodes purged');
    fetchTeams();
  }

  async function bulkImport() {
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const teamsToImport = [];
    
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());
      const [teamName, ...players] = parts;
      if (!teamName) continue;
      teamsToImport.push({ teamName, players: players.map(name => ({ name })), quizCode });
    }

    if (teamsToImport.length === 0) return;

    try {
      const res = await authenticatedFetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsToImport),
      });
      if (!res) return;
      const data = await res.json();
      if (res.ok) {
        showMsg(`Import completed: ${data.teams?.length || 0} nodes initialized`);
        setBulkText(''); setShowBulk(false); fetchTeams();
      } else {
        showMsg(data.error || 'Import failed', 'error');
      }
    } catch {
      showMsg('Network error during import', 'error');
    }
  }

  async function updateScore(e) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await authenticatedFetch(`/api/teams/${editingScore.teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoreForm, quizCode }),
      });
      if (!res) { setAdding(false); return; }
      if (res.ok) {
        showMsg(`Scores for ${editingScore.teamName} updated`);
        setEditingScore(null);
        fetchTeams();
      } else {
        showMsg('Error updating scores', 'error');
      }
    } catch { showMsg('Network error', 'error'); }
    setAdding(false);
  }

  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
    showMsg('Link copied to clipboard!', 'success');
  }

  function exportLinks() {
    const rows = [['Team #', 'Team Name', 'Players', 'Team Portal URL', 'Play URL']];
    teams.forEach(t => {
      rows.push([t.teamNumber, t.teamName, t.players.map(p => p.name).join(', '), `${baseUrl}/quiz/${quizCode}/team/${t.teamId}`, `${baseUrl}/quiz/${quizCode}/play/${t.teamId}`]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `team-links-${quizCode}.csv`;
    a.click();
    showMsg('Exported team links to CSV', 'success');
  }

  return (
    <div className="min-h-screen relative bg-dark-950 text-gray-200 overflow-hidden font-body selection:bg-gdg-blue/30 selection:text-white">
      <div className="absolute inset-0 bg-[url('/images/stardust.png')] opacity-[0.03] pointer-events-none mix-blend-screen"></div>
      <div className="cyber-grid absolute inset-0 pointer-events-none"></div>

      {/* Ambience */}
      <div className="ambient-orb orb-blue"></div>
      
      <div className="border-b border-white/5 bg-dark-950/80 backdrop-blur-xl sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href={`/host/${quizCode}/admin`} className="font-display font-bold text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest bg-white/5 px-6 py-2.5 rounded-full border border-white/5 hover:bg-white/10">
            <span className="text-gdg-blue text-lg leading-none -mt-1">←</span> COMMAND CENTER
          </Link>
          <div className="flex items-center gap-4 bg-dark-900/80 px-6 py-2.5 border border-white/10 rounded-full shadow-inner">
            <GdgLogo className="w-5 h-5" />
            <span className="font-display font-bold text-sm tracking-widest text-white">NODE MATRIX</span>
          </div>
          <div className="font-mono font-bold text-gdg-blue tracking-[0.2em] bg-gdg-blue/10 px-6 py-2.5 rounded-full border border-gdg-blue/20 shadow-[0_0_15px_rgba(66,133,244,0.1)] text-[10px] uppercase">
            {teams.length} ACTIVE NODES
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-10 space-y-8 relative z-10">
        <AnimatePresence>
          {msg.text && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`p-4 rounded-xl border font-mono text-sm shadow-lg flex items-center gap-3 ${msg.type === 'error' ? 'border-gdg-red/30 text-gdg-red bg-gdg-red/10' : 'border-gdg-green/30 text-gdg-green bg-gdg-green/10'}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span> {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-4 glass-panel p-4 rounded-2xl border border-white/5">
          <button onClick={() => {setShowManual(!showManual); setShowBulk(false);}} className={`px-6 py-3 rounded-xl font-display font-bold text-[10px] tracking-widest transition-all ${showManual ? 'bg-gdg-blue text-white shadow-[0_0_15px_rgba(66,133,244,0.4)]' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}>
            + NEW NODE
          </button>
          <button onClick={() => {setShowBulk(!showBulk); setShowManual(false);}} className={`px-6 py-3 rounded-xl font-display font-bold text-[10px] tracking-widest transition-all ${showBulk ? 'bg-gdg-blue text-white shadow-[0_0_15px_rgba(66,133,244,0.4)]' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}>
            📋 BULK IMPORT
          </button>
          <button onClick={exportLinks} className="px-6 py-3 rounded-xl font-display font-bold text-[10px] tracking-widest text-gdg-yellow border border-gdg-yellow/30 hover:bg-gdg-yellow/10 transition-all flex items-center gap-2">
            🔗 EXPORT LINKS
          </button>
          <button onClick={deleteAll} className="ml-auto px-6 py-3 rounded-xl font-display font-bold text-[10px] tracking-widest text-gdg-red border border-gdg-red/30 hover:bg-gdg-red/10 transition-all flex items-center gap-2">
            <span>🗑</span> PURGE ALL
          </button>
        </div>

        {/* Bulk import */}
        <AnimatePresence>
          {showBulk && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-8 rounded-[2.5rem] glass-panel border border-gdg-blue/30 shadow-[0_20px_50px_rgba(66,133,244,0.1)] overflow-hidden">
              <div className="font-display font-bold text-white text-lg mb-4 tracking-widest flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gdg-blue/10 flex items-center justify-center text-gdg-blue border border-gdg-blue/20">📋</div>
                BULK REGISTRATION
              </div>
              <div className="font-mono text-[10px] text-gray-400 mb-6 tracking-widest bg-dark-950/80 p-4 rounded-xl border border-white/5 uppercase">
                Format: TeamName,Player1,Player2,Player3 (one team per line)
              </div>
              <textarea
                value={bulkText} onChange={e => setBulkText(e.target.value)}
                placeholder={`Circuit Breakers,Arjun,Priya,Dev\nPixel Pirates,Riya,Karan,Sneha`}
                rows={6}
                className="w-full bg-dark-900 border border-white/10 rounded-xl text-white font-mono text-sm px-6 py-4 focus:outline-none focus:border-gdg-blue focus:ring-1 focus:ring-gdg-blue placeholder-gray-600 mb-6 transition-all resize-none shadow-inner"
              />
              <button onClick={bulkImport} className="btn-premium btn-gdg-blue px-10 py-4 text-sm w-full md:w-auto">
                EXECUTE IMPORT
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Add */}
        <AnimatePresence>
          {showManual && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-8 rounded-[2.5rem] glass-panel border border-gdg-green/30 shadow-[0_20px_50px_rgba(52,168,83,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gdg-green/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="font-display font-bold text-white text-lg mb-6 tracking-widest flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gdg-green/10 flex items-center justify-center text-gdg-green border border-gdg-green/20">➕</div>
                MANUAL INITIALIZATION
              </div>
              <form onSubmit={addTeam} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                <div className="lg:col-span-2">
                  <label className="font-mono text-[10px] text-gray-400 tracking-widest block mb-2 uppercase ml-2">Squad Designation *</label>
                  <input required value={form.teamName} onChange={e => setForm({...form, teamName: e.target.value})} placeholder="e.g. Byte Busters"
                    className="w-full bg-dark-950/80 border border-white/10 rounded-2xl text-white font-body text-sm px-5 py-4 focus:outline-none focus:border-gdg-green focus:ring-1 focus:ring-gdg-green transition-all" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-gray-400 tracking-widest block mb-2 uppercase ml-2">Node Index *</label>
                  <input required type="number" min="1" value={form.teamNumber} onChange={e => setForm({...form, teamNumber: e.target.value})} placeholder="1"
                    className="w-full bg-dark-950/80 border border-white/10 rounded-2xl text-white font-body text-sm px-5 py-4 focus:outline-none focus:border-gdg-green focus:ring-1 focus:ring-gdg-green transition-all text-center" />
                </div>
                {['p1', 'p2', 'p3'].map((k, i) => (
                  <div key={k}>
                    <label className="font-mono text-[10px] text-gray-500 tracking-widest block mb-2 uppercase ml-2">Operative 0{i + 1} {i === 0 ? '*' : ''}</label>
                    <input required={i === 0} value={form[k]} onChange={e => setForm({...form, [k]: e.target.value})} placeholder={`Player Name`}
                      className="w-full bg-dark-950/80 border border-white/10 rounded-2xl text-white font-body text-sm px-5 py-4 focus:outline-none focus:border-gdg-blue transition-all" />
                  </div>
                ))}
                <div className="lg:col-span-3 pt-8 border-t border-white/5 mt-4">
                  <button type="submit" disabled={adding} className="btn-premium btn-gdg-green w-full md:w-auto px-10 py-4 text-sm disabled:opacity-50">
                    {adding ? 'INITIALIZING...' : 'INITIALIZE NODE'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Teams list */}
        <div className="p-8 rounded-[3rem] glass-panel border border-white/5 shadow-glass bg-gradient-to-b from-dark-900/80 to-dark-950/80">
          <div className="font-display font-bold text-white text-lg mb-8 pb-6 border-b border-white/10 tracking-widest flex items-center justify-between">
            <span>REGISTERED NODES</span>
            <span className="font-mono text-[10px] text-gray-400 bg-dark-950 px-4 py-2 rounded-full border border-white/5 shadow-inner uppercase tracking-widest">{teams.length} TOTAL</span>
          </div>
          
          {loading ? (
            <div className="text-center py-20">
              <span className="w-10 h-10 border-4 border-gdg-blue border-t-transparent rounded-full animate-spin inline-block mb-4 shadow-[0_0_15px_rgba(66,133,244,0.5)]"></span>
              <div className="font-mono text-[10px] text-gdg-blue tracking-[0.3em] uppercase font-bold">Syncing matrix data...</div>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-20 border border-white/5 rounded-[2rem] bg-dark-950/50 border-dashed">
              <div className="text-4xl mb-4 opacity-50 grayscale">📡</div>
              <div className="font-mono text-gray-500 text-[10px] tracking-widest uppercase">No nodes initialized.</div>
            </div>
          ) : (
            <div className="max-h-[800px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 xl:grid-cols-2 gap-4">
              {teams.map((team, idx) => (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.02, 0.5) }} key={team.teamId} className={`p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all group relative overflow-hidden border ${team.isDisqualified ? 'border-gdg-red/50 bg-gdg-red/5' : 'border-white/5 hover:border-white/20 bg-dark-950/50 hover:bg-dark-950'}`}>
                  {team.isDisqualified && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gdg-red animate-pulse shadow-[0_0_10px_#EA4335]" />}
                  {!team.isDisqualified && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gdg-blue/20 group-hover:bg-gdg-blue transition-colors" />}
                  
                  <div className={`font-display font-black text-2xl w-14 text-center flex-shrink-0 ${team.isDisqualified ? 'text-gdg-red/50' : 'text-gray-500 group-hover:text-white transition-colors'}`}>
                    {String(team.teamNumber).padStart(2, '0')}
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`font-display font-bold text-lg tracking-wider truncate ${team.isDisqualified ? 'text-gdg-red line-through' : 'text-white'}`}>
                        {team.teamName}
                      </div>
                      {team.isDisqualified && (
                        <span className="text-[8px] font-mono font-bold text-gdg-red border border-gdg-red/50 px-2 py-1 rounded bg-gdg-red/10 animate-pulse tracking-widest uppercase whitespace-nowrap">BANNED</span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-gray-500 truncate tracking-wider uppercase">
                      {team.players?.map(p => p.name).join(' • ')}
                    </div>
                    {team.isDisqualified && team.disqualifiedReason && (
                      <div className="mt-2 font-mono text-[9px] text-gdg-red/70 bg-gdg-red/5 border border-gdg-red/20 rounded-lg px-3 py-1.5 truncate">
                        ⚠ {team.disqualifiedReason}
                      </div>
                    )}
                    {team.isDisqualified && team.disqualifiedAt && (
                      <div className="mt-1 font-mono text-[9px] text-gray-600 tracking-wider">
                        Banned at: {new Date(team.disqualifiedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right flex-shrink-0 bg-dark-900/50 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                    <div className={`font-display font-black text-2xl ${team.isDisqualified ? 'text-gray-600' : 'text-gdg-green'}`}>
                      {team.scores?.total || 0}
                    </div>
                    <div className="font-mono text-[8px] text-gray-500 tracking-[0.3em] uppercase mt-1">CYCLES</div>
                  </div>
                  
                  <div className="flex flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-white/5 sm:border-none">
                    <a href={`/quiz/${quizCode}/team/${team.teamId}`} target="_blank" className="btn-premium bg-white/5 border-white/10 px-4 py-3 text-[10px] flex-1 sm:flex-none text-center">
                      VIEW
                    </a>
                    <button onClick={() => { setEditingScore(team); setScoreForm(team.scores); }} className="btn-premium bg-white/5 border-white/10 hover:border-gdg-blue/50 hover:bg-gdg-blue/10 hover:text-gdg-blue text-gray-400 px-4 py-3 text-[10px] flex-1 sm:flex-none">
                      EDIT_SCORE
                    </button>
                    {team.isDisqualified ? (
                      <button onClick={() => setDisqualification(team.teamId, false)} className="btn-premium btn-gdg-green px-4 py-3 text-[10px] flex-1 sm:flex-none">
                        REINSTATE
                      </button>
                    ) : (
                      <button onClick={() => setDisqualification(team.teamId, true)} className="btn-premium bg-white/5 border-white/10 hover:border-gdg-yellow/50 hover:bg-gdg-yellow/10 hover:text-gdg-yellow text-gray-400 px-4 py-3 text-[10px] flex-1 sm:flex-none">
                        BAN
                      </button>
                    )}
                    <button onClick={() => deleteTeam(team.teamId, team.teamName)} className="btn-premium bg-white/5 border-white/10 hover:border-gdg-red/50 hover:bg-gdg-red/10 hover:text-gdg-red text-gray-400 px-4 py-3 text-[10px] flex-1 sm:flex-none">
                      DEL
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Score Update Modal */}
        <AnimatePresence>
          {editingScore && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-950/80 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-xl glass-panel p-8 rounded-[2.5rem] border border-gdg-blue/30 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gdg-blue/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="font-display font-bold text-white text-xl mb-6 tracking-widest flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gdg-blue/10 flex items-center justify-center text-gdg-blue border border-gdg-blue/20">⚖️</div>
                    ADJUST SCORES
                  </div>
                  <button onClick={() => setEditingScore(null)} className="text-gray-500 hover:text-white transition-colors">✕</button>
                </div>
                
                <div className="mb-8">
                  <div className="font-display font-black text-white text-2xl tracking-widest mb-1">{editingScore.teamName}</div>
                  <div className="font-mono text-[10px] text-gray-500 tracking-[0.3em] uppercase">NODE_ID: {editingScore.teamId}</div>
                </div>

                <form onSubmit={updateScore} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'PHASE 01', key: 'round1', color: 'text-gdg-blue' },
                      { label: 'PHASE 02', key: 'round2', color: 'text-gdg-yellow' },
                      { label: 'PHASE 03', key: 'round3', color: 'text-gdg-red' },
                      { label: 'BONUS_CYC', key: 'bonusPoints', color: 'text-gdg-green' },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className={`font-mono text-[10px] ${f.color} tracking-widest block mb-2 uppercase ml-2`}>{f.label}</label>
                        <input type="number" value={scoreForm[f.key]} onChange={e => setScoreForm({...scoreForm, [f.key]: parseInt(e.target.value) || 0})}
                          className="w-full bg-dark-950/80 border border-white/10 rounded-2xl text-white font-mono text-lg px-5 py-4 focus:outline-none focus:border-gdg-blue transition-all text-center" />
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-white/5 mt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center bg-dark-950/50 p-4 rounded-2xl border border-white/5 mb-2">
                       <span className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">PROTOTYPE TOTAL</span>
                       <span className="font-display font-black text-3xl text-white">
                         {(scoreForm.round1 || 0) + (scoreForm.round2 || 0) + (scoreForm.round3 || 0) + (scoreForm.bonusPoints || 0)}
                       </span>
                    </div>
                    <button type="submit" disabled={adding} className="btn-premium btn-gdg-blue w-full py-5 text-sm disabled:opacity-50 shadow-[0_10px_30px_rgba(66,133,244,0.3)]">
                      {adding ? 'UPLOADING...' : 'COMMIT CHANGES'}
                    </button>
                    <button type="button" onClick={() => setEditingScore(null)} className="w-full py-4 text-gray-500 font-mono text-[10px] tracking-widest hover:text-white transition-colors uppercase">
                      CANCEL_X
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
