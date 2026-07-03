'use client';
import { motion } from 'framer-motion';

export default function TerminalButton({ 
  children, 
  onClick, 
  variant = 'green', 
  className = '',
  type = 'button' 
}) {
  const baseClasses = "relative px-6 py-3 font-mono font-bold tracking-widest text-sm uppercase transition-all duration-300 border focus:outline-none flex items-center justify-center gap-2";
  
  const variants = {
    green: "text-neon-green border-neon-green/50 bg-neon-green/5 hover:bg-neon-green hover:text-black hover:shadow-[0_0_20px_rgba(0,255,65,0.4)]",
    red: "text-neon-red border-neon-red/50 bg-neon-red/5 hover:bg-neon-red hover:text-black hover:shadow-[0_0_20px_rgba(255,68,68,0.4)]",
    blue: "text-neon-blue border-neon-blue/50 bg-neon-blue/5 hover:bg-neon-blue hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="w-full h-[2px] bg-white/20 absolute top-0 -translate-y-full opacity-0 hover:opacity-100 hover:translate-y-0 hover:animate-[scanline_1s_ease-in-out_infinite]" />
      </div>
      {children}
    </motion.button>
  );
}
