
'use client';

import React from 'react';
import { LogIn } from 'lucide-react';

interface SplashProps {
  onLogin: () => void;
}

const Splash: React.FC<SplashProps> = ({ onLogin }) => {
  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-between py-12 overflow-hidden bg-[#0c0c0e] text-white">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[120vw] h-[120vw] sm:w-[600px] sm:h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-orange/5 via-brand-orange/0 to-transparent" />
      </div>

      <div className="z-10 flex flex-col items-center justify-between md:justify-center md:gap-16 lg:gap-20 w-full h-full animate-in fade-in zoom-in-95 duration-1000 ease-out">

        {/* Top: Powered By Badge */}
        <div className="pt-8 sm:pt-4 md:pt-0">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">Powered by MultiversX</span>
          </div>
        </div>

        {/* Center: Logo and Name */}
        <div className="flex flex-col items-center justify-center -mt-8 sm:-mt-12 md:mt-0">
          {/* Large Logo */}
          <div className="relative mb-8 sm:mb-12 md:mb-10 group flex items-center justify-center">
            <div className="absolute -inset-20 sm:-inset-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-orange/30 via-brand-orange/0 to-transparent opacity-100 transition-opacity duration-700" />
            <img
              src="/bacon-icon.png"
              alt="Bacon Logo"
              className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-[2.25rem] sm:rounded-[2.5rem] object-cover shadow-2xl shadow-brand-orange/40 group-hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Name */}
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Bacon Wallet
            </h1>
            <p className="text-brand-orange font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-xs mt-3 opacity-80 max-w-sm mx-auto leading-relaxed">
              manage and create <span className="text-white">NFTs</span>
            </p>
          </div>
        </div>

        {/* Bottom: Login Button */}
        <div className="pb-8 sm:pb-4 md:pb-0 w-full px-6 flex justify-center">
          <button
            onClick={onLogin}
            className="group relative flex w-full max-w-[280px] sm:max-w-[240px] items-center justify-center space-x-3 bg-white text-black px-6 py-4 sm:py-3 rounded-2xl sm:rounded-xl font-black sm:font-bold text-base sm:text-sm hover:bg-brand-orange hover:text-black transition-all active:scale-95 shadow-xl shadow-brand-orange/10"
          >
            <LogIn className="w-5 h-5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            <span>Login with Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Splash;
