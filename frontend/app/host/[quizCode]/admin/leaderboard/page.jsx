'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadData();
    const i = setInterval(loadData, 30000);
    return () => clearInterval(i);
  }, []);

  async function loadData() {
    try {
      const res = await fetch(`/api/leaderboard?quizCode=${quizCode}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch { setLoading(false); }
  }

  function exportCSV() {
    const rows = [
      ['Rank','Team ID','Team Name','Player 1','Player 2','Player 3','Round 1','Round 2','Round 3','Bonus','Total','Qs R1','Qs R2','Qs R3'],
      ...leaderboard.map((t, i) => [
        i+1, t.teamId, t.teamName,
        t.players[0]||'', t.players[1]||'', t.players[2]||'',
        t.scores.round1, t.scores.round2, t.scores.round3,
        t.scores.bonusPoints||0, t.scores.total,
        t.answeredCount?.round1||0, t.answeredCount?.round2||0, t.answeredCount?.round3||0,
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `decode-the-tech-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const maxScore = leaderboard[0]?.scores.total || 1;

  return (
    <div className="min-h-screen cyber-grid bg-dark-900 text-gray-200">
      <div className="border-b border-gdg-yellow/30 bg-dark-900/90 backdrop-blur-md sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href={`/host/${quizCode}/admin`} className="font-mono text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <span className="text-gdg-yellow">←</span> ROOT_CENTER
          </Link>
          <div className="font-display font-black text-xl text-white tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 bg-gdg-yellow animate-pulse"></span>
            MASTER_LEADERBOARD
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-gray-500 bg-dark-800 px-3 py-1 border border-white/5">{lastUpdate?.toLocaleTimeString()}</span>
            <button onClick={exportCSV} className="btn-neon btn-neon-blue text-xs px-4 py-2 flex items-center gap-2"><span>⬇</span> EXPORT_CSV</button>
            <Link href="/leaderboard" target="_blank" className="btn-neon btn-neon-green text-xs px-4 py-2 flex items-center gap-2"><span>📺</span> PUBLIC_VIEW</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            ['ACTIVE_NODES', leaderboard.length, 'gdg-blue'],
            ['PHASE_01_AVG', leaderboard.length ? Math.round(leaderboard.reduce((s,t)=>s+t.scores.round1,0)/leaderboard.length) : 0, 'gdg-blue'],
            ['PHASE_02_AVG', leaderboard.length ? Math.round(leaderboard.reduce((s,t)=>s+t.scores.round2,0)/leaderboard.length) : 0, 'gdg-yellow'],
            ['PHASE_03_AVG', leaderboard.length ? Math.round(leaderboard.reduce((s,t)=>s+t.scores.round3,0)/leaderboard.length) : 0, 'gdg-red'],
          ].map(([label, value, color]) => (
            <div key={label} className={`glass-panel border-b-4 border-${color} p-6 text-center shadow-lg relative overflow-hidden group`}>
              <div className={`absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-${color}/10 to-transparent`} />
              <div className={`font-display font-black text-4xl mb-2 text-${color} group-hover:scale-110 transition-transform`}>{value}</div>
              <div className="font-mono text-[10px] text-gray-400 tracking-widest uppercase">{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 border border-white/5 bg-dark-900/50">
             <span className="w-8 h-8 border-2 border-gdg-yellow border-t-transparent rounded-full animate-spin inline-block mb-4"></span>
             <div className="font-mono text-[10px] text-gdg-yellow tracking-[0.2em] uppercase">Compiling telemetry...</div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 border border-white/5 border-dashed bg-dark-900/50">
             <div className="font-mono text-gray-500 text-[10px] tracking-[0.2em] uppercase">No telemetry records found</div>
          </div>
        ) : (
          <div className="glass-panel p-2 md:p-6 border-white/5">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 font-mono text-[10px] text-gray-500 tracking-[0.2em] border-b border-white/10 mb-2">
              <div className="col-span-1 hidden sm:block">RANK</div>
              <div className="col-span-8 sm:col-span-4">NODE_IDENTIFIER</div>
              <div className="col-span-3 hidden md:block">OPERATORS</div>
              <div className="col-span-1 hidden lg:block text-right">P1</div>
              <div className="col-span-1 hidden lg:block text-right">P2</div>
              <div className="col-span-1 hidden lg:block text-right">P3</div>
              <div className="col-span-4 sm:col-span-3 lg:col-span-2 text-right">TOTAL_CYCLES</div>
            </div>
            
            <div className="space-y-3">
              {leaderboard.map((team, i) => (
                <div key={team.teamId} className={`relative overflow-hidden grid grid-cols-12 gap-2 px-4 py-4 items-center transition-all bg-dark-800 border ${
                  i===0?'border-gdg-yellow shadow-[0_0_15px_rgba(251,188,5,0.15)]':i===1?'border-gray-400/50':i===2?'border-orange-700/50':'border-white/5 hover:border-white/20 hover:bg-dark-900'
                }`}>
                  <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ width:`${(team.scores.total/maxScore)*100}%`, background: i===0?'linear-gradient(90deg,#FBBC05,transparent)':i===1?'linear-gradient(90deg,#9ca3af,transparent)':i===2?'linear-gradient(90deg,#c2410c,transparent)':'linear-gradient(90deg,#4285F4,transparent)' }} />
                  
                  <div className={`col-span-1 hidden sm:block font-display font-black text-xl ${i===0?'text-gdg-yellow':i===1?'text-gray-400':i===2?'text-orange-500':'text-gray-600'}`}>
                    {i<3?['01','02','03'][i]:String(i+1).padStart(2,'0')}
                  </div>
                  
                  <div className="col-span-8 sm:col-span-4 z-10">
                    <div className="flex items-center gap-2">
                      <div className={`font-display font-bold text-base truncate tracking-wider ${team.isDisqualified ? 'text-gdg-red line-through' : 'text-white'}`}>{team.teamName}</div>
                      {team.isDisqualified && <span className="font-mono text-[8px] bg-gdg-red/20 text-gdg-red px-1 border border-gdg-red/50">BANNED</span>}
                    </div>
                    <div className="font-mono text-[9px] text-gray-500 tracking-widest">{team.teamId}</div>
                  </div>
                  
                  <div className="col-span-3 hidden md:block font-mono text-[10px] text-gray-400 truncate z-10">
                    <div className="bg-dark-900 inline-block px-2 py-1 border border-white/5">{team.players.join(' // ')}</div>
                  </div>
                  
                  <div className="col-span-1 hidden lg:block text-right font-mono text-sm text-gdg-blue z-10">{team.scores.round1}</div>
                  <div className="col-span-1 hidden lg:block text-right font-mono text-sm text-gdg-yellow z-10">{team.scores.round2}</div>
                  <div className="col-span-1 hidden lg:block text-right font-mono text-sm text-gdg-red z-10">{team.scores.round3}</div>
                  
                  <div className={`col-span-4 sm:col-span-3 lg:col-span-2 text-right font-mono font-black text-2xl z-10 ${i===0?'text-gdg-yellow drop-shadow-[0_0_10px_rgba(251,188,5,0.5)]':i===1?'text-gray-300':i===2?'text-orange-500':'text-gdg-green'}`}>
                    {team.scores.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
