'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    setFadeOut(false);

    // Trigger the spotlight expansion and fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);

    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 3800);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-[#000000] overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.7,0,0.3,1)] ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Cinematic Eclipse Core */}
      <div className="relative flex items-center justify-center z-10">
          
          {/* Spotlight Expansion Effect */}
          {/* This element remains small during loading, then explosively expands to fill the screen on finish */}
          <div className={`absolute rounded-full bg-white mix-blend-screen transition-all duration-[800ms] ease-[cubic-bezier(0.7,0,0.3,1)] ${fadeOut ? 'w-[200vw] h-[200vw] scale-100 opacity-100 filter blur-none' : 'w-[40vw] md:w-[25vw] h-[40vw] md:h-[25vw] scale-100 opacity-20 filter blur-[80px] animate-corona-breathe'}`}></div>
          
          {/* Subtle Google colored flares in the corona for depth */}
          <div className={`absolute w-[30vw] md:w-[20vw] aspect-square rounded-full bg-[#4285F4] opacity-30 filter blur-[100px] -translate-x-12 -translate-y-8 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'animate-flare-slow'}`}></div>
          <div className={`absolute w-[30vw] md:w-[20vw] aspect-square rounded-full bg-[#EA4335] opacity-20 filter blur-[100px] translate-x-12 translate-y-8 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'animate-flare-slow'}`} style={{ animationDelay: '2s' }}></div>

          {/* The Dark Body (The Eclipse itself) */}
          <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#000] shadow-[inset_0_0_50px_rgba(255,255,255,0.05)] border border-white/5 flex items-center justify-center overflow-hidden transition-all duration-700 z-10 animate-eclipse-reveal ${fadeOut ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
              
              {/* Elegant Light Sweep across the dark body */}
              <div className="absolute top-0 left-[-100%] w-full h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent -rotate-45 animate-premium-sweep"></div>
              
              {/* Vibrant Colored GDG Logo */}
              <img 
                  src="/gdg-logo.png" 
                  alt="GDG Logo" 
                  className="w-20 h-20 md:w-24 md:h-24 object-contain opacity-0 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-logo-fade-in" 
              />
          </div>
      </div>

      {/* Razor-Thin Precision Loading Line */}
      <div className={`absolute top-1/2 left-0 w-full h-[1px] bg-white/5 overflow-hidden transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-precision-line"></div>
      </div>

      {/* Expensive Typography */}
      <div className={`absolute bottom-16 md:bottom-24 flex flex-col items-center gap-6 animate-typography-reveal transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent"></div>
          <div className="text-white/60 font-serif text-[10px] md:text-[11px] tracking-[0.8em] uppercase font-light">
              Intelligent Arena
          </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes corona-breathe {
            0%, 100% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.15); opacity: 0.35; }
        }
        .animate-corona-breathe { 
            animation: corona-breathe 6s ease-in-out infinite; 
        }

        @keyframes flare-slow {
            0%, 100% { opacity: 0.2; transform: scale(1) translate(-20px, -20px); }
            50% { opacity: 0.4; transform: scale(1.1) translate(20px, 20px); }
        }

        @keyframes eclipse-reveal {
            0% { transform: scale(0.9); opacity: 0; box-shadow: inset 0 0 0 rgba(255,255,255,0); }
            100% { transform: scale(1); opacity: 1; box-shadow: inset 0 0 50px rgba(255,255,255,0.05); }
        }

        @keyframes premium-sweep {
            0% { left: -100%; }
            100% { left: 200%; }
        }
        .animate-premium-sweep {
            animation: premium-sweep 4s cubic-bezier(0.7, 0, 0.3, 1) infinite;
        }

        @keyframes logo-fade-in {
            0% { opacity: 0; filter: blur(10px); transform: scale(0.9); }
            100% { opacity: 1; filter: blur(0); transform: scale(1); }
        }
        .animate-logo-fade-in {
            animation: logo-fade-in 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s forwards;
        }

        @keyframes precision-line {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-precision-line {
            animation: precision-line 3.5s cubic-bezier(0.7, 0, 0.3, 1) forwards;
        }

        @keyframes typography-reveal {
            0% { opacity: 0; transform: translateY(20px); filter: blur(5px); }
            100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-typography-reveal {
            animation: typography-reveal 2s cubic-bezier(0.2, 0.8, 0.2, 1) 1s forwards;
        }
      `}} />
    </div>
  );
}
