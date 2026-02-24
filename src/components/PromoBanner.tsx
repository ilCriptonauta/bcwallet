
'use client';

import React, { useState } from 'react';
import { Zap, Star, ArrowRight, X, Check, ShieldCheck, Wallet } from 'lucide-react';

interface PromoBannerProps {
  onUpgrade: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ onUpgrade }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsModalOpen(false);
      onUpgrade();
    }, 2000);
  };

  return (
    <div className="mt-24 px-4 sm:px-0">
      <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-orange-600 to-yellow-500 p-8 md:p-12 shadow-2xl shadow-orange-500/30 transition-transform duration-500 hover:scale-[1.01]">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {/* Logo Icon */}
            <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-500 overflow-hidden">
              <img
                src="/bacon-icon.png"
                alt="Bacon PASS"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter mb-2">
                Unlock Full Bacon Powers
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-900 font-black uppercase tracking-widest text-xs opacity-80 mt-2">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-white/30 rounded-full backdrop-blur-md shadow-sm border border-white/20">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span className="tracking-[0.1em]">Grab your unique license key</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-5 bg-gray-900 text-white rounded-2xl font-black text-sm hover:px-10 transition-all shadow-xl active:scale-95 group/btn"
          >
            <span>Upgrade Now</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => !isProcessing && setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 p-8 md:p-10 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isProcessing}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 mb-10">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black dark:text-white text-gray-900">Unlock Unlimited Power</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                To unlock unlimited folders and premium features, you need to purchase a <strong>Bacon PASS</strong> license directly on OOX.
              </p>
            </div>

            <div className="space-y-4">
              {/* Bacon PASS */}
              <div className="w-full flex items-center justify-between p-6 rounded-3xl border-2 border-orange-500 bg-orange-500/5 dark:bg-orange-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-8 bg-orange-500 text-gray-900 text-[9px] font-black px-3 py-1 rounded-b-xl uppercase tracking-widest">
                  Lifetime Value
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border-2 border-orange-500 flex items-center justify-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  </div>
                  <div className="text-left">
                    <p className="font-black dark:text-white text-gray-900">Bacon PASS</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Lifetime License Key</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-orange-500">OOX</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Marketplace</p>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <a
                href="https://oox.art/marketplace/collections/BCNPASS-40e72d"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-5 bg-gradient-to-r from-orange-500 to-yellow-500 text-gray-900 font-black rounded-[2rem] shadow-2xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3"
              >
                <Wallet className="w-5 h-5" />
                <span>Buy Bacon PASS on OOX</span>
              </a>
              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Check className="w-3 h-3 text-green-500" /> Official Secondary Marketplace
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoBanner;
