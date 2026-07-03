import { Orbitron, Rajdhani, Share_Tech_Mono } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
});

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400'],
});

export const metadata = {
  title: 'Quiz Platform — Global Tech Quiz',
  description: 'Crack the code behind everyday technology. The ultimate high-stakes tech quiz experience by Google Developer Groups.',
  keywords: ['GDG', 'Tech Quiz', 'Quiz Platform', 'Hackathon', 'Coding'],
  authors: [{ name: 'GDG' }],
  openGraph: {
    title: 'Quiz Platform',
    description: 'The ultimate high-stakes tech quiz experience.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quiz Platform',
    description: 'The ultimate high-stakes tech quiz experience.',
  }
};

import { SpeedInsights } from "@vercel/speed-insights/next"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${rajdhani.variable} ${shareTechMono.variable} font-body bg-dark-900 text-white antialiased`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
