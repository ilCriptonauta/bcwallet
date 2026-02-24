
'use client';

import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="text-center pt-10 pb-6 space-y-6">
      <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 mb-4 animate-bounce">
        <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">Powered by MultiversX</span>
      </div>
      <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-none">
        <span className="bg-clip-text text-transparent bg-gradient-to-br from-brand-orange to-brand-yellow">
          Bacon Wallet
        </span>
      </h1>
      <p className="max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 font-medium">
        The ultimate hub to manage and create your digital <span className="text-brand-orange font-bold">Collectibles</span>.
      </p>
    </section>
  );
};

export default Hero;
