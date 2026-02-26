
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
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[120vw] h-[120vw] sm:w-[600px] sm:h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-orange/5 via-brand-orange/0 to-transparent" />
      </div>

      <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000 ease-out">
        {/* Powered By Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 mb-16 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">Powered by MultiversX</span>
        </div>

        {/* Large Logo */}
        <div className="relative mb-16 group flex items-center justify-center">
          <div className="absolute -inset-20 sm:-inset-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-orange/30 via-brand-orange/0 to-transparent opacity-100 transition-opacity duration-700" />
          <img
            src="/bacon-icon.png"
            alt="Bacon Logo"
            className="relative w-48 h-48 rounded-[2.5rem] object-cover shadow-2xl shadow-brand-orange/40 group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        {/* Name */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Bacon Wallet
          </h1>
          <p className="text-brand-orange font-bold uppercase tracking-[0.4em] text-xs mt-2 opacity-80 max-w-sm mx-auto leading-relaxed">
            manage and create <span className="text-white">NFTs</span>
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
