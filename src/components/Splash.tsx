
'use client';

import React from 'react';
import { LogIn } from 'lucide-react';

interface SplashProps {
  onLogin: () => void;
}

const Splash: React.FC<SplashProps> = ({ onLogin }) => {
  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0c0c0e] text-white">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000 ease-out">
        {/* Large Logo */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-10 bg-gradient-to-tr from-brand-orange to-brand-yellow rounded-[3rem] opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-700" />
          <img
            src="/bacon-icon.png"
            alt="Bacon Logo"
            className="relative w-48 h-48 rounded-[2.5rem] object-cover shadow-2xl shadow-brand-orange/40 group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        {/* Name */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Bacon
          </h1>
          <p className="text-brand-orange font-bold uppercase tracking-[0.4em] text-xs mt-2 opacity-80">
            Let&apos;s Cook NFTs
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={onLogin}
          className="group relative flex items-center space-x-3 bg-white text-black px-12 py-5 rounded-2xl font-black text-lg hover:bg-brand-orange hover:text-black transition-all active:scale-95 shadow-xl shadow-brand-orange/10"
        >
          <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span>Login with Wallet</span>
        </button>
      </div>
    </div>
  );
};

export default Splash;
