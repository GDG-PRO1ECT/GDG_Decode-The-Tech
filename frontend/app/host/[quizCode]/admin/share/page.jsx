'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminSharePage() {
  const params = useParams();
  const quizCode = params?.quizCode;
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!quizCode) return;
    setBaseUrl(window.location.origin);
    fetch(`/api/teams?quizCode=${quizCode}`).then(r => r.json()).then(d => { setTeams(d.teams || []); setLoading(false); });
  }, [quizCode]);

  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  function copyAll() {
    const text = teams.map(t => `${t.teamName}: ${baseUrl}/quiz/${quizCode}/team/${t.teamId}`).join('\n');
    copy(text, 'all');
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
    a.download = 'team-links.csv';
    a.click();
  }

  return (
    <div className="min-h-screen cyber-grid">
      <div className="border-b border-neon-cyan/20 bg-dark-900/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/host/${quizCode}/admin`} className="font-mono text-xs text-white/40 hover:text-neon-cyan">← ADMIN</Link>
          <div className="font-display font-bold text-neon-cyan tracking-widest">🔗 TEAM LINKS</div>
          <div className="flex gap-3">
            <button onClick={copyAll} className="btn-neon text-xs px-4 py-2">📋 COPY ALL</button>
            <button onClick={exportLinks} className="btn-neon text-xs px-4 py-2">⬇ EXPORT CSV</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="font-mono text-xs text-white/30 mb-6">
          Share these links with your teams. Each team gets a unique URL. The portal URL shows team info and waits for the game to start. The play URL goes directly to quiz.
        </div>

        {copied === 'all' && (
          <div className="mb-4 p-3 border border-neon-green/50 text-neon-green bg-neon-green/5 font-mono text-sm">
            ✓ All links copied to clipboard!
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 font-mono text-neon-cyan animate-pulse">LOADING...</div>
        ) : (
          <div className="space-y-2">
            {teams.map(team => (
              <div key={team.teamId} className="holo-card border border-white/5 p-4 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="font-mono text-xs text-white/20 w-8 flex-shrink-0">#{team.teamNumber}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm text-white mb-1">{team.teamName}</div>
                    <div className="font-mono text-xs text-white/30">{team.players.map(p => p.name).join(' · ')}</div>
                    <div className="font-mono text-xs text-neon-cyan/60 mt-1 truncate">
                      {baseUrl}/quiz/{quizCode}/team/{team.teamId}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => copy(`${baseUrl}/quiz/${quizCode}/team/${team.teamId}`, team.teamId)}
                      className={`font-mono text-xs px-3 py-1 border transition-colors ${copied === team.teamId ? 'border-neon-green text-neon-green' : 'border-neon-cyan/30 text-neon-cyan/60 hover:border-neon-cyan hover:text-neon-cyan'}`}
                    >
                      {copied === team.teamId ? '✓ COPIED' : 'COPY LINK'}
                    </button>
                    <a href={`/quiz/${quizCode}/team/${team.teamId}`} target="_blank"
                      className="font-mono text-xs px-3 py-1 border border-white/10 text-white/30 hover:text-white hover:border-white/30 text-center transition-colors">
                      OPEN →
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {teams.length === 0 && (
              <div className="text-center py-20">
                <div className="font-mono text-white/20">No teams registered yet.</div>
                <Link href={`/host/${quizCode}/admin/teams`} className="font-mono text-xs text-neon-cyan mt-4 block">→ Add teams first</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
