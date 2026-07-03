import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen cyber-grid flex flex-col items-center justify-center text-center p-8">
      <div className="font-display font-black text-8xl neon-text-cyan mb-4 glitch" data-text="404">404</div>
      <div className="font-display font-bold text-2xl text-white mb-4 tracking-wider">PAGE NOT FOUND</div>
      <div className="font-mono text-sm text-white/30 mb-8">The page you're looking for doesn't exist in this dimension.</div>
      <Link href="/" className="btn-neon px-8 py-3 font-display font-bold tracking-widest">← RETURN HOME</Link>
    </div>
  );
}
