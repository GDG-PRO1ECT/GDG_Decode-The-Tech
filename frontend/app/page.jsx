'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Star, Activity, Lock, Cloud, Cpu, Shield, Zap, Sparkles, Database } from 'lucide-react';
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-playfair' });

export default function Page() {
  const router = useRouter();

  // State
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [sysTime, setSysTime]   = useState('');
  const [scrolled, setScrolled] = useState(0);

  useEffect(() => {
    // 1. Reveal Elements on Scroll
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 2. Scroll Parallax & Navbar
    const handleScroll = () => setScrolled(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Time Clock
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setSysTime(`${hours}:${minutes} ${ampm}`);
    };
    const t1 = setInterval(updateTime, 60000);
    updateTime();

    return () => {
      revealObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      clearInterval(t1);
    };
  }, []);

  const changeCode = useCallback((val) => {
    const v = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(v);
    setError('');
  }, []);

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (code.length !== 6) { setError('Please enter your 6-character access code.'); return; }
    setLoading(true); setError('');
    try {
      const upper = code.toUpperCase();
      const res   = await fetch(`/api/game/status?quizCode=${upper}`);
      const data  = await res.json();
      if (!res.ok || !data.session) {
        setError('Access code not found.');
        setLoading(false); return;
      }
      if (data.session.status === 'draft') {
        setError('Session is still being prepared.');
        setLoading(false); return;
      }
      router.push(`/quiz/${upper}`);
    } catch {
      setError('Connection failed. Check network.');
      setLoading(false);
    }
  };

  const navScrolled = scrolled > 50;

  return (
    <div className={`min-h-screen bg-[#050505] text-white selection:bg-[#4285F4] selection:text-white ${inter.variable} ${playfair.variable} font-sans overflow-x-hidden relative`}>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
            --bg: #050505;
        }
        .font-serif { font-family: var(--font-playfair), serif; }
        
        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.active {
            opacity: 1;
            transform: translateY(0);
        }
        
        @keyframes float-hand-left {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes float-hand-right {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(20px) rotate(-2deg); }
        }
        @keyframes float-tech {
            0%, 100% { transform: translateY(0) rotate(0) scale(1); }
            50% { transform: translateY(-15px) rotate(10deg) scale(1.05); }
        }
        .animate-float-left { animation: float-hand-left 12s ease-in-out infinite; }
        .animate-float-right { animation: float-hand-right 14s ease-in-out infinite; }
        .animate-float-tech { animation: float-tech 8s ease-in-out infinite; }
        
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

      {/* Global Noise Overlay */}
      <div className="noise-overlay"></div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'py-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/5' : 'py-8 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* GDG Logo */}
            <div className="flex gap-0.5 items-center mix-blend-screen">
              <img src="/gdg-logo.png" alt="GDG Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
            </div>
            <a href="#" className="text-xl md:text-2xl font-bold tracking-tighter font-serif">
                Intelligent Arena.
            </a>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
              <a href="#expertise" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">Capabilities</a>
              <a href="#works" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">Tournaments</a>
          </div>

          <a href="#works" className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-medium bg-[#4285F4] text-white hover:scale-105 hover:bg-[#3b78e7] shadow-[0_0_15px_rgba(66,133,244,0.4)] transition-all duration-300">
              Join Event
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 bg-[#050505]">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
            <div className="absolute top-0 left-0 w-full h-full opacity-60 mix-blend-screen">
                <img src="https://framerusercontent.com/images/9zvwRJAavKKacVyhFCwHyXW1U.png?width=1536&height=1024" alt="Atmosphere" className="w-full h-full object-cover object-center opacity-80" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] z-10"></div>
            
            {/* Google Colored Ambient Lights */}
            <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-[#4285F4] mix-blend-screen filter blur-[150px] opacity-20"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[#EA4335] mix-blend-screen filter blur-[150px] opacity-10"></div>
        </div>

        {/* Floating Surrealist Elements & Tech Details */}
        <div className="absolute -left-[10%] top-[-10%] md:left-[-5%] md:top-[-15%] w-[50vw] md:w-[40vw] max-w-[800px] z-10 pointer-events-none mix-blend-hard-light opacity-80 animate-float-left">
             <img src="https://framerusercontent.com/images/KNhiA5A2ykNYqNkj04Hk6BVg5A.png?width=1540&height=1320" alt="Hand Reaching" className="w-full h-auto object-contain" />
        </div>
        
        {/* Added Tech Element */}
        <div className="absolute left-[15%] top-[25%] md:top-[30%] z-20 pointer-events-none animate-float-tech opacity-60" style={{ animationDelay: '1s' }}>
             <Cloud className="text-[#FBBC05] w-12 h-12 md:w-16 md:h-16" />
        </div>

        <div className="absolute -right-[10%] bottom-[-10%] md:right-[-5%] md:bottom-[-5%] w-[45vw] md:w-[35vw] max-w-[700px] z-10 pointer-events-none mix-blend-hard-light opacity-80 animate-float-right">
             <img src="https://framerusercontent.com/images/X89VFCABCEjjZ4oLGa3PjbOmsA.png?width=1542&height=1002" alt="Hand Receiving" className="w-full h-auto object-contain" />
        </div>
        
        {/* Added Tech Element */}
        <div className="absolute right-[15%] bottom-[25%] md:bottom-[30%] z-20 pointer-events-none animate-float-tech opacity-60" style={{ animationDelay: '2s' }}>
             <Cpu className="text-[#34A853] w-12 h-12 md:w-16 md:h-16" />
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-6 relative z-20 text-center flex flex-col items-center justify-center h-full">
            <div className="max-w-4xl mx-auto" style={{ transform: `translateY(${Math.min(scrolled * 0.4, 400)}px)`, opacity: Math.max(0, 1 - scrolled / 600) }}>
                <div className="reveal">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-medium leading-[1.1] tracking-tight mb-6 text-[#f8f9fa] mix-blend-overlay font-serif" 
                        style={{ textShadow: '0 0 15px rgba(255,255,255,0.5)' }}>
                        Intelligent Arena. <br />
                        <span className="italic font-light text-[#e8eaed]">The ultimate quiz platform.</span>
                    </h1>
                </div>
                
                <div className="reveal" style={{ transitionDelay: '200ms' }}>
                    <p className="text-base md:text-lg text-[#dadce0] max-w-lg mx-auto mb-16 font-light tracking-wide leading-relaxed mix-blend-overlay"
                       style={{ textShadow: '0 0 12px rgba(255,255,255,0.4)' }}>
                        Built for global scale — sub-millisecond WebSocket synchronization, AI-powered question generation, and enterprise-grade anti-cheat enforcement.
                    </p>
                </div>

                <div className="reveal flex flex-col items-center gap-6" style={{ transitionDelay: '400ms' }}>
                    <a href="#works" className="relative group cursor-pointer">
                       <div className="absolute inset-0 bg-[#4285F4]/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                       <div className="relative border border-[#4285F4]/30 bg-white/5 backdrop-blur-sm px-8 py-3 rounded-full flex items-center gap-3 text-xs md:text-sm text-white/90 uppercase tracking-widest hover:bg-[#4285F4]/10 hover:border-[#4285F4]/50 transition-all duration-300">
                         <span>Enter Access Code</span>
                       </div>
                    </a>
                    
                    <div className="flex items-center gap-4 text-[10px] md:text-xs text-white/40 uppercase tracking-widest mt-8 font-mono">
                       <span>{sysTime || '--:--'}</span>
                       <span className="w-px h-3 bg-white/20"></span>
                       <span className="flex items-center gap-1.5"><Activity size={12} className="text-[#34A853]" /> ONLINE</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="expertise" className="py-32 relative">
        <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center reveal">
                <h2 className="text-3xl md:text-5xl lg:text-6xl leading-tight text-white/90 mb-12 font-serif">
                    We enforce integrity where it matters most.
                </h2>
                <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-light">
                    Zero latency. Absolute precision. We remove the noise so your competition resonates with absolute clarity.
                </p>
            </div>

            {/* Core Tech Grid */}
            <div className="mt-20 md:mt-32 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center transition-all duration-500">
                <div className="reveal flex flex-col items-center gap-4 group">
                  <div className="w-16 h-16 rounded-full bg-[#4285F4]/10 border border-[#4285F4]/30 flex items-center justify-center group-hover:bg-[#4285F4]/20 transition-colors">
                    <Zap className="text-[#4285F4]" size={28} />
                  </div>
                  <div className="font-bold text-sm tracking-widest text-white/70 group-hover:text-white transition-colors">LOW LATENCY</div>
                </div>
                <div className="reveal flex flex-col items-center gap-4 group" style={{ transitionDelay: '100ms' }}>
                  <div className="w-16 h-16 rounded-full bg-[#EA4335]/10 border border-[#EA4335]/30 flex items-center justify-center group-hover:bg-[#EA4335]/20 transition-colors">
                    <Shield className="text-[#EA4335]" size={28} />
                  </div>
                  <div className="font-bold text-sm tracking-widest text-white/70 group-hover:text-white transition-colors">ANTI-CHEAT</div>
                </div>
                <div className="reveal flex flex-col items-center gap-4 group" style={{ transitionDelay: '200ms' }}>
                  <div className="w-16 h-16 rounded-full bg-[#FBBC05]/10 border border-[#FBBC05]/30 flex items-center justify-center group-hover:bg-[#FBBC05]/20 transition-colors">
                    <Database className="text-[#FBBC05]" size={28} />
                  </div>
                  <div className="font-bold text-sm tracking-widest text-white/70 group-hover:text-white transition-colors">REAL-TIME</div>
                </div>
                <div className="reveal flex flex-col items-center gap-4 group" style={{ transitionDelay: '300ms' }}>
                  <div className="w-16 h-16 rounded-full bg-[#34A853]/10 border border-[#34A853]/30 flex items-center justify-center group-hover:bg-[#34A853]/20 transition-colors">
                    <Cloud className="text-[#34A853]" size={28} />
                  </div>
                  <div className="font-bold text-sm tracking-widest text-white/70 group-hover:text-white transition-colors">AI PARSING</div>
                </div>
            </div>
        </div>
      </section>

      {/* Cards Section */}
      <section id="works" className="py-40 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
            <div className="reveal mb-20 md:mb-32">
                <h2 className="text-4xl sm:text-5xl md:text-7xl text-center font-serif">
                    Define your <br />
                    <span className="italic">tournament</span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Card 1 - GDG Blue (Join) */}
                <div style={{ transform: `translateY(${scrolled * 0.05}px)` }}>
                    <div className="reveal bg-[#4285F4] rounded-3xl p-8 md:p-12 aspect-[4/5] flex flex-col justify-between shadow-[0_20px_50px_rgba(66,133,244,0.15)] hover:shadow-[0_20px_50px_rgba(66,133,244,0.3)] transition-all duration-500 group relative overflow-hidden">
                        
                        {/* Glow effect */}
                        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-white/20 blur-[60px] pointer-events-none group-hover:bg-white/30 transition-colors"></div>

                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                                <Star className="text-white text-2xl" />
                            </div>
                            <span className="text-white font-medium text-sm border border-white/20 px-3 py-1 rounded-full bg-white/10">01</span>
                        </div>
                        
                        <div className="relative z-10 mt-auto">
                            <h3 className="text-4xl md:text-5xl text-white mb-6 leading-none tracking-tight font-serif">
                                Join <br />Session
                            </h3>
                            
                            <form onSubmit={handleJoin} className="flex flex-col gap-4">
                              <p className="text-white/80 text-sm md:text-base leading-snug mb-2">
                                  Your event coordinator will provide a 6-character code.
                              </p>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="ENTER CODE" 
                                  maxLength={6} 
                                  value={code}
                                  disabled={loading}
                                  onChange={e => changeCode(e.target.value)}
                                  className="w-full bg-black/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder:text-white/40 font-mono text-xl tracking-[0.2em] uppercase focus:outline-none focus:border-white/50 focus:bg-black/20 transition-all"
                                />
                                {error && (
                                  <div className="absolute -bottom-8 left-0 flex items-center gap-1.5 text-[#FFC107] text-xs font-medium bg-black/40 px-2 py-1 rounded-md">
                                    <Lock size={12} /> {error}
                                  </div>
                                )}
                              </div>
                              <button 
                                type="submit" 
                                disabled={loading || code.length !== 6}
                                className="w-full mt-4 bg-white text-[#4285F4] font-bold tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 transition-all cursor-pointer disabled:cursor-not-allowed"
                              >
                                {loading ? <><Activity className="animate-spin" size={18} /> Connecting...</> : <>Enter Arena <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                              </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Card 2 - Black with GDG borders (Host) */}
                <div className="md:mt-24" style={{ transform: `translateY(${scrolled * -0.05}px)` }}>
                    <div className="reveal bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 aspect-[4/5] flex flex-col justify-between shadow-2xl group hover:border-[#EA4335]/50 transition-all duration-500 relative overflow-hidden" style={{ transitionDelay: '150ms' }}>
                        
                        <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#EA4335]/10 blur-[80px] pointer-events-none group-hover:bg-[#EA4335]/20 transition-colors"></div>

                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-white/5">
                               <ArrowRight className="text-white text-2xl -rotate-45" />
                            </div>
                            <span className="text-white/50 font-medium text-sm border border-white/10 px-3 py-1 rounded-full">02</span>
                        </div>
                        
                        <div className="relative z-10 mt-auto">
                            <h3 className="text-4xl md:text-5xl text-white mb-6 leading-none tracking-tight font-serif">
                                Host <br />Tournament
                            </h3>
                            <p className="text-gray-400 text-sm md:text-base leading-snug mb-8">
                                AI-powered setup in four guided steps. No technical expertise needed. 
                            </p>
                            
                            <ul className="flex flex-col gap-3 mb-10 text-[13px] text-gray-500">
                              <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" /> Real-time WebSocket Cluster</li>
                              <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" /> Fullscreen Anti-Cheat Enforcement</li>
                              <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" /> DOCX Question AI Parser</li>
                              <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-[#34A853]" /> 5 Interactive Game Modes</li>
                            </ul>

                            <Link href="/host" className="inline-flex w-full">
                              <button className="w-full bg-[#1A1A1A] border border-white/10 text-white font-bold tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#252525] hover:border-[#EA4335]/50 hover:text-[#EA4335] transition-all">
                                Initialize Server <Sparkles size={16} />
                              </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-10 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#050505] relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                <div className="w-full md:w-auto">
                    <h2 className="text-[10vw] md:text-[8vw] leading-[0.8] tracking-tighter text-white/5 font-bold select-none pointer-events-none font-sans">
                        ARENA.
                    </h2>
                </div>
                
                <div className="flex flex-col gap-8 text-right">
                    <div className="flex flex-col gap-4 text-gray-500 text-sm">
                        <Link href="/host" className="hover:text-white transition-colors">Admin Dashboard</Link>
                        <Link href="/display" className="hover:text-white transition-colors">Projector Display</Link>
                        <Link href="/leaderboard" className="hover:text-white transition-colors">Global Leaderboard</Link>
                    </div>
                    <p className="text-xs text-gray-700 font-mono uppercase tracking-widest">© 2026 Intelligent Arena. Powered by Google Cloud.</p>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
