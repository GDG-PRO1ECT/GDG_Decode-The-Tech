/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        gdg: {
          blue: '#4285F4',
          red: '#EA4335',
          yellow: '#FBBC05',
          green: '#34A853',
        },
        neon: {
          cyan: '#00F0FF',
          red: '#FF5E52',
          green: '#00FF66',
          yellow: '#FFC933',
          magenta: '#FF007F',
        },
        dark: {
          950: '#030305',
          900: '#07070a', 
          800: '#0f1115',
          700: '#16181d',
          600: '#1d2027',
          500: '#252932',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-gdg': '0 8px 32px 0 rgba(66, 133, 244, 0.1)',
        'glow-blue': '0 0 20px rgba(66, 133, 244, 0.5)',
        'glow-red': '0 0 20px rgba(234, 67, 53, 0.5)',
        'glow-yellow': '0 0 20px rgba(251, 188, 5, 0.5)',
        'glow-green': '0 0 20px rgba(52, 168, 83, 0.5)',
        'inner-light': 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'reveal-up': 'revealUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'blob': 'blob 10s infinite',
        'data-stream': 'data-stream 2s linear infinite',
        'scan-line': 'scan-line 4s linear infinite',
        'holo-flicker': 'holo-flicker 5s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.8, filter: 'brightness(1)' },
          '50%': { opacity: 1, filter: 'brightness(1.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        revealUp: {
          '0%': { opacity: 0, transform: 'translateY(30px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'data-stream': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        'scan-line': {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' }
        },
        'holo-flicker': {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.8))' },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: 0.4, filter: 'none' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gdg-gradient': 'linear-gradient(135deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      }
    },
  },
  plugins: [],
};
