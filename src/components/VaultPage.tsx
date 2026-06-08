'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useGetAccountInfo, useGetNetworkConfig } from '@/lib';
import axios from 'axios';
import { 
  Vault, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Key, 
  Coins, 
  ArrowRight, 
  Gem, 
  Ticket, 
  CreditCard, 
  Trophy, 
  Sparkles, 
  PartyPopper,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Square,
  LayoutGrid
} from 'lucide-react';
import BigNumber from 'bignumber.js';

interface VaultPageProps {
  isFullVersion: boolean;
}

// Types for fetched asset data
interface TokenData {
  balance: string;
  decimals: number;
  name: string;
}

interface NftItem {
  identifier: string;
  name: string;
  imageUrl: string | null;
}

interface UserAssets {
  onx: number;
  chubbies: NftItem[];
  customChubbies: NftItem[];
  onionxCards: NftItem[];
  tickets: number; // Quantity of OOXTCK-08aa7c-02 SFT
  blackBoxes: number; // Quantity of BOOX-39e0c4-01 SFT
  goldBoxes: number;  // Quantity of BOOX-39e0c4-02 SFT
}

// Badge definition
interface Badge {
  id: string;
  title: string;
  description: string;
  requirement: string;
  icon: React.ReactNode;
  colorClass: string; // Gradient Tailwind classes
  check: (assets: UserAssets) => boolean;
}

