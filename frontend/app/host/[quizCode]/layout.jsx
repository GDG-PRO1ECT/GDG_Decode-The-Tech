'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import TourTooltip from '@/components/TourTooltip';

const Joyride = dynamic(() => import('react-joyride').then(mod => mod.default || mod.Joyride), { ssr: false });

export default function HostQuizLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const params = useParams();
  const quizCode = params?.quizCode;

  useEffect(() => {
    setMounted(true);
    if (!quizCode) return;
    
    // Check if tour needs to run
    if (!localStorage.getItem('tour_sudo_login')) {
      localStorage.setItem('tour_sudo_login', 'true');
      setRunTour(true);
    }

    // Simply trust cached password — individual actions verify on their own
    const cached = sessionStorage.getItem(`admin_pass_${quizCode}`);
    if (cached) setIsAuthenticated(true);
  }, [quizCode]);

  const handleTourCallback = (data) => {
    const { status, action, type, step } = data;
    if (type === 'step:before' && step?.target) {
      const el = document.querySelector(step.target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (['finished', 'skipped'].includes(status) || ['skip', 'close'].includes(action)) {
      localStorage.setItem('tour_sudo_login', 'true');
      setRunTour(false);
    }
  };

  const sudoTourSteps = [
    { target: '.tour-sudo-auth', content: 'This is the secure access portal for the SUDO_CORE. Enter your admin password to establish an uplink.', title: 'Admin Authentication', skipBeacon: true }
  ];

  if (!mounted) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Verify against the protected endpoint — uses bcrypt comparison server-side
    fetch('/api/admin/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password
      },
      body: JSON.stringify({ quizCode })
    })
      .then(async res => {
        if (res.ok) {
          sessionStorage.setItem(`admin_pass_${quizCode}`, password);
          setIsAuthenticated(true);
        } else if (res.status === 401) {
          setError('ERR: INVALID MASTER KEY. Password does not match.');
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.error || 'ERR: ACCESS DENIED.');
        }
      })
      .catch(() => {
        setError('ERR: CONNECTION FAILED. Is the backend running?');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center relative overflow-hidden font-body text-gray-200">
      <Joyride
        steps={sudoTourSteps}
        run={runTour}
        callback={handleTourCallback}
        continuous={true}
        showSkipButton={true}
        tooltipComponent={TourTooltip}
        disableScrolling={true}
        styles={{ options: { zIndex: 100000, primaryColor: '#8ab4f8' } }}
      />
      <div className="absolute inset-0 bg-[url('/images/stardust.png')] opacity-[0.03] mix-blend-screen z-0"></div>
      <div className="cyber-grid absolute inset-0 z-0"></div>
      
      <div className="z-10 w-full max-w-md clip-angled bg-dark-900/80 backdrop-blur-md p-10 tech-border shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative border border-gdg-red/20 tour-sudo-auth">
        <div className="absolute top-0 right-10 w-24 h-[2px] bg-gdg-red shadow-[0_0_15px_#EA4335]"></div>
        
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/gdg-logo.png" alt="GDG Logo" className="w-12 h-12 mb-4 animate-holo-flicker brightness-200 grayscale" />
          <h1 className="font-display font-black text-3xl tracking-[0.3em] text-white">SUDO_LOGIN</h1>
          <p className="font-mono text-[10px] text-gray-500 tracking-[0.4em] uppercase mt-2">RESTRICTED TERMINAL ACCESS</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          {error && (
            <div className="bg-gdg-red/10 border-l-2 border-gdg-red p-3 font-mono text-[10px] text-gdg-red uppercase tracking-widest text-center animate-pulse">
              {error}
            </div>
          )}
          
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 bg-gdg-red"></div>
            <input 
              type="password" 
              placeholder="ENTER MASTER KEY" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-dark-950/50 border-b border-white/20 px-6 py-4 text-white font-mono text-center tracking-[0.4em] focus:border-gdg-red focus:outline-none transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !password}
            className="clip-angled-br mt-4 bg-gdg-red/10 hover:bg-gdg-red border border-gdg-red/50 text-gdg-red hover:text-white py-4 font-display font-black tracking-[0.4em] uppercase transition-all hover:shadow-[0_0_30px_rgba(234,67,53,0.4)] disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'ESTABLISH UPLINK'}
          </button>
        </form>
      </div>
    </div>
  );
}
