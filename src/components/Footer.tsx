'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full py-8 md:py-16 border-t border-gray-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-6">
        <button
          onClick={scrollToTop}
          className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-orange-500 hover:text-white text-gray-400 dark:text-gray-500 transition-all border border-transparent dark:border-white/5 group shadow-sm hover:shadow-orange-500/20"
          title="Back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </button>

        <p className="text-gray-500 dark:text-gray-400 font-semibold tracking-wide flex items-center justify-center gap-1.5 text-sm">
          Build with <span className="animate-pulse">❤️</span> by <a href="https://x.com/onionxlabs" target="_blank" rel="noopener noreferrer" className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-500 font-black hover:opacity-80 transition-opacity">OnionXLabs</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;