const VaultPage: React.FC<VaultPageProps> = ({ isFullVersion }) => {
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();

  // Loading and Error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Asset balances/items
  const [assets, setAssets] = useState<UserAssets>({
    onx: 0,
    chubbies: [],
    customChubbies: [],
    onionxCards: [],
    tickets: 0,
    blackBoxes: 0,
    goldBoxes: 0,
  });

  // OnionxCards view mode and index state
  const [onionCardsIndex, setOnionCardsIndex] = useState(0);
  const [onionCardsViewMode, setOnionCardsViewMode] = useState<'single' | 'grid'>('single');

  // Badges view mode and index state
  const [badgesIndex, setBadgesIndex] = useState(0);
  const [badgesViewMode, setBadgesViewMode] = useState<'single' | 'grid'>('single');

  // Modal for new badges
  const [newBadgesModal, setNewBadgesModal] = useState<Badge[]>([]);

  // List of all badges in the ecosystem
  const badges: Badge[] = useMemo(() => [
    {
      id: 'onx_apprentice',
      title: 'ONX Apprentice',
      description: 'You have started accumulating ONX in your wallet.',
      requirement: 'Own more than 0 ONX',
      icon: <Coins className="w-6 h-6 text-yellow-400" />,
      colorClass: 'from-amber-500/20 to-yellow-500/10 border-yellow-500/30 text-yellow-400',
      check: (a) => a.onx > 0,
    },
    {
      id: 'onx_baron',
      title: 'ONX Baron',
      description: 'You have become a major supporter by holding a significant amount of ONX.',
      requirement: 'Own at least 10,000 ONX',
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
      colorClass: 'from-yellow-600/30 to-amber-600/10 border-yellow-600/40 text-yellow-500',
      check: (a) => a.onx >= 10000,
    },
    {
      id: 'millionx',
      title: 'MilliONX',
      description: 'You are an elite holder with a massive fortune of ONX.',
      requirement: 'Own at least 1,000,000 ONX',
      icon: <Trophy className="w-6 h-6 text-yellow-300 animate-pulse" />,
      colorClass: 'from-amber-600/40 via-yellow-600/20 to-yellow-500/10 border-yellow-500/40 text-yellow-300 shadow-xl shadow-yellow-500/10',
      check: (a) => a.onx >= 1000000,
    },
    {
      id: 'chubby_fan',
      title: 'CHUBBY Fan',
      description: 'Own at least one cute CHUBBY OnionX NFT.',
      requirement: 'Own 1+ CHUBBYs NFT',
      icon: <Sparkles className="w-6 h-6 text-pink-400" />,
      colorClass: 'from-pink-500/20 to-purple-500/10 border-pink-500/30 text-pink-400',
      check: (a) => a.chubbies.length >= 1,
    },
    {
      id: 'chubby_collector',
      title: 'CHUBBY Collector',
      description: 'You have gathered a splendid team of CHUBBY OnionX in your vault.',
      requirement: 'Own 5+ CHUBBYs NFTs',
      icon: <Gem className="w-6 h-6 text-fuchsia-400" />,
      colorClass: 'from-purple-600/30 to-pink-600/10 border-purple-500/30 text-purple-400',
      check: (a) => a.chubbies.length >= 5,
    },
    {
      id: 'custom_collector',
      title: 'Custom Collector',
      description: 'Own a custom-tailored CUSTOM CHUBBY NFT.',
      requirement: 'Own 1+ CUSTOM CHUBBY NFT',
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      colorClass: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
      check: (a) => a.customChubbies.length >= 1,
    },
    {
      id: 'card_holder',
      title: 'Card Holder',
      description: 'Jealously guard OnionxCards NFTs.',
      requirement: 'Own 1+ OnionxCards NFT',
      icon: <CreditCard className="w-6 h-6 text-indigo-400" />,
      colorClass: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-400',
      check: (a) => a.onionxCards.length >= 1,
    },
    {
      id: 'ticket_master',
      title: 'Ticket Master',
      description: 'Own special OOXTCK tickets to participate in exclusive events.',
      requirement: 'Own 1+ Tickets (OOXTCK-08aa7c-02)',
      icon: <Ticket className="w-6 h-6 text-emerald-400" />,
      colorClass: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      check: (a) => a.tickets >= 1,
    },
    {
      id: 'ecosystem_champion',
      title: 'Ecosystem Champion',
      description: 'You have unlocked almost all badges, proving to be a true champion of the BOOX ecosystem!',
      requirement: 'Unlock at least 4 different badges',
      icon: <PartyPopper className="w-6 h-6 text-orange-400 animate-bounce" />,
      colorClass: 'from-orange-500/30 via-yellow-500/10 to-red-500/10 border-orange-500/40 text-orange-400 shadow-lg shadow-orange-500/5',
      check: (a) => {
        // Count how many of the other badges are unlocked (excluding this one)
        const activeOtherBadgesCount = [
          a.onx > 0,
          a.onx >= 10000,
          a.onx >= 1000000,
          a.chubbies.length >= 1,
          a.chubbies.length >= 5,
          a.customChubbies.length >= 1,
          a.onionxCards.length >= 1,
          a.tickets >= 1,
        ].filter(Boolean).length;
        return activeOtherBadgesCount >= 4;
      },
    }
  ], []);

  // Fetch balances on mount or address change
  useEffect(() => {
    if (!address || !network?.apiAddress) return;

    const fetchVaultAssets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch ONX Balance
        let onxVal = 0;
        try {
          const onxRes = await axios.get(`${network.apiAddress}/accounts/${address}/tokens/ONX-3e51c8`);
          if (onxRes.data && onxRes.data.balance) {
            const dec = onxRes.data.decimals ?? 18;
            onxVal = new BigNumber(onxRes.data.balance)
              .dividedBy(new BigNumber(10).pow(dec))
              .toNumber();
          }
        } catch (e) {
          // Token might not be held, keep 0
        }

        // Helper to map API items to NftItem
        const mapNfts = (items: any[]): NftItem[] => {
          return (items || []).map((item: any) => ({
            identifier: item.identifier,
            name: item.name || item.identifier,
            imageUrl: item.media?.[0]?.thumbnailUrl || item.media?.[0]?.url || item.url || null
          }));
        };

        // 2. Fetch CHUBBY OnionX NFTs (CHBONX-3e0201)
        let chubbiesVal: NftItem[] = [];
        try {
          const chubbiesRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts?collection=CHBONX-3e0201&size=100`);
          chubbiesVal = mapNfts(chubbiesRes.data);
        } catch (e) {}

        // 3. Fetch CUSTOM CHUBBY NFTs (CTMCHUB-9298c1)
        let customChubbiesVal: NftItem[] = [];
        try {
          const customRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts?collection=CTMCHUB-9298c1&size=100`);
          customChubbiesVal = mapNfts(customRes.data);
        } catch (e) {}

        // 4. Fetch OnionxCards NFTs (ONXCRDS-ab712e)
        let cardsVal: NftItem[] = [];
        try {
          const cardsRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts?collection=ONXCRDS-ab712e&size=100`);
          cardsVal = mapNfts(cardsRes.data);
        } catch (e) {}

        // 5. Fetch Ticket SFT (OOXTCK-08aa7c-02)
        let ticketsVal = 0;
        try {
          const ticketRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts/OOXTCK-08aa7c-02`);
          if (ticketRes.data && ticketRes.data.balance) {
            ticketsVal = parseInt(ticketRes.data.balance) || 0;
          }
        } catch (e) {
          // 404 is returned if the user does not own this SFT
        }

        // 6. Fetch Black Box SFT (BOOX-39e0c4-01)
        let blackBoxesVal = 0;
        try {
          const blackBoxRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts/BOOX-39e0c4-01`);
          if (blackBoxRes.data && blackBoxRes.data.balance) {
            blackBoxesVal = parseInt(blackBoxRes.data.balance) || 0;
          }
        } catch (e) {
          // 404 is returned if the user does not own this SFT
        }

        // 7. Fetch Gold Box SFT (BOOX-39e0c4-02)
        let goldBoxesVal = 0;
        try {
          const goldBoxRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts/BOOX-39e0c4-02`);
          if (goldBoxRes.data && goldBoxRes.data.balance) {
            goldBoxesVal = parseInt(goldBoxRes.data.balance) || 0;
          }
        } catch (e) {
          // 404 is returned if the user does not own this SFT
        }

        const newAssets: UserAssets = {
          onx: onxVal,
          chubbies: chubbiesVal,
          customChubbies: customChubbiesVal,
          onionxCards: cardsVal,
          tickets: ticketsVal,
          blackBoxes: blackBoxesVal,
          goldBoxes: goldBoxesVal,
        };

        setAssets(newAssets);

        // --- Check for new badges ---
        const unlockedIds = badges
          .filter(b => b.check(newAssets))
          .map(b => b.id);

        const storageKey = `unlocked_badges_${address}`;
        const previousUnlockedStr = localStorage.getItem(storageKey);
        
        if (previousUnlockedStr !== null) {
          const previousUnlockedIds: string[] = JSON.parse(previousUnlockedStr);
          // Find newly unlocked badges
          const newlyUnlocked = badges.filter(
            b => unlockedIds.includes(b.id) && !previousUnlockedIds.includes(b.id)
          );

          if (newlyUnlocked.length > 0) {
            setNewBadgesModal(newlyUnlocked);
          }
        } else {
          // First time loading for this address, save current badges without pop-up
          // so user doesn't get spammed with history, or we can choose to show it.
          // Let's show them if they have unlocked anything, as a welcome surprise!
          const initialUnlocked = badges.filter(b => unlockedIds.includes(b.id));
          if (initialUnlocked.length > 0) {
            setNewBadgesModal(initialUnlocked);
          }
        }

        // Save current list as the source of truth
        localStorage.setItem(storageKey, JSON.stringify(unlockedIds));

      } catch (err) {
        console.error('Failed to load vault assets:', err);
        setError('An error occurred while loading assets from your wallet. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaultAssets();
  }, [address, network?.apiAddress, badges]);

  // Compute currently unlocked badges
  const unlockedBadges = useMemo(() => {
    return badges.filter(b => b.check(assets));
  }, [assets, badges]);

  const lockedBadges = useMemo(() => {
    return badges.filter(b => !b.check(assets));
  }, [assets, badges]);

  return (
    <div className="py-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Celebration / New Badge Notification Modal */}
      {newBadgesModal.length > 0 && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setNewBadgesModal([])}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-[#151518] rounded-[2.5rem] shadow-2xl border dark:border-white/10 p-8 sm:p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setNewBadgesModal([])}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6 animate-pulse">
              <PartyPopper className="w-10 h-10 text-yellow-500" />
            </div>

            <h2 className="text-3xl font-black mb-2 dark:text-white text-slate-900">
              {newBadgesModal.length === 1 ? 'New Badge Unlocked!' : 'New Badges Unlocked!'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-6 text-sm">
              Your wallet assets have unlocked new achievements:
            </p>

            <div className="w-full space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-1">
              {newBadgesModal.map((badge) => (
                <div 
                  key={badge.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className="font-black dark:text-white text-slate-900">{badge.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setNewBadgesModal([])}
              className="w-full py-4 bg-yellow-500 text-black font-black rounded-2xl hover:bg-yellow-600 transition-all active:scale-95 shadow-xl shadow-yellow-500/20"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col items-center justify-center gap-6 mb-16 text-center">
        <div className="inline-flex items-center justify-center h-7 px-4 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
          <span className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.2em] pl-[0.2em] mb-[1px] leading-none">BOOX Ecosystem</span>
        </div>
        
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-30 blur-2xl" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-yellow-500/20">
            <Vault className="w-12 h-12 text-black" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-amber-700 to-orange-600 dark:from-white dark:via-yellow-200 dark:to-orange-500">
            BOOX Vault
          </h1>
          <p className="max-w-2xl text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
            Manage and monitor your OnionX assets, unlock exclusive badges, and prepare to leverage the power of the decentralized vault.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-yellow-500 rounded-full animate-spin"></div>
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-slate-400">Reading Vault...</span>
        </div>
      ) : error ? (
        <div className="p-8 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-center space-y-4">
          <p className="font-bold text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-red-500 text-white font-black rounded-xl text-xs hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Dashboard Stats Panel */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 p-8 sm:p-10 mb-10 shadow-xl">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-500/10 dark:bg-yellow-500/5 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Vault Synchronized</span>
                </div>
                <h2 className="text-3xl font-black dark:text-white text-slate-900">Your Personal Vault</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1 truncate max-w-xs sm:max-w-md">
                  Wallet: {address}
                </p>
              </div>

              <div className="flex gap-4 sm:gap-6 flex-wrap">
                <div className="px-5 py-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                  <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Badges Unlocked</div>
                  <div className="text-2xl font-black dark:text-yellow-400 text-amber-600 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span>{unlockedBadges.length} / {badges.length}</span>
                  </div>
                </div>

                <div className="px-5 py-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                  <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Monitored Assets</div>
                  <div className="text-2xl font-black dark:text-white text-slate-900">
                    {
                      (assets.onx > 0 ? 1 : 0) +
                      (assets.chubbies.length > 0 ? 1 : 0) +
                      (assets.customChubbies.length > 0 ? 1 : 0) +
                      (assets.onionxCards.length > 0 ? 1 : 0) +
                      (assets.tickets > 0 ? 1 : 0) +
                      (assets.blackBoxes > 0 ? 1 : 0) +
                      (assets.goldBoxes > 0 ? 1 : 0)
                    } / 7
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black dark:text-white text-slate-900">My Achievements & Badges</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Unlock special badges based on the assets in your wallet
                </p>
              </div>
              {/* View toggle — only show when there are unlocked badges */}
              {unlockedBadges.length > 0 && (
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <button
                    onClick={() => setBadgesViewMode('single')}
                    className={`p-1.5 rounded-lg transition-all ${
                      badgesViewMode === 'single' ? 'bg-yellow-500 text-black shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Carousel view"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBadgesViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${
                      badgesViewMode === 'grid' ? 'bg-yellow-500 text-black shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {unlockedBadges.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] text-center text-slate-400 font-bold">
                You haven't unlocked any badges yet. Add assets to your wallet to get started!
              </div>
            ) : badgesViewMode === 'single' ? (
              /* ── CAROUSEL VIEW ── */
              <div className="flex flex-col items-center justify-center py-6 gap-6">
                {/* Badge Card */}
                <div className={`relative w-full max-w-sm rounded-[2rem] p-8 bg-gradient-to-b border flex flex-col gap-6 shadow-2xl transition-all duration-300 ${unlockedBadges[badgesIndex]?.colorClass}`}>
                  {/* Index badge */}
                  <span className="absolute top-5 right-5 text-[11px] font-black bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/10">
                    {badgesIndex + 1} / {unlockedBadges.length}
                  </span>

                  {/* Nav arrows */}
                  {unlockedBadges.length > 1 && (
                    <>
                      <button
                        onClick={() => setBadgesIndex(prev => prev === 0 ? unlockedBadges.length - 1 : prev - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/10 transition-all active:scale-90"
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      <button
                        onClick={() => setBadgesIndex(prev => prev === unlockedBadges.length - 1 ? 0 : prev + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/10 transition-all active:scale-90"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Icon + Active chip */}
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center justify-center">
                      <span className="scale-150">{unlockedBadges[badgesIndex]?.icon}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  {/* Badge info */}
                  <div>
                    <h4 className="text-2xl font-black dark:text-white text-slate-900 mb-2">
                      {unlockedBadges[badgesIndex]?.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                      {unlockedBadges[badgesIndex]?.description}
                    </p>
                    <div className="h-px bg-black/10 dark:bg-white/10 mb-3" />
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                      Requirement: {unlockedBadges[badgesIndex]?.requirement}
                    </div>
                  </div>
                </div>

                {/* Dot indicators */}
                {unlockedBadges.length > 1 && (
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {unlockedBadges.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setBadgesIndex(dotIdx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          dotIdx === badgesIndex ? 'w-6 bg-yellow-500' : 'w-1.5 bg-slate-300 dark:bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ── GRID VIEW ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`relative p-5 rounded-2xl bg-gradient-to-b border flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg ${badge.colorClass}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-black/10 dark:bg-white/5 flex items-center justify-center">
                        {badge.icon}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-black dark:text-white text-slate-900 mb-1">{badge.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium mb-2">
                        {badge.description}
                      </p>
                      <div className="h-px bg-slate-200 dark:bg-white/5 my-2" />
                      <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                        Requirement: {badge.requirement}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Locked Badges — always shown as small grid below */}
            {lockedBadges.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Locked Badges</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {lockedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 flex flex-col justify-between opacity-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-600">
                          <Lock className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400">
                          Locked
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-400 dark:text-slate-500 mb-1">{badge.title}</h4>
                        <div className="h-px bg-slate-200 dark:bg-white/5 my-2" />
                        <div className="text-[9px] uppercase tracking-wider font-bold text-red-400/80">
                          {badge.requirement}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assets Management Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-black dark:text-white text-slate-900">Your Detected Assets</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                View and manage your resources in real time
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ONX Token Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <Coins className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black dark:text-white text-slate-900">ONX</h4>
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">ESDT Token</span>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-md bg-yellow-500/10 text-yellow-500">
                      ONX-3e51c8
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-6">
                    The primary utility token of the ecosystem. Use it to unlock Premium tools and participate in the Vault.
                  </p>

                  {assets.onx === 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-600 dark:text-yellow-400 font-semibold space-y-2">
                      <p>You don't own any ONX. Buy directly using your wallet via xPortal or xExchange:</p>
                      <div className="flex gap-2">
                        <a 
                          href="https://xportal.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-yellow-500 text-black font-black rounded-lg hover:bg-yellow-600 transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span>xPortal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a 
                          href="https://xexchange.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-yellow-500/10 dark:bg-white/5 border border-yellow-500/30 dark:border-white/10 text-yellow-600 dark:text-yellow-400 font-black rounded-lg hover:bg-yellow-500/20 dark:hover:bg-white/10 transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span>xExchange</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-400">Wallet Balance</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {BigNumber(assets.onx).toFormat(0)}
                  </span>
                </div>
              </div>

              {/* Tickets SFT Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Ticket className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black dark:text-white text-slate-900">Tickets</h4>
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">SFT Asset</span>
                      </div>
                    </div>
                    <a 
                      href="https://explorer.multiversx.com/nfts/OOXTCK-08aa7c-02"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-black px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center gap-1 hover:bg-emerald-500/20 transition-colors"
                    >
                      <span>OOXTCK-08aa7c-02</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-6">
                    Special tickets providing access rights to features, raffles, and special OnionXLabs events.
                  </p>

                  {assets.tickets === 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold space-y-2">
                      <p>You don't own any Tickets. Buy directly on OOX using USDC or ONX:</p>
                      <div className="flex flex-wrap gap-2">
                        <a 
                          href="https://oox.art/marketplace/nfts/OOXTCK-08aa7c-02?auctionId=2482&marketplace=oox" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-500 text-white font-black rounded-lg hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span>Buy with USDC</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a 
                          href="https://oox.art/marketplace/nfts/OOXTCK-08aa7c-02?auctionId=2481&marketplace=oox" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-500/10 dark:bg-white/5 border border-emerald-500/30 dark:border-white/10 text-emerald-600 dark:text-emerald-400 font-black rounded-lg hover:bg-emerald-500/20 dark:hover:bg-white/10 transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span>Buy with ONX</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-400">Available Quantity</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {assets.tickets}
                  </span>
                </div>
              </div>

              {/* Black Box SFT Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-700/10 dark:bg-slate-400/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/10 dark:bg-white/5 flex items-center justify-center border border-slate-700/20 dark:border-white/10">
                        <span className="text-2xl">🖤</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-black dark:text-white text-slate-900">Black Box</h4>
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">SFT Asset</span>
                      </div>
                    </div>
                    <a
                      href="https://explorer.multiversx.com/nfts/BOOX-39e0c4-01"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black px-2.5 py-1 rounded-md bg-slate-700/10 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-700/20 dark:hover:bg-white/10 transition-colors border border-slate-300/30 dark:border-white/10"
                    >
                      <span>BOOX-39e0c4-01</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-6">
                    Exclusive Black Boxes from the BOOX collection. Rare and mysterious.
                  </p>

                  {assets.blackBoxes === 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-slate-100/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 font-semibold space-y-2">
                      <p>You don't own any Black Boxes. Check the marketplace to get one:</p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href="https://explorer.multiversx.com/collections/BOOX-39e0c4"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-800 dark:bg-white/10 text-white dark:text-white font-black rounded-lg hover:bg-slate-700 dark:hover:bg-white/20 transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span>View Collection</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-400">Available Quantity</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {assets.blackBoxes}
                  </span>
                </div>
              </div>

              {/* Gold Box SFT Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-black dark:text-white text-slate-900">Gold Box</h4>
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">SFT Asset</span>
                      </div>
                    </div>
                    <a
                      href="https://explorer.multiversx.com/nfts/BOOX-39e0c4-02"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black px-2.5 py-1 rounded-md bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 flex items-center gap-1 hover:bg-yellow-400/20 transition-colors border border-yellow-400/20"
                    >
                      <span>BOOX-39e0c4-02</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-6">
                    Prestigious Gold Boxes from the BOOX collection. Premium and extremely valuable.
                  </p>

                  {assets.goldBoxes === 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-yellow-400/5 dark:bg-yellow-400/10 border border-yellow-400/20 text-xs text-yellow-700 dark:text-yellow-400 font-semibold space-y-2">
                      <p>You don't own any Gold Boxes. Check the marketplace to get one:</p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href="https://explorer.multiversx.com/collections/BOOX-39e0c4"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-yellow-500 text-black font-black rounded-lg hover:bg-yellow-400 transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span>View Collection</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-400">Available Quantity</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {assets.goldBoxes}
                  </span>
                </div>
              </div>

            </div>

            {/* Carousel/Grid sections for NFT Collections */}
            {[
              {
                title: 'CHUBBY OnionX',
                ticker: 'CHBONX-3e0201',
                items: assets.chubbies,
                description: 'The cute original OnionX PFP collection.',
                colorClass: 'from-pink-500/10 border-pink-500/20 text-pink-400',
              },
              {
                title: 'CUSTOM CHUBBY',
                ticker: 'CTMCHUB-9298c1',
                items: assets.customChubbies,
                description: 'Your personalized and exclusive CHUBBYs.',
                colorClass: 'from-cyan-500/10 border-cyan-500/20 text-cyan-400',
              },
              {
                title: 'OnionxCards',
                ticker: 'ONXCRDS-ab712e',
                items: assets.onionxCards,
                description: 'Ecosystem trading cards and collectibles.',
                colorClass: 'from-indigo-500/10 border-indigo-500/20 text-indigo-400',
              }
            ].map((collection, index) => (
              <div 
                key={index}
                className="p-6 rounded-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-black dark:text-white text-slate-900">{collection.title}</h4>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                        {collection.items.length} {collection.items.length === 1 ? 'NFT' : 'NFTs'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold mt-1">{collection.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* View mode toggle (only for OnionxCards) */}
                    {collection.ticker === 'ONXCRDS-ab712e' && collection.items.length > 0 && (
                      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <button
                          onClick={() => setOnionCardsViewMode('single')}
                          className={`p-1.5 rounded-lg transition-all ${onionCardsViewMode === 'single' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                          <Square className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOnionCardsViewMode('grid')}
                          className={`p-1.5 rounded-lg transition-all ${onionCardsViewMode === 'grid' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-gradient-to-r ${collection.colorClass}`}>
                      {collection.ticker}
                    </span>
                  </div>
                </div>

                {collection.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] text-center gap-2">
                    <Gem className="w-8 h-8 text-slate-300 dark:text-white/10" />
                    <p className="text-xs font-bold text-slate-400">No NFTs detected in this collection in your wallet.</p>
                    {collection.ticker === 'CHBONX-3e0201' && (
                      <a 
                        href="https://oox.art/marketplace/collections/CHBONX-3e0201" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-2 px-4 py-2 bg-pink-500 text-white font-black rounded-xl text-xs hover:bg-pink-600 transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-pink-500/10"
                      >
                        <span>Buy your first CHUBBY on OOX</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {collection.ticker === 'CTMCHUB-9298c1' && (
                      <div className="mt-3 max-w-md px-4 py-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl space-y-3">
                        <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold leading-relaxed">
                          CUSTOM CHUBBY NFTs are not for sale. The only way to get one is to own a standard CHUBBY and join our Discord. They are distributed exclusively through giveaways for CHUBBY holders!
                        </p>
                        <a 
                          href="https://discord.gg/WVSMrNzqNb" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex px-4 py-2 bg-[#5865F2] text-white font-black rounded-xl text-xs hover:bg-[#4752C4] transition-all active:scale-95 items-center gap-1.5 shadow-md shadow-[#5865F2]/10"
                        >
                          <span>Join Discord Server</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : collection.ticker === 'ONXCRDS-ab712e' && onionCardsViewMode === 'single' ? (
                  /* CAROUSEL VIEW */
                  <div className="flex flex-col items-center justify-center py-6 gap-6">
                    <div className="relative w-full max-w-[340px] aspect-[4/5] sm:max-w-[380px] rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-[#151518] border border-slate-200 dark:border-white/10 shadow-2xl group flex items-center justify-center">
                      
                      {/* Image */}
                      {collection.items[onionCardsIndex]?.imageUrl ? (
                        <img 
                          src={collection.items[onionCardsIndex].imageUrl} 
                          alt={collection.items[onionCardsIndex].name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/bacon-icon.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gem className="w-12 h-12 text-slate-400" />
                        </div>
                      )}

                      {/* Index Badge */}
                      <span className="absolute top-4 right-4 text-[11px] font-black bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/10">
                        {onionCardsIndex + 1} / {collection.items.length}
                      </span>

                      {/* Left/Right click zones/Chevrons (Only if items > 1) */}
                      {collection.items.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOnionCardsIndex(prev => (prev === 0 ? collection.items.length - 1 : prev - 1));
                            }}
                            className="absolute left-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                          >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOnionCardsIndex(prev => (prev === collection.items.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Metadata details under the image */}
                    <div className="text-center space-y-1">
                      <h4 className="text-xl font-black dark:text-white text-slate-900">
                        {collection.items[onionCardsIndex]?.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest block">
                        {collection.items[onionCardsIndex]?.identifier}
                      </p>
                    </div>

                    {/* Indicator dots at the bottom of the card */}
                    {collection.items.length > 1 && (
                      <div className="flex gap-1.5 flex-wrap justify-center max-w-md">
                        {collection.items.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            onClick={() => setOnionCardsIndex(dotIdx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${dotIdx === onionCardsIndex ? 'w-6 bg-orange-500' : 'w-1.5 bg-slate-300 dark:bg-white/10'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* GRID VIEW (default or standard) */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {collection.items.map((nft) => (
                      <div 
                        key={nft.identifier}
                        className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-3 hover:border-yellow-500/30 transition-all flex flex-col gap-2 group cursor-pointer"
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5">
                          {nft.imageUrl ? (
                            <img 
                              src={nft.imageUrl} 
                              alt={nft.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                // Fallback
                                (e.target as HTMLImageElement).src = '/bacon-icon.png';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gem className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-black truncate dark:text-white text-slate-900">{nft.name}</h5>
                          <span className="text-[9px] text-slate-400 font-bold truncate block">{nft.identifier}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
};

export default VaultPage;
