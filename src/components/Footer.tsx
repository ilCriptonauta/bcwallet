
'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 md:py-16 border-t border-gray-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-gray-500 dark:text-gray-400 font-semibold tracking-wide flex items-center justify-center gap-1.5">
          Build with <span className="animate-pulse">❤️</span> by <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-500 font-black">OnionXLabs</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;