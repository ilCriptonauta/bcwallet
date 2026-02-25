
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, LogIn, LogOut, User, ChevronDown, Wrench, Wallet2, Coins, Crown, TrendingUp, X } from 'lucide-react';
import { useGetAccountInfo } from '@/lib';
import { useOnxBalance, useAccountNfts, useNftsValue } from '@/helpers';
import BigNumber from 'bignumber.js';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onNavigate: (page: 'home' | 'tools') => void;
  currentPage: 'home' | 'tools';
  isFullVersion?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleTheme,
  isLoggedIn,
  onLogin,
  onLogout,
  onNavigate,
  currentPage,
  isFullVersion
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { balance: onxBalance } = useOnxBalance();
  const account = useGetAccountInfo()?.account;
  const address = account?.address;
  const balances = account?.balance
    ? BigNumber(account.balance).dividedBy(1e18).toFixed(3)
    : '0.000';
  const username = account?.username || 'User';

  // NFT portfolio value
  const { items: nfts } = useAccountNfts({ address, enabled: isLoggedIn });
  const { totalEgld: nftsValue, isLoading: nftsValueLoading } = useNftsValue(nfts);

  // Close dropdown on outside click (desktop only)
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Shared menu content rendered in both drawer and dropdown
  const MenuContent = () => (
    <>
      {/* Profile header */}
      <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-yellow flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-orange/20">
            <User className="w-5 h-5 text-black" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white truncate">{username}</div>
            {isFullVersion && (
              <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-brand-orange to-brand-yellow shadow-sm">
                <Crown className="w-3 h-3 text-black fill-black" />
                <span className="text-[9px] font-black uppercase text-black tracking-widest leading-none mt-px">Premium User</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assets */}
      <div className="px-4 py-1 text-[10px] font-black uppercase text-slate-400 tracking-widest">Assets</div>
      <div className="space-y-1 mb-2 px-2">
        <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5">
          <div className="flex items-center space-x-2">
            <Wallet2 className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-bold">EGLD</span>
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white">{balances}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-brand-yellow" />
            <span className="text-xs font-bold">ONX</span>
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white">
            {BigNumber(onxBalance).toFormat(0)}
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-bold">NFTs Value</span>
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white">
            {nftsValueLoading
              ? <span className="inline-block w-16 h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
              : <>{nftsValue.toFixed(3)} <span className="text-[10px] text-slate-400 font-bold">EGLD</span></>}
          </span>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center space-x-3">
          {isDarkMode ? <Sun className="w-4 h-4 text-brand-yellow" /> : <Moon className="w-4 h-4 text-slate-500" />}
          <span>Theme</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
          {isDarkMode ? 'Dark' : 'Light'}
        </span>
      </button>

      <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />

      {/* Logout */}
      <button
        onClick={() => { onLogout(); setIsMenuOpen(false); }}
        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-[0.98] transition-all"
      >
        <LogOut className="w-4 h-4" /> <span>Logout</span>
      </button>
    </>
  );

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-[100] h-20 border-b border-slate-200 dark:border-white/5 bg-white/70 dark:bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

          <div
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative w-10 h-10 group-hover:scale-110 transition-transform shadow-lg shadow-brand-orange/20 rounded-xl">
              <div className="absolute -inset-1 bg-gradient-to-tr from-brand-orange to-brand-yellow rounded-[0.85rem] opacity-30 blur-md group-hover:opacity-50 transition-opacity" />
              <img
                src="/bacon-icon.png"
                alt="Bacon Logo"
                className="relative w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Bacon
            </span>
          </div>

          <div className="flex items-center space-x-3 md:space-x-4">
            {isLoggedIn && (
              <button
                onClick={() => onNavigate(currentPage === 'home' ? 'tools' : 'home')}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 ${currentPage === 'tools'
                  ? 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange'
                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                title="Let's Cook"
              >
                <Wrench className="w-5 h-5" />
              </button>
            )}

            {!isLoggedIn && (
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95"
                aria-label="Toggle Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-brand-yellow" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
            )}

            {!isLoggedIn ? (
              <button
                onClick={onLogin}
                className="flex items-center space-x-2 bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-black/10 dark:shadow-white/5"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            ) : (
              /* ── Trigger button (same on mobile & desktop) ── */
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brand-orange/50 transition-all active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-brand-yellow flex items-center justify-center">
                    <User className="w-4 h-4 text-black" />
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* ── DESKTOP DROPDOWN (md+) ── */}
                {isMenuOpen && (
                  <div className="hidden md:block absolute right-0 mt-3 w-72 bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 p-2 overflow-hidden animate-in zoom-in-95 duration-200 z-[110]">
                    <MenuContent />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MOBILE RIGHT DRAWER (< md) ── */}
      {isLoggedIn && (
        <>
          {/* Backdrop */}
          <div
            className={`md:hidden fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className={`md:hidden fixed top-0 right-0 z-[160] h-full w-[85vw] max-w-sm bg-white dark:bg-[#111] border-l border-slate-100 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* Drawer header bar */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-slate-100 dark:border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-orange to-brand-yellow flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">My Account</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto py-2">
              <MenuContent />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
