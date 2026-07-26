'use client';

import { useState, useEffect, useCallback, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Star, Activity, Lock, Cloud, Cpu, Shield, Zap, Sparkles, Database, BrainCircuit, Terminal } from 'lucide-react';
import dynamic from 'next/dynamic';
import TourTooltip from '@/components/TourTooltip';
import { Inter, Playfair_Display } from 'next/font/google';

const Joyride = dynamic(() => import('react-joyride').then(mod => mod.default || mod.Joyride), { ssr: false });

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-playfair' });

const LandingTourTooltip = forwardRef((props, ref) => {
  if (props.step.target === '.tour-landing-cards') {
    return (
      <div 
        ref={ref}
        {...props.tooltipProps} 
        className="pointer-events-none z-[100000]"
        style={{
           ...props.tooltipProps.style,
           backgroundColor: 'transparent',
           boxShadow: 'none',
           border: 'none',
           padding: 0,
           width: '100%',
           maxWidth: '1024px',
           height: '0px',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
        }}
      >
        <div className="relative w-full flex items-center justify-between">
          
          {/* Left Tooltip */}
          <div className="absolute right-[100%] mr-6 lg:mr-12 w-[280px] sm:w-[320px] bg-[#202124] text-white rounded-xl shadow-2xl font-sans border border-white/10 pointer-events-auto transform translate-y-[200px] sm:translate-y-[250px]" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(66, 133, 244, 0.1)' }}>
            
            {/* Arrow pointing right */}
            <div className="absolute top-1/2 -right-[7px] w-[14px] h-[14px] bg-[#202124] border-t border-r border-white/10 transform rotate-45 -translate-y-1/2"></div>
            
            <div className="p-5 sm:p-6 relative z-10 bg-[#202124] rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base sm:text-lg font-medium text-gray-100">Join an Active Session</h4>
              </div>
              <div className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Enter the 6-character access code provided by your event coordinator to authenticate and join as a player.
              </div>
            </div>
          </div>

          {/* Right Tooltip */}
          <div className="absolute left-[100%] ml-6 lg:ml-12 w-[280px] sm:w-[320px] bg-[#202124] text-white rounded-xl shadow-2xl font-sans border border-white/10 pointer-events-auto transform translate-y-[200px] sm:translate-y-[250px] flex flex-col justify-between" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(66, 133, 244, 0.1)' }}>
            
            {/* Arrow pointing left */}
            <div className="absolute top-1/2 -left-[7px] w-[14px] h-[14px] bg-[#202124] border-b border-l border-white/10 transform rotate-45 -translate-y-1/2"></div>

            <div className="p-5 sm:p-6 relative z-10 bg-[#202124] rounded-t-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base sm:text-lg font-medium text-gray-100">Host a Tournament</h4>
              </div>
              <div className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Initialize a new server, configure rounds, and deploy a full competition cluster as a host.
              </div>
            </div>
            <div className="px-5 sm:px-6 py-4 bg-[#28292c] flex items-center justify-between border-t border-white/5 rounded-b-xl relative z-10">
              <button {...props.closeProps} className="text-xs sm:text-sm font-medium text-gray-400 hover:text-white transition-colors">Skip</button>
              <div className="flex items-center gap-3">
                <button {...props.backProps} className="text-xs sm:text-sm font-medium text-[#8ab4f8] hover:text-[#aecbfa] transition-colors">Back</button>
                <button {...props.primaryProps} className="px-4 py-1.5 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] text-xs sm:text-sm font-bold transition-all shadow-[0_0_10px_rgba(138,180,248,0.2)]">Got it</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return <TourTooltip ref={ref} {...props} />;
});

export default function Page() {
  const router = useRouter();

  // State
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [sysTime, setSysTime]   = useState('');
  const [scrolled, setScrolled] = useState(0);
  const [runTour, setRunTour] = useState(false);

  const landingTourSteps = [
    { target: '.tour-landing-join', content: 'Ready to host your own arena? Click here to create a new tournament session.', title: 'Host a Game', skipBeacon: true },
    { target: '.tour-landing-enter', content: 'Already have an access code? Enter it here to join an active tournament.', title: 'Join a Game', skipBeacon: true },
    { target: '.tour-landing-mission', content: 'Our platform is built on zero latency and absolute precision to ensure fair competition.', title: 'Our Mission', skipBeacon: true },
    { target: '.tour-landing-tech', content: 'Powered by real-time WebSockets, AI question parsing, and enterprise-grade anti-cheat.', title: 'Core Technology', skipBeacon: true },
    { target: '.tour-landing-cards', content: 'Choose your path. Join an active session as a player, or initialize a new server as a host.', title: 'Start your journey', skipBeacon: true, placement: 'top', hideArrow: true }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!localStorage.getItem('tour_landing')) {
      localStorage.setItem('tour_landing', 'true');
      setRunTour(true);
    }
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status, type, step } = data;
    // Manually scroll to the target element before each step
    if (type === 'step:before' && step?.target) {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    }
    if (['finished', 'skipped'].includes(status)) {
      localStorage.setItem('tour_landing', 'true');
      setRunTour(false);
    }
  };

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
    <>
      <Joyride 
        steps={landingTourSteps}
        run={runTour}
        callback={handleJoyrideCallback}
        continuous={true}
        showSkipButton={true}
        tooltipComponent={LandingTourTooltip}
        disableScrolling={true}
        styles={{ options: { zIndex: 100000, primaryColor: '#8ab4f8' } }}
      />
      <div className={`min-h-screen bg-[#050505] text-white selection:bg-[#4285F4] selection:text-white ${inter.variable} ${playfair.variable} font-sans relative`}>
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
        @keyframes float-complex {
            0%, 100% { transform: translateY(0) rotate(0) scale(1); }
            33% { transform: translateY(-20px) rotate(5deg) scale(1.05); }
            66% { transform: translateY(15px) rotate(-3deg) scale(0.95); }
        }
        @keyframes breathe {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.1); }
        }
        @keyframes pan-bg {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-float-left { animation: float-hand-left 12s ease-in-out infinite; }
        .animate-float-right { animation: float-hand-right 14s ease-in-out infinite; }
        .animate-float-tech { animation: float-tech 8s ease-in-out infinite; }
        .animate-float-complex { animation: float-complex 15s ease-in-out infinite; }
        .animate-breathe { animation: breathe 10s ease-in-out infinite; }
        .animate-pan-bg { animation: pan-bg 8s linear infinite; }
        
        @keyframes popup-btn {
            0% { transform: scale(0.8) translateY(20px); opacity: 0; filter: blur(10px); }
            100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
        }
        .animate-popup-btn {
            animation: popup-btn 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            animation-delay: 3.8s;
            opacity: 0;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }
        
        .noise-overlay {
            position: fixed;
            inset: 0;
            z-index: 50;
            pointer-events: none;
            opacity: 0.03;
            mix-blend-mode: overlay;
            background-image: url("https://grainy-gradients.vercel.app/noise.svg");
        }
      `}} />

      {/* Global Noise Overlay */}
      <div className="noise-overlay"></div>

      {/* Embedded CSS moved out of the way */}
      {runTour && (
        <style dangerouslySetInnerHTML={{__html: `
          .reveal {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        `}} />
      )}

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
          
          <div className="flex-1"></div>

          <a href="#works" className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-medium bg-[#4285F4] text-white hover:scale-105 hover:bg-[#3b78e7] shadow-[0_0_15px_rgba(66,133,244,0.4)] transition-all duration-300 tour-landing-join">
              Join Event
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 bg-[#020202]">
        
        {/* Holographic Grid Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30"
             style={{ 
                 backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                 backgroundSize: '60px 60px',
                 transform: 'perspective(1000px) rotateX(60deg) scale(2.5) translateY(-20%)',
                 transformOrigin: 'top center',
             }}>
        </div>
        
        {/* Ambient Breathing Glows (Google Colors) */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#4285F4] mix-blend-screen filter blur-[150px] animate-breathe" style={{ animationDelay: '0s' }}></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#EA4335] mix-blend-screen filter blur-[150px] animate-breathe" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-[#FBBC05] mix-blend-screen filter blur-[120px] animate-breathe" style={{ animationDelay: '4s' }}></div>
            <div className="absolute bottom-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-[#34A853] mix-blend-screen filter blur-[150px] animate-breathe" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Data Constellation - Left */}
        <div className="absolute left-[5%] md:left-[10%] top-[20%] md:top-[25%] z-10 pointer-events-none animate-float-complex">
             <div className="glass-card rounded-2xl p-5 md:p-6 flex items-center justify-center relative group">
                 <div className="absolute inset-0 bg-[#4285F4]/20 blur-xl rounded-full"></div>
                 <BrainCircuit className="w-10 h-10 md:w-14 md:h-14 text-[#4285F4] relative z-10" strokeWidth={1} />
             </div>
             {/* Connecting Lines */}
             <div className="absolute top-[50%] left-[100%] w-[100px] md:w-[150px] h-[1px] bg-gradient-to-r from-[#4285F4]/50 to-transparent"></div>
        </div>
        <div className="absolute left-[15%] md:left-[20%] bottom-[20%] md:bottom-[25%] z-10 pointer-events-none animate-float-complex" style={{ animationDelay: '2s' }}>
             <div className="glass-card rounded-xl p-3 md:p-4 flex items-center justify-center relative">
                 <Database className="w-6 h-6 md:w-8 md:h-8 text-[#FBBC05]" strokeWidth={1} />
             </div>
        </div>

        {/* Data Constellation - Right */}
        <div className="absolute right-[5%] md:right-[10%] top-[25%] md:top-[30%] z-10 pointer-events-none animate-float-complex" style={{ animationDelay: '1.5s' }}>
             <div className="glass-card rounded-2xl p-5 md:p-6 flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-[#34A853]/20 blur-xl rounded-full"></div>
                 <Terminal className="w-10 h-10 md:w-14 md:h-14 text-[#34A853] relative z-10" strokeWidth={1} />
             </div>
             <div className="absolute bottom-[50%] right-[100%] w-[80px] md:w-[100px] h-[1px] bg-gradient-to-l from-[#34A853]/50 to-transparent"></div>
        </div>
        <div className="absolute right-[15%] md:right-[20%] bottom-[15%] md:bottom-[20%] z-10 pointer-events-none animate-float-complex" style={{ animationDelay: '3.5s' }}>
             <div className="glass-card rounded-xl p-3 md:p-4 flex items-center justify-center relative">
                 <Cpu className="w-6 h-6 md:w-8 md:h-8 text-[#EA4335]" strokeWidth={1} />
             </div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-6 relative z-20 text-center flex flex-col items-center justify-center h-full pt-10">
            <div className="max-w-4xl mx-auto" style={{ 
                transform: runTour ? 'none' : `translateY(${Math.min(scrolled * 0.4, 400)}px)`, 
                opacity: runTour ? 1 : Math.max(0, 1 - scrolled / 600) 
            }}>
                
                <div className="reveal inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <Sparkles className="w-4 h-4 text-[#FBBC05]" />
                    <span className="text-xs tracking-widest font-mono text-white/80 uppercase">Next-Gen Assessment Engine</span>
                </div>

                <div className="reveal" style={{ transitionDelay: '100ms' }}>
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold leading-[1.05] tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 font-sans drop-shadow-2xl">
                        Intelligent Arena. <br />
                        <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] animate-pan-bg" style={{ backgroundSize: '200% auto' }}>The ultimate quiz platform.</span>
                    </h1>
                </div>
                
                <div className="reveal" style={{ transitionDelay: '200ms' }}>
                    <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto mb-16 font-light tracking-wide leading-relaxed">
                        Built for global scale — sub-millisecond WebSocket synchronization, AI-powered question generation, and enterprise-grade anti-cheat enforcement.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-6 animate-popup-btn">
                    <Link href="/join" className="relative group cursor-pointer inline-block tour-landing-enter">
                       <div className="absolute -inset-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853] rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-300 animate-pan-bg" style={{ backgroundSize: '200% auto' }}></div>
                       <div className="relative glass-card px-10 py-4 rounded-full flex items-center gap-3 text-sm md:text-base text-white uppercase tracking-[0.2em] font-bold group-hover:bg-white/10 transition-all duration-300 border border-white/10">
                         <span>Enter Access Code</span>
                         <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </Link>
                    
                    <div className="flex items-center gap-4 text-[10px] md:text-xs text-white/40 uppercase tracking-widest mt-8 font-mono bg-black/40 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                       <span>{sysTime || '--:--'}</span>
                       <span className="w-px h-3 bg-white/20"></span>
                       <span className="flex items-center gap-2"><Activity size={12} className="text-[#34A853] animate-pulse" /> CLUSTER ONLINE</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="expertise" className="py-32 relative">
        <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center reveal tour-landing-mission">
                <h2 className="text-3xl md:text-5xl lg:text-6xl leading-tight text-white mb-12 font-serif font-medium drop-shadow-xl">
                    We enforce integrity where it matters most.
                </h2>
                <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-light">
                    Zero latency. Absolute precision. We remove the noise so your competition resonates with absolute clarity.
                </p>
            </div>

            {/* Core Tech Grid */}
            <div className="mt-20 md:mt-32 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center transition-all duration-500 tour-landing-tech">
                <div className="reveal flex flex-col items-center gap-6 group w-full">
                  <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center group-hover:bg-[#4285F4]/10 group-hover:border-[#4285F4]/30 transition-all duration-300 relative">
                    <div className="absolute inset-0 bg-[#4285F4]/0 group-hover:bg-[#4285F4]/20 blur-xl rounded-full transition-colors duration-500"></div>
                    <Zap className="text-[#4285F4]/70 group-hover:text-[#4285F4] relative z-10 transition-colors" size={32} />
                  </div>
                  <div className="font-bold text-sm tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">LOW LATENCY</div>
                </div>
                <div className="reveal flex flex-col items-center gap-6 group w-full" style={{ transitionDelay: '100ms' }}>
                  <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center group-hover:bg-[#EA4335]/10 group-hover:border-[#EA4335]/30 transition-all duration-300 relative">
                    <div className="absolute inset-0 bg-[#EA4335]/0 group-hover:bg-[#EA4335]/20 blur-xl rounded-full transition-colors duration-500"></div>
                    <Shield className="text-[#EA4335]/70 group-hover:text-[#EA4335] relative z-10 transition-colors" size={32} />
                  </div>
                  <div className="font-bold text-sm tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">ANTI-CHEAT</div>
                </div>
                <div className="reveal flex flex-col items-center gap-6 group w-full" style={{ transitionDelay: '200ms' }}>
                  <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center group-hover:bg-[#FBBC05]/10 group-hover:border-[#FBBC05]/30 transition-all duration-300 relative">
                    <div className="absolute inset-0 bg-[#FBBC05]/0 group-hover:bg-[#FBBC05]/20 blur-xl rounded-full transition-colors duration-500"></div>
                    <Database className="text-[#FBBC05]/70 group-hover:text-[#FBBC05] relative z-10 transition-colors" size={32} />
                  </div>
                  <div className="font-bold text-sm tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">REAL-TIME</div>
                </div>
                <div className="reveal flex flex-col items-center gap-6 group w-full" style={{ transitionDelay: '300ms' }}>
                  <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center group-hover:bg-[#34A853]/10 group-hover:border-[#34A853]/30 transition-all duration-300 relative">
                    <div className="absolute inset-0 bg-[#34A853]/0 group-hover:bg-[#34A853]/20 blur-xl rounded-full transition-colors duration-500"></div>
                    <Cloud className="text-[#34A853]/70 group-hover:text-[#34A853] relative z-10 transition-colors" size={32} />
                  </div>
                  <div className="font-bold text-sm tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">AI PARSING</div>
                </div>
            </div>
        </div>
      </section>

      {/* Cards Section */}
      <section id="works" className="py-40 relative overflow-hidden">
        
        {/* Holographic Grid Background Continuation */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
             style={{ 
                 backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                 backgroundSize: '60px 60px',
                 transform: 'perspective(1000px) rotateX(-60deg) scale(2.5) translateY(20%)',
                 transformOrigin: 'bottom center',
             }}>
        </div>

        {/* Ambient Breathing Glows */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#4285F4] mix-blend-screen filter blur-[150px] animate-breathe opacity-20" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-[0%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#EA4335] mix-blend-screen filter blur-[150px] animate-breathe opacity-10" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
            <div className="reveal mb-20 md:mb-32">
                <h2 className="text-4xl sm:text-5xl md:text-7xl text-center font-serif text-white">
                    Define your <br />
                    <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-white/50 to-white/90">tournament</span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto tour-landing-cards">
                {/* Card 1 - Dark Glass (Join) */}
                <div style={{ transform: runTour ? 'none' : `translateY(${scrolled * 0.05}px)` }}>
                    <div className="reveal glass-card rounded-[2rem] p-8 md:p-12 aspect-[4/5] flex flex-col justify-between group relative overflow-hidden transition-all duration-500 hover:border-[#4285F4]/30 hover:shadow-[0_0_40px_rgba(66,133,244,0.1)]">
                        
                        {/* Inner ambient glow */}
                        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[#4285F4]/10 blur-[80px] pointer-events-none group-hover:bg-[#4285F4]/20 transition-colors duration-700"></div>

                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#4285F4]/10 group-hover:border-[#4285F4]/30 transition-all duration-500 shadow-lg">
                                <Star className="text-[#4285F4] text-2xl group-hover:rotate-45 transition-transform duration-700" />
                            </div>
                            <span className="text-white/40 font-mono text-sm border border-white/10 px-4 py-1.5 rounded-full bg-black/40">01</span>
                        </div>
                        
                        <div className="relative z-10 mt-auto">
                            <h3 className="text-4xl md:text-5xl text-white mb-6 leading-none tracking-tight font-serif drop-shadow-lg">
                                Join <br />Session
                            </h3>
                            
                            <form onSubmit={handleJoin} className="flex flex-col gap-5">
                              <p className="text-gray-400 text-sm md:text-base leading-snug mb-2 font-light">
                                  Your event coordinator will provide a 6-character access code to authenticate your node.
                              </p>
                              <div className="relative group/input">
                                <input 
                                  type="text" 
                                  placeholder="ENTER CODE" 
                                  maxLength={6} 
                                  value={code}
                                  disabled={loading}
                                  onChange={e => changeCode(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-5 text-white placeholder:text-white/20 font-mono text-xl tracking-[0.2em] uppercase focus:outline-none focus:border-[#4285F4]/50 focus:bg-[#4285F4]/5 focus:shadow-[0_0_20px_rgba(66,133,244,0.15)] transition-all shadow-inner"
                                />
                                {error && (
                                  <div className="absolute -bottom-8 left-0 flex items-center gap-1.5 text-[#EA4335] text-xs font-medium bg-[#EA4335]/10 px-3 py-1.5 rounded-md border border-[#EA4335]/20">
                                    <Lock size={12} /> {error}
                                  </div>
                                )}
                              </div>
                              <button 
                                type="submit" 
                                disabled={loading || code.length !== 6}
                                className="w-full mt-2 relative group/btn disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4285F4] to-[#34A853] rounded-xl blur opacity-30 group-hover/btn:opacity-60 transition duration-500 animate-pan-bg"></div>
                                <div className="relative bg-[#0a0a0a] border border-white/10 text-white font-bold tracking-[0.1em] uppercase text-sm py-4 rounded-xl flex items-center justify-center gap-3 transition-all">
                                  {loading ? <><Activity className="animate-spin text-[#4285F4]" size={18} /> CONNECTING...</> : <>ENTER ARENA <ArrowRight size={18} className="text-[#4285F4] group-hover/btn:translate-x-1 transition-transform" /></>}
                                </div>
                              </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Card 2 - Dark Glass (Host) */}
                <div className="md:mt-24" style={{ transform: runTour ? 'none' : `translateY(${scrolled * -0.05}px)` }}>
                    <div className="reveal glass-card rounded-[2rem] p-8 md:p-12 aspect-[4/5] flex flex-col justify-between group relative overflow-hidden transition-all duration-500 hover:border-[#EA4335]/30 hover:shadow-[0_0_40px_rgba(234,67,53,0.1)]" style={{ transitionDelay: '150ms' }}>
                        
                        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-[#EA4335]/10 blur-[80px] pointer-events-none group-hover:bg-[#EA4335]/20 transition-colors duration-700"></div>

                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#EA4335]/10 group-hover:border-[#EA4335]/30 transition-all duration-500 shadow-lg">
                               <Sparkles className="text-[#EA4335] text-2xl group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <span className="text-white/40 font-mono text-sm border border-white/10 px-4 py-1.5 rounded-full bg-black/40">02</span>
                        </div>
                        
                        <div className="relative z-10 mt-auto">
                            <h3 className="text-4xl md:text-5xl text-white mb-6 leading-none tracking-tight font-serif drop-shadow-lg">
                                Host <br />Tournament
                            </h3>
                            <p className="text-gray-400 text-sm md:text-base leading-snug mb-10 font-light">
                                AI-powered setup in four guided steps. Deploy a full competition cluster with zero technical expertise needed. 
                            </p>
                            
                            <ul className="flex flex-col gap-4 mb-10 text-[13px] text-gray-400 font-medium">
                              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#4285F4] shadow-[0_0_8px_rgba(66,133,244,0.6)]" /> Real-time WebSocket Cluster</li>
                              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#EA4335] shadow-[0_0_8px_rgba(234,67,53,0.6)]" /> Fullscreen Anti-Cheat Enforcement</li>
                              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#FBBC05] shadow-[0_0_8px_rgba(251,188,5,0.6)]" /> DOCX Question AI Parser</li>
                              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#34A853] shadow-[0_0_8px_rgba(52,168,83,0.6)]" /> 5 Interactive Game Modes</li>
                            </ul>

                            <Link href="/host" className="inline-flex w-full relative group/btn">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#EA4335] to-[#FBBC05] rounded-xl blur opacity-30 group-hover/btn:opacity-60 transition duration-500 animate-pan-bg"></div>
                              <button className="w-full relative bg-[#0a0a0a] border border-white/10 text-white font-bold tracking-[0.1em] uppercase text-sm py-4 rounded-xl flex items-center justify-center gap-3 transition-all group-hover/btn:border-white/20">
                                INITIALIZE SERVER <ArrowRight size={18} className="text-[#EA4335] group-hover/btn:translate-x-1 transition-transform -rotate-45" />
                              </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
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
                    {/* Links removed as per user request */}
                    <p className="text-xs text-gray-700 font-mono uppercase tracking-widest">© 2026 Intelligent Arena. Powered by Google Cloud.</p>
                </div>
            </div>
        </div>
      </footer>
    </div>
    </>
  );
}
