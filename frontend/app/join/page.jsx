'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MatrixRain from '@/components/animations/MatrixRain';
import Link from 'next/link';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Quiz code must be exactly 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const upperCode = code.toUpperCase();
      const res = await fetch(`/api/game/status?quizCode=${upperCode}`);
      const data = await res.json();

      if (!res.ok || !data.session) {
        setError('Quiz code not found. Please verify with your organizer.');
        setLoading(false);
        return;
      }

      if (data.session.status === 'draft') {
        setError('This quiz is still being set up by the organizer.');
        setLoading(false);
        return;
      }

      // Redirect to play registration
      router.push(`/quiz/${upperCode}`);
    } catch (err) {
      console.error(err);
      setError('A connection error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030305] overflow-hidden flex flex-col items-center justify-center p-4">
      <MatrixRain />

      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gdg-blue/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-dark-800/60 backdrop-blur-md border border-gdg-blue/30 rounded-2xl p-8 shadow-glass z-10"
      >
        <Link href="/" className="font-mono text-xs text-white/50 hover:text-gdg-blue flex items-center gap-1 mb-6 transition-all">
          &larr; BACK TO PORTAL
        </Link>

        <h2 className="font-display font-black text-3xl text-white mb-2 uppercase tracking-wide">
          JOIN QUIZ ARENA
        </h2>
        <p className="font-body text-white/60 text-sm mb-8">
          Enter the 6-character access code provided by the organizer to begin registration.
        </p>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block font-mono text-[10px] tracking-widest text-gdg-blue uppercase mb-2">
              6-CHARACTER CODE
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setError('');
              }}
              placeholder="e.g. DTT7X2"
              className="w-full px-5 py-4 bg-dark-900 border border-gdg-blue/30 rounded-lg text-white font-mono text-center text-3xl tracking-[0.4em] uppercase focus:outline-none focus:border-gdg-blue focus:shadow-[0_0_15px_rgba(66,133,244,0.3)] transition-all"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-gdg-red/10 border border-gdg-red/30 rounded-lg text-neon-red text-center font-mono text-xs"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-4 bg-gdg-blue text-black font-mono font-bold tracking-widest text-xs uppercase hover:bg-neon-cyan hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none transition-all duration-300 rounded-lg"
          >
            {loading ? 'VALIDATING ARENA...' : 'ENTER ARENA &rarr;'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
