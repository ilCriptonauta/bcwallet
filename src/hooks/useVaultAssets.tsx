import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { 
  Coins, 
  Trophy, 
  Sparkles, 
  Gem, 
  CreditCard, 
  Ticket, 
  PartyPopper 
} from 'lucide-react';

export interface NftItem {
  identifier: string;
  name: string;
  imageUrl: string | null;
}

export interface UserAssets {
  onx: number;
  chubbies: NftItem[];
  customChubbies: NftItem[];
  onionxCards: NftItem[];
  tickets: number;
  blackBoxes: number;
  goldBoxes: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  requirement: string;
  icon: React.ReactNode;
  colorClass: string;
  check: (assets: UserAssets) => boolean;
}

export function useVaultAssets(address: string | undefined, network: any) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newBadgesModal, setNewBadgesModal] = useState<Badge[]>([]);

  const [assets, setAssets] = useState<UserAssets>({
    onx: 0,
    chubbies: [],
    customChubbies: [],
    onionxCards: [],
    tickets: 0,
    blackBoxes: 0,
    goldBoxes: 0,
  });

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

  useEffect(() => {
    if (!address || !network?.apiAddress) return;

    let isMounted = true;

    const fetchVaultAssets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let onxVal = 0;
        try {
          const onxRes = await axios.get(`${network.apiAddress}/accounts/${address}/tokens/ONX-3e51c8`);
          if (onxRes.data && onxRes.data.balance) {
            const dec = onxRes.data.decimals ?? 18;
            onxVal = new BigNumber(onxRes.data.balance)
              .dividedBy(new BigNumber(10).pow(dec))
              .toNumber();
          }
        } catch {}

        const mapNfts = (items: any[]): NftItem[] => {
          return (items || []).map((item: any) => ({
            identifier: item.identifier,
            name: item.name || item.identifier,
            imageUrl: item.media?.[0]?.thumbnailUrl || item.media?.[0]?.url || item.url || null
          }));
        };

        let chubbiesVal: NftItem[] = [];
        try {
          const chubbiesRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts?collection=CHBONX-3e0201&size=100`);
          chubbiesVal = mapNfts(chubbiesRes.data);
        } catch {}

        let customChubbiesVal: NftItem[] = [];
        try {
          const customRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts?collection=CTMCHUB-9298c1&size=100`);
          customChubbiesVal = mapNfts(customRes.data);
        } catch {}

        let cardsVal: NftItem[] = [];
        try {
          const cardsRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts?collection=ONXCRDS-ab712e&size=100`);
          cardsVal = mapNfts(cardsRes.data);
        } catch {}

        let ticketsVal = 0;
        try {
          const ticketRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts/OOXTCK-08aa7c-02`);
          if (ticketRes.data && ticketRes.data.balance) {
            ticketsVal = parseInt(ticketRes.data.balance) || 0;
          }
        } catch {}

        let blackBoxesVal = 0;
        try {
          const blackBoxRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts/BOOX-39e0c4-01`);
          if (blackBoxRes.data && blackBoxRes.data.balance) {
            blackBoxesVal = parseInt(blackBoxRes.data.balance) || 0;
          }
        } catch {}

        let goldBoxesVal = 0;
        try {
          const goldBoxRes = await axios.get(`${network.apiAddress}/accounts/${address}/nfts/BOOX-39e0c4-02`);
          if (goldBoxRes.data && goldBoxRes.data.balance) {
            goldBoxesVal = parseInt(goldBoxRes.data.balance) || 0;
          }
        } catch {}

        const newAssets: UserAssets = {
          onx: onxVal,
          chubbies: chubbiesVal,
          customChubbies: customChubbiesVal,
          onionxCards: cardsVal,
          tickets: ticketsVal,
          blackBoxes: blackBoxesVal,
          goldBoxes: goldBoxesVal,
        };

        if (isMounted) {
          setAssets(newAssets);

          const unlockedIds = badges
            .filter(b => b.check(newAssets))
            .map(b => b.id);

          const storageKey = `unlocked_badges_${address}`;
          const previousUnlockedStr = localStorage.getItem(storageKey);
          
          if (previousUnlockedStr !== null) {
            try {
              const previousUnlockedIds: string[] = JSON.parse(previousUnlockedStr);
              const brandNewIds = unlockedIds.filter(id => !previousUnlockedIds.includes(id));
              
              if (brandNewIds.length > 0) {
                const brandNewBadges = badges.filter(b => brandNewIds.includes(b.id));
                setNewBadgesModal(brandNewBadges);
              }
            } catch {}
          }

          localStorage.setItem(storageKey, JSON.stringify(unlockedIds));
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load some assets from the MultiversX network.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVaultAssets();

    return () => {
      isMounted = false;
    };
  }, [address, network?.apiAddress, badges]);

  const unlockedCount = useMemo(() => {
    return badges.filter(b => b.check(assets)).length;
  }, [badges, assets]);

  return {
    assets,
    badges,
    isLoading,
    error,
    unlockedCount,
    newBadgesModal,
    setNewBadgesModal
  };
}
