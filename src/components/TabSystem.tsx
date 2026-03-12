'use client';

import { createPortal } from 'react-dom';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import {
  X, Folder, Plus, LayoutDashboard, Search,
  DollarSign, Send, Flame, Download, Heart, Settings,
  Zap, ArrowLeft, Lock, Trash2, Share2, Square, LayoutGrid,
  TrendingUp, TrendingDown, Clock, Users, User,
  Copy, Check, ExternalLink
} from 'lucide-react';
import { useGetAccountInfo, useGetNetworkConfig } from '@/lib';
import { useAccountNfts, type NormalizedNft } from '@/helpers';
import { useFirebaseFolders } from '@/hooks/useFirebaseFolders';
import { useNftTransactions } from '@/hooks/useNftTransactions';
import { GalleryGrid } from './GalleryGrid';
import { BurnModal } from './modals/BurnModal';
import { SellModal } from './modals/SellModal';
import { MoveModal } from './modals/MoveModal';
import { RemoveConfirmationModal } from './modals/RemoveConfirmationModal';
import { CreateFolderModal } from './modals/CreateFolderModal';
import { ShareFolderModal } from './modals/ShareFolderModal';
import { AssetSendModal } from './modals/AssetSendModal';
import { NftMedia } from './NftMedia';
import { useWebHaptics } from 'web-haptics/react';
type ViewMode = 'Collectibles' | 'Management';
type TabId = 'Overview' | 'SFTs' | 'Collections' | string;

const OOX_CONTRACT_ADDRESS = "erd1qqqqqqqqqqqqqpgqwp73w2a9eyzs64eltupuz3y3hv798vlv899qrjnflg";

export const OOX_PAYMENT_TOKENS = [
  { identifier: 'EGLD', ticker: 'EGLD', decimals: 18 },
  { identifier: 'USDC-c76f1f', ticker: 'USDC', decimals: 6 },
  { identifier: 'ONX-3e51c8', ticker: 'ONX', decimals: 18 },
];

interface SelectedItem {
  id: number;
  tab: string;
  imageUrl: string;
  originalImageUrl?: string | null;
  thumbnailUrl?: string | null;
  mimeType?: string;
  identifier?: string;
  collection?: string;
  name?: string;
  attributes?: { trait_type: string; value: string }[];
  description?: string;
  tags?: string[];
  floorPrice?: string;
  type?: 'NFT' | 'SFT' | 'MetaESDT';
  balance?: string;
}

interface UserFolder {
  id: number | string;
  name: string;
  description?: string;
  itemCount: number;
  previewImages: string[];
}

interface TabSystemProps {
  isFullVersion: boolean;
}

const NftActivityHistory = ({ identifier }: { identifier: string }) => {
  const [activities, setActivities] = useState<{ type: 'list' | 'delist'; hash: string; timestamp: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { network } = useGetNetworkConfig();

  useEffect(() => {
    let active = true;
    if (!identifier) return;

    fetch(`${network.apiAddress}/nfts/${identifier}/transactions?size=50`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !Array.isArray(data)) return;

        const filtered = data.map((tx: any) => {
          const fn = (tx.function || '').toLowerCase();
          const actionName = (tx.action?.name || '').toLowerCase();

          let type: 'list' | 'delist' | null = null;

          if (fn.includes('list') || fn.includes('sell') || actionName.includes('list') || actionName.includes('sell')) {
            type = 'list';
          } else if (fn.includes('withdraw') || fn.includes('delist') || fn.includes('cancel') || actionName.includes('withdraw') || actionName.includes('delist') || actionName.includes('cancel')) {
            type = 'delist';
          }

          return type ? { type, hash: tx.txHash, timestamp: tx.timestamp } : null;
        }).filter(Boolean) as { type: 'list' | 'delist'; hash: string; timestamp: number }[];

        // Remove duplicates and sort descending
        const unique = Array.from(new Map(filtered.map(item => [item.hash, item])).values())
          .sort((a, b) => b.timestamp - a.timestamp);

        setActivities(unique);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [identifier]);

  if (loading || activities.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] items-center flex gap-1.5 font-black uppercase tracking-[0.2em] text-gray-400">
        <Clock className="w-3 h-3" /> Trading Activity
      </h3>
      <div className="space-y-2">
        {activities.map((act) => (
          <a
            key={act.hash}
            href={`https://explorer.multiversx.com/transactions/${act.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-white/5 hover:border-orange-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              {act.type === 'list' ? (
                <div className="p-1.5 bg-green-500/10 rounded-full">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              ) : (
                <div className="p-1.5 bg-red-500/10 rounded-full">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
              )}
              <span className={`text-[10px] font-black uppercase tracking-widest ${act.type === 'list' ? 'text-green-500' : 'text-red-500'}`}>
                {act.type === 'list' ? 'Listed' : 'Delisted'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
              {new Date(act.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

const TabSystem: React.FC<TabSystemProps> = ({ isFullVersion }) => {
  const haptics = useWebHaptics();
  const [viewMode, setViewMode] = useState<ViewMode>('Collectibles');

  const [searchQuery, setSearchQuery] = useState('');

  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('bcw_activeTab') as TabId) || 'Overview';
    }
    return 'Overview';
  });

  const [activeFolder, setActiveFolder] = useState<UserFolder | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [selectedNfts, setSelectedNfts] = useState<NormalizedNft[]>([]);

  const [isLargeGrid, setIsLargeGridState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bcw_isLargeGrid') === 'true';
    }
    return false;
  });
  const { network } = useGetNetworkConfig();
  const accountInfo = useGetAccountInfo();
  const walletAddress = accountInfo?.account?.address;
  const {
    folders: firebaseFolders,
    folderContents: firebaseFolderContents,
    favorites: firebaseFavorites,
    isPro: firebaseIsPro,
    preferences: firebasePreferences,
    createFolder: fbCreateFolder,
    deleteFolder: fbDeleteFolder,
    addItemToFolder: fbAddItemToFolder,
    addItemsToFolder: fbAddItemsToFolder,
    removeItemFromFolder: fbRemoveItemFromFolder,
    removeItemsFromFolder: fbRemoveItemsFromFolder,
    toggleFavorite: fbToggleFavorite,
    updatePreferences: fbUpdatePreferences
  } = useFirebaseFolders(walletAddress);

  const isMainTabActive = viewMode === 'Collectibles' && (activeTab === 'Overview' || activeTab === 'SFTs' || activeTab === 'Collections');
  const nftsQuery = useAccountNfts({
    address: walletAddress,
    enabled: isMainTabActive,
    pageSize: 30
  });

  const { handleSendNft: _handleSendNft, handleBurnNft: _handleBurnNft, handleSellNft: _handleSellNft } = useNftTransactions({
    walletAddress,
    network,
    setItems: nftsQuery.setItems,
    OOX_PAYMENT_TOKENS,
    OOX_CONTRACT_ADDRESS,
  });

  // Sync Firestore preferences → local state (cross-device sync)
  const prefsAppliedRef = React.useRef(false);
  useEffect(() => {
    if (!firebasePreferences || Object.keys(firebasePreferences).length === 0) return;
    if (prefsAppliedRef.current) return;
    prefsAppliedRef.current = true;

    if (firebasePreferences.activeTab) {
      setActiveTabState(firebasePreferences.activeTab as TabId);
      localStorage.setItem('bcw_activeTab', firebasePreferences.activeTab);
    }
    if (firebasePreferences.isLargeGrid !== undefined) {
      setIsLargeGridState(firebasePreferences.isLargeGrid);
      localStorage.setItem('bcw_isLargeGrid', String(firebasePreferences.isLargeGrid));
    }
  }, [firebasePreferences]);


  const setActiveTab = (t: TabId) => {
    setActiveTabState(t);
    localStorage.setItem('bcw_activeTab', t);
    fbUpdatePreferences({ activeTab: t });
  };
  const setIsLargeGrid = (v: boolean) => {
    setIsLargeGridState(v);
    localStorage.setItem('bcw_isLargeGrid', String(v));
    fbUpdatePreferences({ isLargeGrid: v });
  };



  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [nftToSend, setNftToSend] = useState<NormalizedNft | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [nftToSell, setNftToSell] = useState<NormalizedNft | null>(null);
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);
  const [nftToBurn, setNftToBurn] = useState<NormalizedNft | null>(null);
  const [burnQuantity, setBurnQuantity] = useState('1');
  const [sellPrice, setSellPrice] = useState('');
  const [sellQuantity, setSellQuantity] = useState('1');
  const [selectedPaymentToken, setSelectedPaymentToken] = useState('EGLD');
  const [recipient, setRecipient] = useState('');
  const [sendQuantity, setSendQuantity] = useState('1');
  const [folderTitle, setFolderTitle] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [folderToShare, setFolderToShare] = useState<UserFolder | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [isRemoveConfirmationOpen, setIsRemoveConfirmationOpen] = useState(false);
  const [nftToMove, setNftToMove] = useState<NormalizedNft | null>(null);
  const [collectionFloorPrice, setCollectionFloorPrice] = useState<string | null>(null);
  const [collectionDetails, setCollectionDetails] = useState<{
    description?: string;
    holderCount?: number;
    nftCount?: number;
  } | null>(null);
  const [itemFloorPrice, setItemFloorPrice] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // No longer needed: local localStorage effects removed since we use Firebase real-time sync.

  // Lock body scroll when any modal is open (prevents iOS scroll-through)
  const isAnyModalOpen = !!(selectedItem || isSendModalOpen || isSellModalOpen || isBurnModalOpen || isMoveModalOpen || isCreateModalOpen || isShareModalOpen || isRemoveConfirmationOpen);
  useEffect(() => {
    if (isAnyModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isAnyModalOpen]);

  // Fetch floor price when an NFT detail is opened
  useEffect(() => {
    if (selectedItem?.collection) {
      setItemFloorPrice(null);
      fetch(`https://api.oox.art/collections/${selectedItem.collection}/auction/stats`)
        .then(res => res.json())
        .then((data: { minPrice?: string; activeAuctions?: number }) => {
          if (data.minPrice && data.activeAuctions && data.activeAuctions > 0) {
            const floor = new BigNumber(data.minPrice).dividedBy(new BigNumber(10).pow(18));
            setItemFloorPrice(floor.toFixed(floor.lt(1) ? 4 : 2) + ' EGLD');
          } else {
            setItemFloorPrice('—');
          }
        })
        .catch(() => setItemFloorPrice('—'));
    } else {
      setItemFloorPrice(null);
    }
  }, [selectedItem?.collection, selectedItem?.identifier]);

  const handleCreateFolder = async () => {
    if (!folderTitle.trim()) return;

    if (firebaseFolders.length >= maxFolders) {
      alert(`You've reached the limit of ${maxFolders} folders!${!hasProAccess ? ' Get a Bacon PASS license to unlock up to 50 folders.' : ''}`);
      return;
    }

    const newFolderId = await fbCreateFolder(folderTitle, folderDesc);

    if (newFolderId) {
      if (isSelectionMode && selectedNfts.length > 0) {
        handleMoveMultipleNfts(newFolderId);
      } else if (nftToMove) {
        handleMoveNft(newFolderId);
      }
    }

    setFolderTitle('');
    setFolderDesc('');
    setIsCreateModalOpen(false);
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string | number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this folder? The NFTs inside will remain in your wallet.')) {
      await fbDeleteFolder(folderId.toString());
      setOpenFolderMenuId(null);
    }
  };

  const handleShareFolder = (e: React.MouseEvent, folder: UserFolder) => {
    e.stopPropagation();
    setFolderToShare(folder);
    setShareLinkCopied(false);
    setIsShareModalOpen(true);
    setOpenFolderMenuId(null);
  };

  const handleMoveNft = async (targetFolderId: string | number) => {
    if (!nftToMove) return;
    await fbAddItemToFolder(targetFolderId.toString(), nftToMove);
    setIsMoveModalOpen(false);
    setNftToMove(null);
    setOpenMenuId(null);
  };

  const openMoveModal = (e: React.MouseEvent, nft: NormalizedNft) => {
    e.stopPropagation();
    setNftToMove(nft);
    setIsMoveModalOpen(true);
  };

  const openSendModal = (e: React.MouseEvent, nft: NormalizedNft) => {
    e.stopPropagation();
    setNftToSend(nft);
    setRecipient('');
    setSendQuantity('1');
    setIsSendModalOpen(true);
    setOpenMenuId(null);
  };

  const openBurnModal = (e: React.MouseEvent, nft: NormalizedNft) => {
    e.stopPropagation();
    setNftToBurn(nft);
    setBurnQuantity('1');
    setIsBurnModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSendNft = () => {
    if (!nftToSend || !recipient) return;
    return _handleSendNft(nftToSend, recipient, sendQuantity, () => {
      setIsSendModalOpen(false);
      setNftToSend(null);
    });
  };

  const handleBurnNft = () => {
    if (!nftToBurn) return;
    return _handleBurnNft(nftToBurn, burnQuantity, () => {
      setIsBurnModalOpen(false);
      setNftToBurn(null);
    });
  };

  const openSellModal = (e: React.MouseEvent, nft: NormalizedNft) => {
    e.stopPropagation();
    setNftToSell(nft);
    setSellPrice('');
    setSellQuantity('1');
    setSelectedPaymentToken('EGLD');
    setIsSellModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSellNft = () => {
    if (!nftToSell || !sellPrice) return;
    return _handleSellNft(nftToSell, sellPrice, sellQuantity, selectedPaymentToken, () => {
      setIsSellModalOpen(false);
      setNftToSell(null);
    });
  };

  const handleMoveMultipleNfts = async (targetFolderId: string | number) => {
    if (selectedNfts.length === 0) return;

    await fbAddItemsToFolder(targetFolderId.toString(), selectedNfts);

    if (activeFolder && activeFolder.id !== targetFolderId.toString()) {
      if (activeFolder.id === 'favorites') {
        for (const nft of selectedNfts) {
          if (firebaseFavorites.some(f => f.identifier === nft.identifier)) {
            await fbToggleFavorite(nft);
          }
        }
      } else {
        await fbRemoveItemsFromFolder(activeFolder.id.toString(), selectedNfts.map(nft => nft.identifier));
      }
    }

    setIsMoveModalOpen(false);
    setIsSelectionMode(false);
    setSelectedNfts([]);
    setOpenMenuId(null);
  };

  const handleRemoveMultipleNfts = async () => {
    if (selectedNfts.length === 0 || !activeFolder) return;

    if (activeFolder.id === 'favorites') {
      for (const nft of selectedNfts) {
        if (firebaseFavorites.some(f => f.identifier === nft.identifier)) {
          await fbToggleFavorite(nft);
        }
      }
    } else {
      await fbRemoveItemsFromFolder(activeFolder.id.toString(), selectedNfts.map(nft => nft.identifier));
    }

    setIsSelectionMode(false);
    setSelectedNfts([]);
    setOpenMenuId(null);
    setIsRemoveConfirmationOpen(false);
  };

  const toggleSelection = (nft: NormalizedNft) => {
    setSelectedNfts(prev => {
      const isAlreadySelected = prev.some(n => n.identifier === nft.identifier);
      if (isAlreadySelected) {
        const filtered = prev.filter(n => n.identifier !== nft.identifier);
        if (filtered.length === 0) setIsSelectionMode(false);
        return filtered;
      } else {
        return [...prev, nft];
      }
    });
  };

  const startLongPress = (nft: NormalizedNft, e?: React.TouchEvent) => {
    isLongPressActive.current = false;
    if (e?.touches?.[0]) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      touchStartPos.current = null;
    }
    longPressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      setIsSelectionMode(true);
      setSelectedNfts(prev => {
        if (!prev.some(n => n.identifier === nft.identifier)) {
          return [...prev, nft];
        }
        return prev;
      });
      haptics.trigger('medium');
    }, 400);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    const dx = e.touches[0].clientX - touchStartPos.current.x;
    const dy = e.touches[0].clientY - touchStartPos.current.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clearLongPress();
    }
  };



  const toggleFavorite = (e: React.MouseEvent, nft: NormalizedNft) => {
    e.stopPropagation();
    fbToggleFavorite(nft);
  };

  const [gridColumns, setGridColumns] = useState(2);
  const nftGridRef = useRef<HTMLDivElement>(null);
  const nftSentinelRef = useRef<HTMLDivElement>(null);



  const menuRef = useRef<HTMLDivElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  // Tab sliding indicator
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<React.CSSProperties>({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl) {
      const parent = activeEl.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        setTabIndicatorStyle({
          left: elRect.left - parentRect.left,
          width: elRect.width,
          opacity: 1,
        });
      }
    }
  }, [activeTab, viewMode]);

  const dynamicUserFolders: UserFolder[] = [
    {
      id: "favorites",
      name: 'Favorites',
      description: 'Your favorite assets in one place.',
      itemCount: firebaseFavorites.length,
      previewImages: firebaseFavorites.length > 0
        ? firebaseFavorites.slice(0, 4).map(n => n.imageUrl || n.identifier)
        : []
    },
    ...firebaseFolders
  ];

  const tabs: { id: string; label: string }[] = [
    { id: 'Overview', label: 'Overview' },
    { id: 'Collections', label: 'Collections' },
    { id: 'SFTs', label: 'SFTs' },
    { id: 'favorites', label: 'Favorites' }
  ];

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedNfts([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenuId(null);
      if (folderMenuRef.current && !folderMenuRef.current.contains(event.target as Node)) setOpenFolderMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  useEffect(() => {
    const computeColumns = () => {
      const width = window.innerWidth;
      let cols = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
      if (isLargeGrid) {
        cols = width >= 768 ? 2 : 1;
      }
      setGridColumns(cols);
    };

    computeColumns();
    window.addEventListener('resize', computeColumns);
    return () => window.removeEventListener('resize', computeColumns);
  }, [isLargeGrid]);



  const renderContextMenu = (i: number, nft: NormalizedNft) => {
    if (openMenuId !== i) return null;
    const contentJSX = (
      <>
        {/* Mobile Backdrop */}
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
        <div ref={menuRef} onClick={(e) => e.stopPropagation()} className="fixed md:absolute bottom-0 md:bottom-12 left-0 right-0 md:left-auto md:-right-2 z-[70] w-full md:w-44 bg-white dark:bg-[#252525] rounded-t-[2rem] md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl border-t md:border border-gray-100 dark:border-white/10 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:p-1.5 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-2 md:zoom-in-95 duration-300">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
          <button onClick={(e) => openSellModal(e, nft)} className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all">
            <div className="flex items-center gap-4 md:gap-2"><DollarSign className="w-5 h-5 md:w-4 md:h-4 text-green-500" /><span>List on OOX</span></div>
          </button>
          <button onClick={(e) => openSendModal(e, nft)} className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all">
            <div className="flex items-center gap-4 md:gap-2"><Send className="w-5 h-5 md:w-4 md:h-4 text-blue-500" /><span>Send</span></div>
          </button>
          <button onClick={(e) => openMoveModal(e, nft)} className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all">
            <div className="flex items-center gap-4 md:gap-2"><Folder className="w-5 h-5 md:w-4 md:h-4 text-orange-500" /><span>Move to Folder</span></div>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(null);
              if (!hasProAccess) {
                alert('This feature is only for PRO users. Get a Bacon PASS license to unlock it!');
                return;
              }
              const avatarUrl = nft.originalImageUrl || nft.imageUrl;
              fbUpdatePreferences({ avatarUrl });
              alert('Avatar successfully updated!');
            }} 
            className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4 md:gap-2">
              {hasProAccess ? <User className="w-5 h-5 md:w-4 md:h-4 text-purple-500" /> : <Lock className="w-5 h-5 md:w-4 md:h-4 text-gray-400" />}
              <span className={!hasProAccess ? "text-gray-400" : ""}>{hasProAccess ? "Set as Avatar" : "Pro Feature: Avatar"}</span>
            </div>
          </button>
          <div className="h-[1px] bg-gray-100 dark:bg-white/5 my-2 md:my-1" />
          <button onClick={(e) => openBurnModal(e, nft)} className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 transition-all">
            <div className="flex items-center gap-4 md:gap-2"><Flame className="w-5 h-5 md:w-4 md:h-4" /><span>Burn</span></div>
          </button>
        </div>
      </>
    );
    if (mounted && window.innerWidth < 768) {
      return createPortal(contentJSX, document.body);
    }
    return contentJSX;
  };

  const hasProAccess = useMemo(() => {
    return firebaseIsPro || isFullVersion || nftsQuery.items.some(nft => nft.collection === 'BCNPASS-40e72d');
  }, [firebaseIsPro, isFullVersion, nftsQuery.items]);

  const maxFolders = hasProAccess ? 50 : 3;

  useEffect(() => {
    if (!isMainTabActive) {
      return;
    }
    if (!nftSentinelRef.current) {
      return;
    }

    const el = nftSentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void nftsQuery.loadMore();
        }
      },
      {
        root: null,
        rootMargin: '1000px 0px'
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [isMainTabActive, nftsQuery]);









  const handleDownload = (e: React.MouseEvent, imageUrl: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Close menu immediately for instant feedback
    setOpenMenuId(null);

    if (!imageUrl) return;

    // Detect if cross-origin.
    // NFT images on multiversx.com or IPFS gateways usually don't allow CORS blob fetches.
    // For these, we MUST call window.open synchronously to preserve the user gesture.
    const isCrossOrigin = imageUrl.includes('http') && !imageUrl.includes(window.location.host);

    if (isCrossOrigin) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const startDownload = async () => {
      try {
        const response = await fetch(imageUrl, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${name.replace(/\s+/g, '_') || 'nft'}.png`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 1000);
          return;
        }
      } catch (err) {
        console.warn('Blob download failed, falling back to window.open', err);
      }
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    };

    void startDownload();
  };

  const handleCollectionClick = (collectionId: string) => {
    setActiveCollectionId(collectionId);
    setCollectionFloorPrice(null);
    setCollectionDetails(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetch(`https://api.oox.art/collections/${collectionId}/auction/stats`)
      .then(res => res.json())
      .then((data: { minPrice?: string; activeAuctions?: number }) => {
        if (data.minPrice && data.activeAuctions && data.activeAuctions > 0) {
          const floor = new BigNumber(data.minPrice).dividedBy(new BigNumber(10).pow(18));
          setCollectionFloorPrice(floor.toFixed(floor.lt(1) ? 4 : 2));
        } else {
          setCollectionFloorPrice(null);
        }
      })
      .catch(() => setCollectionFloorPrice(null));

    fetch(`${network.apiAddress}/collections/${collectionId}`)
      .then(res => res.json())
      .then((data: any) => {
        setCollectionDetails({
          description: data?.assets?.description,
          holderCount: data?.holderCount,
          nftCount: data?.nftCount
        });
      })
      .catch(() => setCollectionDetails(null));
  };

  const handleNftClick = (index: number, nft: NormalizedNft) => {
    if (isLongPressActive.current) {
      isLongPressActive.current = false;
      return;
    }
    if (isSelectionMode) {
      toggleSelection(nft);
      return;
    }
    setSelectedItem({
      id: index,
      tab: 'NFTs',
      identifier: nft.identifier,
      collection: nft.collection,
      imageUrl: nft.imageUrl || `https://picsum.photos/seed/NFTs-${index}/1200/1200`,
      originalImageUrl: nft.originalImageUrl,
      thumbnailUrl: nft.thumbnailUrl,
      mimeType: nft.mimeType,
      name: nft.name,
      type: nft.type,
      balance: nft.balance,
      attributes: nft.metadata?.attributes as { trait_type: string; value: string }[] || [],
      description: nft.metadata?.description || '',
      tags: ['MultiversX'],
      floorPrice: '—'
    });
  };

  const handleFolderClick = (folder: UserFolder) => {
    setActiveFolder(folder);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toggleMenu = (e: React.MouseEvent, id: number) => { e.stopPropagation(); setOpenMenuId(openMenuId === id ? null : id); };
  const toggleFolderMenu = (e: React.MouseEvent, id: string | number) => { e.stopPropagation(); setOpenFolderMenuId(openFolderMenuId === id ? null : id); };
  const closeCollection = () => setActiveCollectionId(null);


  const renderCollectibles = () => {
    const searchLower = searchQuery.toLowerCase();
    const allItems = nftsQuery.items.filter(item => {
      const matchesSearch = !searchQuery ||
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.collection && item.collection.toLowerCase().includes(searchLower));

      const isOfficialLicense = item.collection === 'BCNPASS-40e72d';

      return matchesSearch && !isOfficialLicense;
    });

    // Grouping logic used by Overview and Collections
    const collectionsMap = new Map<string, NormalizedNft[]>();
    for (const item of allItems) {
      const list = collectionsMap.get(item.collection) || [];
      list.push(item);
      collectionsMap.set(item.collection, list);
    }

    const displayFolders: { type: 'folder'; id: string; name: string; items: NormalizedNft[] }[] = [];

    for (const [id, list] of collectionsMap.entries()) {
      displayFolders.push({ type: 'folder', id, name: list[0].collectionName, items: list });
    }

    // If viewing a specific collection
    if (activeCollectionId) {
      const collectionItems = collectionsMap.get(activeCollectionId) || [];
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center space-x-4">
            <button
              onClick={closeCollection}
              className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-orange-500/10 hover:text-orange-500 transition-all border border-transparent dark:border-white/5 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h2 className="text-2xl font-black dark:text-white text-gray-900">
                {collectionItems[0]?.collectionName || 'Collection'}
              </h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                {collectionItems.length} assets
              </p>
            </div>
            {collectionFloorPrice && (
              <a
                href={`https://oox.art/marketplace/collections/${activeCollectionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-2 cursor-pointer hover:bg-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all group"
              >
                <Zap className="w-3.5 h-3.5 text-orange-500 group-hover:rotate-12 transition-transform" />
                <div>
                  <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest leading-none mb-0.5 mt-0.5">Floor</p>
                  <p className="text-sm font-black text-orange-500 leading-tight">{collectionFloorPrice} EGLD</p>
                </div>
              </a>
            )}
          </div>

          {collectionDetails && (
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-6 space-y-4">
              {collectionDetails.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                  {collectionDetails.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-6">
                {collectionDetails.nftCount && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <LayoutGrid className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Items</p>
                      <p className="text-sm font-black dark:text-white">{collectionDetails.nftCount.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {collectionDetails.holderCount && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <Users className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Holders</p>
                      <p className="text-sm font-black dark:text-white">{collectionDetails.holderCount.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`grid ${isLargeGrid ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-6`}>
            {collectionItems.map((nft, i) => (
              <div
                key={nft.identifier}
                onClick={() => handleNftClick(i, nft)}
                onMouseDown={() => startLongPress(nft)}
                onMouseUp={clearLongPress}
                onMouseLeave={clearLongPress}
                onTouchStart={(e) => startLongPress(nft, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={clearLongPress}
                className={`nft-card group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}
              >
                <div className="aspect-square bg-transparent dark:bg-zinc-800/50 overflow-hidden relative">
                  {selectedNfts.some(n => n.identifier === nft.identifier) && (
                    <div className="absolute bottom-3 right-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                      <Zap className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                  {nft.type === 'SFT' && parseInt(nft.balance || '1') > 1 && (
                    <div className="absolute top-3 right-3 z-30 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                      {nft.balance} Assets
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                    <button
                      onClick={(e) => toggleFavorite(e, nft)}
                      className={`p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                    >
                      <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <NftMedia
                    src={nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/400/400`}
                    alt={nft.name}
                    mimeType={nft.mimeType}
                    thumbnailFallback={nft.thumbnailUrl || undefined}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-4 md:p-5 flex items-start justify-between gap-2 overflow-visible relative">
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                      {nft.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                      {nft.collectionName}
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => toggleMenu(e, i)}
                      className={`shrink-0 p-2 md:p-2.5 rounded-full transition-all active:scale-90 ${openMenuId === i ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10'}`}
                    >
                      <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                    </button>
                    {renderContextMenu(i, nft)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // === SFTs Tab ===
    if (activeTab === 'SFTs') {
      const sftItems = allItems.filter(nft => nft.type === 'SFT');
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!walletAddress && (
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              Login required to load SFTs
            </div>
          )}
          {sftItems.length === 0 && walletAddress && (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10">
              <Zap className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">No SFTs found in your wallet</p>
            </div>
          )}

          <div className={`grid ${isLargeGrid ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-6`}>
            {sftItems.map((nft, i) => {
              const imageUrl = nft.imageUrl || `https://picsum.photos/seed/SFTs-${i}/400/400`;
              return (
                <div
                  key={nft.identifier}
                  onClick={() => handleNftClick(i, nft)}
                  onMouseDown={() => startLongPress(nft)}
                  onMouseUp={clearLongPress}
                  onMouseLeave={clearLongPress}
                  onTouchStart={(e) => startLongPress(nft, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={clearLongPress}
                  className={`nft-card group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}
                >
                  <div className="aspect-square bg-transparent dark:bg-zinc-800/50 overflow-hidden relative">
                    {selectedNfts.some(n => n.identifier === nft.identifier) && (
                      <div className="absolute bottom-3 right-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                        <Zap className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                    {nft.type === 'SFT' && parseInt(nft.balance || '1') > 1 && (
                      <div className="absolute top-3 right-3 z-30 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                        {nft.balance} Assets
                      </div>
                    )}
                    <NftMedia
                      src={imageUrl}
                      alt={nft.name}
                      mimeType={nft.mimeType}
                      thumbnailFallback={nft.thumbnailUrl || undefined}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />

                    <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                      <button
                        onClick={(e) => toggleFavorite(e, nft)}
                        className={`p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                      >
                        <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 md:p-5 flex items-start justify-between gap-2 overflow-visible relative">
                    <div className="overflow-hidden">
                      <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                        {nft.name}
                      </h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                        {nft.collectionName}
                      </p>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => toggleMenu(e, i)}
                        className={`shrink-0 p-2 md:p-2.5 rounded-full transition-all active:scale-90 ${openMenuId === i ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10'}`}
                      >
                        <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                      </button>
                      {renderContextMenu(i, nft)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={nftSentinelRef} className="h-1" />
        </div>
      );
    }

    // === Collections Tab ===
    if (activeTab === 'Collections') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!walletAddress && (
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              Login required to load collections
            </div>
          )}
          {displayFolders.length === 0 && walletAddress && (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10">
              <Folder className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">No collections found</p>
            </div>
          )}
          <div className={`grid ${isLargeGrid ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-6`}>
            {displayFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => handleCollectionClick(folder.id)}
                className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 transition-all hover:shadow-2xl hover:shadow-orange-500/10"
              >
                <div className="aspect-square bg-transparent dark:bg-zinc-800/30 overflow-hidden relative p-2 md:p-4">
                  {folder.items.slice(0, 3).reverse().map((nft, idx, arr) => {
                    const isTop = idx === arr.length - 1;
                    const rotation = isTop ? 'rotate-0' : idx === 0 ? '-rotate-6' : 'rotate-6';
                    const scale = isTop ? 'scale-100' : idx === 0 ? 'scale-90' : 'scale-95';
                    const zIndex = isTop ? 'z-20' : idx === 0 ? 'z-0' : 'z-10';
                    const opacity = isTop ? 'opacity-100' : 'opacity-40 group-hover:opacity-60';
                    return (
                      <div key={idx} className={`absolute inset-2 rounded-[1.5rem] overflow-hidden transition-all duration-500 shadow-2xl ${rotation} ${scale} ${zIndex} ${opacity}`}>
                        <NftMedia
                          src={nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/200/200`}
                          alt="preview"
                          mimeType={nft.mimeType}
                          thumbnailFallback={nft.thumbnailUrl || undefined}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {isTop && (
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Folder className="w-10 h-10 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {folder.items.length > 1 && (
                    <div className="absolute top-3 right-3 z-30 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a]">
                      {folder.items.length} Assets
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4 pt-2">
                  <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                    {folder.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
          <div ref={nftSentinelRef} className="h-1" />
        </div>
      );
    }

    // === User Folder Tab ===
    const isUserFolderTab = !['Overview', 'SFTs', 'Collections'].includes(activeTab);
    if (isUserFolderTab) {
      const folderNfts = activeTab === 'favorites' ? firebaseFavorites : firebaseFolderContents[activeTab] || [];
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {folderNfts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10">
              <Folder className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">This folder is empty. Move items here!</p>
            </div>
          ) : (
            <div className={`grid ${isLargeGrid ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-6`}>
              {folderNfts.map((nft, i) => {
                const imageUrl = nft.imageUrl || `https://picsum.photos/seed/UserFolder-${i}/400/400`;
                return (
                  <div
                    key={nft.identifier}
                    onClick={() => handleNftClick(i, nft)}
                    onMouseDown={() => startLongPress(nft)}
                    onMouseUp={clearLongPress}
                    onMouseLeave={clearLongPress}
                    onTouchStart={(e) => startLongPress(nft, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={clearLongPress}
                    className={`nft-card group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}
                  >
                    <div className="aspect-square bg-transparent dark:bg-zinc-800/50 overflow-hidden relative">
                      {selectedNfts.some(n => n.identifier === nft.identifier) && (
                        <div className="absolute bottom-3 right-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                          <Zap className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                      {nft.type === 'SFT' && parseInt(nft.balance || '1') > 1 && (
                        <div className="absolute top-3 right-3 z-30 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                          {nft.balance} Assets
                        </div>
                      )}
                      <NftMedia
                        src={imageUrl}
                        alt={nft.name}
                        mimeType={nft.mimeType}
                        thumbnailFallback={nft.thumbnailUrl || undefined}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />

                      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                        <button
                          onClick={(e) => toggleFavorite(e, nft)}
                          className={`p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                        >
                          <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 md:p-5 flex items-start justify-between gap-2 overflow-visible relative">
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                          {nft.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                          {nft.collectionName}
                        </p>
                      </div>
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => toggleMenu(e, i)}
                          className={`shrink-0 p-2 md:p-2.5 rounded-full transition-all active:scale-90 ${openMenuId === i ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10'}`}
                        >
                          <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                        </button>
                        {renderContextMenu(i, nft)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // === Overview Tab (default) ===
    // Final list: all individual items, no more collection grouping
    const finalItems = allItems.map(nft => ({ type: 'nft' as const, data: nft }));

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {!walletAddress && (
          <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            Login required to load NFTs
          </div>
        )}

        <div ref={nftGridRef} className={`grid ${isLargeGrid ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-6`}>

          {finalItems.map((item, i) => {
            const nft = item.data;
            const imageUrl = nft.imageUrl || `https://picsum.photos/seed/NFTs-${i}/400/400`;
            return (
              <div
                key={nft.identifier}
                onClick={() => handleNftClick(i, nft)}
                onMouseDown={() => startLongPress(nft)}
                onMouseUp={clearLongPress}
                onMouseLeave={clearLongPress}
                onTouchStart={(e) => startLongPress(nft, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={clearLongPress}
                className={`nft-card group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}
              >
                <div className="aspect-square bg-transparent dark:bg-zinc-800/50 overflow-hidden relative">
                  {selectedNfts.some(n => n.identifier === nft.identifier) && (
                    <div className="absolute bottom-3 right-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                      <Zap className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                  {nft.type === 'SFT' && parseInt(nft.balance || '1') > 1 && (
                    <div className="absolute top-3 right-3 z-30 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                      {nft.balance} Assets
                    </div>
                  )}
                  <NftMedia
                    src={imageUrl}
                    alt={nft.name}
                    mimeType={nft.mimeType}
                    thumbnailFallback={nft.thumbnailUrl || undefined}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />

                  <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                    <button
                      onClick={(e) => toggleFavorite(e, nft)}
                      className={`p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                    >
                      <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="p-4 md:p-5 flex items-start justify-between gap-2 overflow-visible relative">
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                      {nft.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                      {nft.collectionName}
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => toggleMenu(e, i)}
                      className={`shrink-0 p-2 md:p-2.5 rounded-full transition-all active:scale-90 ${openMenuId === i ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10'}`}
                    >
                      <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                    </button>
                    {renderContextMenu(i, nft)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={nftSentinelRef} className="h-1" />

        {nftsQuery.error && (
          <div className="text-center text-[10px] font-black uppercase tracking-widest text-red-500">
            {nftsQuery.error}
          </div>
        )}
      </div>
    );
  };

  const renderManagementView = () => {
    const searchLower = searchQuery.toLowerCase();

    if (activeFolder) {
      if (activeFolder.id === "favorites") {
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => setActiveFolder(null)} className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-orange-500/10 hover:text-orange-500 transition-all border border-transparent dark:border-white/5 group"><ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /></button>
                <div>
                  <h2 className="text-2xl font-black dark:text-white text-gray-900">{activeFolder.name}</h2>
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{activeFolder.itemCount} items favorited</p>
                    {activeFolder.description && (
                      <p className="text-xs text-gray-400 font-medium italic">{activeFolder.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {firebaseFavorites.filter(item => !searchQuery || (item.name && item.name.toLowerCase().includes(searchLower)) || (item.collection && item.collection.toLowerCase().includes(searchLower))).length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10">
                <Heart className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-500">No favorites yet. Start hearting your NFTs!</p>
              </div>
            ) : (
              <div className={`grid ${isLargeGrid ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-6`}>
                {firebaseFavorites.filter(item => !searchQuery || (item.name && item.name.toLowerCase().includes(searchLower)) || (item.collection && item.collection.toLowerCase().includes(searchLower))).map((nft, i) => (
                  <div key={nft.identifier} onClick={() => handleNftClick(i, nft)}
                    onMouseDown={() => startLongPress(nft)}
                    onMouseUp={clearLongPress}
                    onMouseLeave={clearLongPress}
                    onTouchStart={(e) => startLongPress(nft, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={clearLongPress}
                    className={`nft-card group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}>
                    <div className="aspect-square bg-gray-100 dark:bg-zinc-800/50 overflow-hidden relative">
                      {selectedNfts.some(n => n.identifier === nft.identifier) && (
                        <div className="absolute bottom-3 right-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                          <Zap className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                      {nft.type === 'SFT' && parseInt(nft.balance || '1') > 1 && (
                        <div className="absolute top-3 right-3 z-30 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                          {nft.balance} Assets
                        </div>
                      )}
                      <NftMedia
                        src={nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/400/400`}
                        alt={nft.name}
                        mimeType={nft.mimeType}
                        thumbnailFallback={nft.thumbnailUrl || undefined}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      <div className="absolute top-3 left-3 z-30">
                        <button
                          onClick={(e) => toggleFavorite(e, nft)}
                          className="p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg bg-orange-500 text-white"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 md:p-5 flex items-start justify-between gap-2 overflow-visible relative">
                      <div className="overflow-hidden flex-grow">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">{nft.name}</h3>
                          <div className="relative shrink-0">
                            <button
                              onClick={(e) => toggleMenu(e, i)}
                              className={`shrink-0 p-2 md:p-2.5 rounded-full transition-all active:scale-90 ${openMenuId === i ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10'}`}
                            >
                              <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                            </button>
                            {renderContextMenu(i, nft)}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">{nft.collectionName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => setActiveFolder(null)} className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-orange-500/10 hover:text-orange-500 transition-all border border-transparent dark:border-white/5 group"><ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /></button>
              <div>
                <h2 className="text-2xl font-black text-orange-500">{activeFolder.name}</h2>
                <div className="flex flex-col space-y-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{activeFolder.itemCount} items curated</p>
                  {activeFolder.description && (
                    <p className="text-xs text-gray-400 font-medium italic">{activeFolder.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className={`grid ${isLargeGrid ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-6`}>
            {(firebaseFolderContents[activeFolder.id] || []).filter(item => !searchQuery || (item.name && item.name.toLowerCase().includes(searchLower)) || (item.collection && item.collection.toLowerCase().includes(searchLower))).length === 0 ? (
              <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10">
                <Folder className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-500">{searchQuery ? 'No items match your search.' : 'Folder is empty. Move items here!'}</p>
              </div>
            ) : (
              (firebaseFolderContents[activeFolder.id] || []).filter(item => !searchQuery || (item.name && item.name.toLowerCase().includes(searchLower)) || (item.collection && item.collection.toLowerCase().includes(searchLower))).map((nft, i) => (
                <div key={nft.identifier} onClick={() => handleNftClick(i, nft)}
                  onMouseDown={() => startLongPress(nft)}
                  onMouseUp={clearLongPress}
                  onMouseLeave={clearLongPress}
                  onTouchStart={(e) => startLongPress(nft, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={clearLongPress}
                  className={`nft-card group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}>
                  <div className="aspect-square bg-gray-100 dark:bg-zinc-800/50 overflow-hidden relative">
                    {selectedNfts.some(n => n.identifier === nft.identifier) && (
                      <div className="absolute bottom-3 right-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                        <Zap className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                    {nft.type === 'SFT' && parseInt(nft.balance || '1') > 1 && (
                      <div className="absolute top-3 right-3 z-30 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                        {nft.balance} Assets
                      </div>
                    )}
                    <NftMedia
                      src={nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/400/400`}
                      alt={nft.name}
                      mimeType={nft.mimeType}
                      thumbnailFallback={nft.thumbnailUrl || undefined}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                      <button
                        onClick={(e) => toggleFavorite(e, nft)}
                        className={`p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                      >
                        <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 md:p-5 flex items-start justify-between gap-2 overflow-visible relative">
                    <div className="overflow-hidden">
                      <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">{nft.name}</h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">{nft.collectionName}</p>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => toggleMenu(e, i)}
                        className={`shrink-0 p-2 md:p-2.5 rounded-full transition-all active:scale-90 ${openMenuId === i ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10'}`}
                      >
                        <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                      </button>
                      {renderContextMenu(i, nft)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => {
              if (firebaseFolders.length >= maxFolders) {
                alert(`You've reached the limit of ${maxFolders} folders!${!hasProAccess ? ' Get a Bacon PASS license to unlock up to 50 folders.' : ''}`);
                return;
              }
              setIsCreateModalOpen(true);
            }}
            className={`group relative p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-gray-50 dark:bg-[#0a0a0a]/20 border-2 border-dashed flex flex-col items-center justify-center space-y-3 md:space-y-4 transition-all h-full min-h-[220px] md:min-h-[280px] ${firebaseFolders.length >= maxFolders ? 'border-gray-300 dark:border-white/5 opacity-60 cursor-not-allowed' : 'border-gray-200 dark:border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5'}`}
          >
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-lg transition-all ${firebaseFolders.length >= maxFolders ? '' : 'group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white'}`}>
              {firebaseFolders.length >= maxFolders ? <Lock className="w-6 h-6 md:w-8 md:h-8 text-gray-400" /> : <Plus className="w-6 h-6 md:w-8 md:h-8" />}
            </div>
            <div className="text-center px-2">
              <p className="text-xs md:text-sm font-black dark:text-white">{firebaseFolders.length >= maxFolders ? 'Folder Limit Reached' : 'Create New Folder'}</p>
              <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight mt-1">{firebaseFolders.length >= maxFolders ? `Limit: ${maxFolders} folders` : 'Organize your collection'}</p>
            </div>
          </button>

          {dynamicUserFolders.filter(folder => !searchQuery || folder.name.toLowerCase().includes(searchLower)).map((folder) => (
            <div
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              className="group relative cursor-pointer p-0 pb-3 md:p-0 md:pb-4 rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 transition-all flex flex-col hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.98]"
            >


              <div className="aspect-square bg-gray-50/50 dark:bg-zinc-800/20 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative p-2 md:p-4 mb-3 md:mb-4">
                {folder.previewImages.length > 0 ? (
                  folder.previewImages.slice(0, 3).reverse().map((img, idx, arr) => {
                    const isTop = idx === arr.length - 1;
                    const rotation = isTop ? 'rotate-0' : idx === 0 ? '-rotate-6' : 'rotate-6';
                    const scale = isTop ? 'scale-100' : idx === 0 ? 'scale-90' : 'scale-95';
                    const zIndex = isTop ? 'z-20' : idx === 0 ? 'z-0' : 'z-10';
                    const opacity = isTop ? 'opacity-100' : 'opacity-40 group-hover:opacity-60';

                    return (
                      <div key={idx} className={`absolute inset-2 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden transition-all duration-500 shadow-2xl ${rotation} ${scale} ${zIndex} ${opacity}`}>
                        <NftMedia
                          src={img.startsWith('http') ? img : `https://picsum.photos/seed/${img}/200/200`}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="absolute inset-2 rounded-[1.5rem] md:rounded-[2rem] bg-gray-100/50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center">
                    <Folder className="w-6 h-6 md:w-8 md:h-8 text-gray-300 dark:text-white/20" />
                  </div>
                )}
                {folder.itemCount > 0 && (
                  <div className="absolute top-3 right-3 z-30 bg-orange-500 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a]">
                    {folder.itemCount} Items
                  </div>
                )}

                {folder.id !== 'favorites' && (
                  <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 z-30">
                    <button
                      onClick={(e) => toggleFolderMenu(e, folder.id)}
                      className={`p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${openFolderMenuId === folder.id ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                    >
                      <Settings className={`w-4 h-4 transition-transform duration-500 ${openFolderMenuId === folder.id ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                    </button>

                    {openFolderMenuId === folder.id && (
                      mounted && window.innerWidth < 768 ? createPortal(
                        <>
                          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setOpenFolderMenuId(null); }} />
                          <div ref={folderMenuRef} onClick={(e) => e.stopPropagation()} className="fixed md:absolute bottom-0 md:top-10 left-0 right-0 md:left-auto md:right-0 z-[70] w-full md:w-40 bg-white dark:bg-[#252525] rounded-t-[2rem] md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl border-t md:border border-gray-100 dark:border-white/10 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:p-1.5 animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
                            <button onClick={(e) => handleShareFolder(e, folder)} className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all">
                              <div className="flex items-center gap-4 md:gap-2"><Share2 className="w-5 h-5 md:w-4 md:h-4 text-blue-500" /><span>Share</span></div>
                            </button>
                            <div className="h-[1px] bg-gray-100 dark:bg-white/5 my-2 md:my-1" />
                            <button onClick={(e) => handleDeleteFolder(e, folder.id)} className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 transition-all">
                              <div className="flex items-center gap-4 md:gap-2"><Trash2 className="w-5 h-5 md:w-3.5 md:h-3.5" /><span>Delete</span></div>
                            </button>
                          </div>
                        </>,
                        document.body
                      ) : (
                        <div ref={folderMenuRef} onClick={(e) => e.stopPropagation()} className="absolute bottom-12 right-0 z-50 w-40 bg-white dark:bg-[#252525] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-1.5 animate-in zoom-in-95 duration-200">
                          <button onClick={(e) => handleShareFolder(e, folder)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all">
                            <div className="flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-500" /><span>Share</span></div>
                          </button>
                          <div className="h-[1px] bg-gray-100 dark:bg-white/5 my-1" />
                          <button onClick={(e) => handleDeleteFolder(e, folder.id)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 transition-all">
                            <div className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /><span>Delete</span></div>
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col mt-auto w-full px-4 md:px-5">
                <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                  <div className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    {folder.id === 'favorites' ? <Heart className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Folder className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                  </div>
                  <h3 className="text-[13px] md:text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                    {folder.name}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-[#0c0c0e]">

      {/* Header Section */}
      <div className="bg-gray-50/90 dark:bg-[#0c0c0e]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 pt-6 pb-4 w-full px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-5 md:gap-6">

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center h-7 px-4 bg-orange-500/10 border border-orange-500/20 rounded-full">
              <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] pl-[0.2em] mb-[1px] leading-none">Asset Hub</span>
            </div>
          </div>

          <div className="relative flex items-center p-1 bg-white dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/10 shadow-lg backdrop-blur-xl">
            {/* Sliding pill */}
            <div
              className="absolute top-1 bottom-1 rounded-full bg-orange-500 shadow-lg shadow-orange-500/20 transition-all duration-300 ease-out"
              style={{
                width: 'calc(50% - 4px)',
                left: viewMode === 'Collectibles' ? '4px' : 'calc(50%)',
              }}
            />
            <button
              onClick={() => {
                setViewMode('Collectibles');
                setActiveTab('Overview');
                setActiveCollectionId(null);
                setSearchQuery('');
              }}
              className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-colors duration-300 ${viewMode === 'Collectibles' ? 'text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Collectibles</span>
            </button>
            <button
              onClick={() => {
                setViewMode('Management');
                setActiveFolder(null);
                setSearchQuery('');
              }}
              className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-colors duration-300 ${viewMode === 'Management' ? 'text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Management</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-full text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all dark:text-white shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative flex items-center p-1 bg-white dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/10 shadow-sm shrink-0">
              {/* Sliding pill */}
              <div
                className="absolute top-1 bottom-1 rounded-full bg-orange-500 shadow-md shadow-orange-500/20 transition-all duration-300 ease-out"
                style={{
                  width: 'calc(50% - 4px)',
                  left: !isLargeGrid ? '4px' : 'calc(50%)',
                }}
              />
              <button
                onClick={() => setIsLargeGrid(false)}
                className={`relative z-10 p-2 rounded-full transition-colors duration-300 ${!isLargeGrid ? 'text-white' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsLargeGrid(true)}
                className={`relative z-10 p-2 rounded-full transition-colors duration-300 ${isLargeGrid ? 'text-white' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Tabs */}
          {viewMode === 'Collectibles' && (
            <div className="relative flex items-center justify-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide no-scrollbar w-full px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[tab.id] = el; }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActiveCollectionId(null);
                  }}
                  className="relative pb-2 group whitespace-nowrap"
                >
                  <span className={`text-sm font-black transition-colors ${activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'}`}>
                    {tab.label}
                  </span>
                </button>
              ))}
              {/* Sliding underline */}
              <div
                className="absolute bottom-0 h-1 bg-orange-500 rounded-full transition-all duration-300 ease-out"
                style={tabIndicatorStyle}
              />
            </div>
          )}

        </div>
      </div>

      {/* Main Dynamic Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
        {viewMode === 'Collectibles' ? (
          <div className="space-y-10">
            {renderCollectibles()}
          </div>
        ) : (
          renderManagementView()
        )}
      </div>

      {/* NFT Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-10 animate-in fade-in duration-400 overscroll-contain" style={{ touchAction: 'none' }}>
          <div className="absolute inset-0 bg-black/80 md:bg-black/90 backdrop-blur-md md:backdrop-blur-3xl" onClick={() => setSelectedItem(null)}></div>

          <div className="relative w-full max-w-5xl bg-white dark:bg-[#121212] rounded-t-[2.5rem] md:rounded-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] md:shadow-[0_0_100px_rgba(249,115,22,0.15)] overflow-hidden border-t md:border border-gray-100 dark:border-white/10 animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-10 duration-500 flex flex-col md:flex-row h-[100dvh] md:h-[75vh] max-h-[100dvh]" style={{ touchAction: 'auto' }}>

            {/* Mobile Drag Indicator */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full md:hidden z-50 pointer-events-none"></div>

            {/* Close Button Mobile */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-50 p-2.5 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-orange-500 transition-all md:hidden active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Large Image Preview */}
            <div className="w-full md:w-[45%] shrink-0 h-[45%] sm:h-[50%] md:h-full relative group bg-white dark:bg-[#080808] flex items-center justify-center p-0 md:p-8">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative z-0 w-full h-full flex items-center justify-center">
                <NftMedia
                  src={selectedItem.originalImageUrl || selectedItem.imageUrl}
                  alt={selectedItem.name || ''}
                  mimeType={selectedItem.mimeType}
                  thumbnailFallback={selectedItem.thumbnailUrl || undefined}
                  className="max-w-full max-h-full w-auto h-auto object-contain xl:object-cover rounded-xl md:rounded-[2rem] drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-10 left-10 right-10 z-20 hidden md:block opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                <h2 className="text-2xl font-black text-white drop-shadow-2xl">{selectedItem.name}</h2>
                <p className="text-orange-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 drop-shadow-lg">{selectedItem.collection}</p>
              </div>
            </div>

            {/* Right Side: Details & Actions */}
            <div className="w-full md:w-[55%] flex-1 md:h-full flex flex-col bg-white dark:bg-[#121212] overflow-hidden">

              {/* Fixed Header & Description */}
              <div className="shrink-0 p-6 pb-2 md:p-10 md:pb-4 space-y-6 md:space-y-8 bg-white dark:bg-[#121212] z-10 border-b border-gray-100 dark:border-white/5">
                {/* Header Info */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h1 className="text-[23px] md:text-[29px] font-black text-gray-900 dark:text-white leading-tight">
                        {selectedItem.name}
                      </h1>
                      <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm shrink-0">
                        {selectedItem.type || 'NFT'}
                      </span>
                      {selectedItem.type === 'SFT' && parseInt(selectedItem.balance || '1') > 1 && (
                        <span className="px-2.5 py-1 bg-orange-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm shrink-0">
                          {selectedItem.balance} Assets
                        </span>
                      )}
                      {selectedItem.collection === 'BCNPASS-40e72d' && (
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm shrink-0">
                          Premium
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer group/id" onClick={() => {
                      navigator.clipboard.writeText(selectedItem.identifier || '');
                      alert('Identifier copied!');
                    }}>
                      <p className="text-[10px] text-gray-400 font-bold group-hover/id:text-orange-500 transition-colors">
                        ID: {selectedItem.identifier?.slice(0, 16)}...
                      </p>
                      <Share2 className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 transition-all hidden md:block"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-10 pt-4 md:pt-6 space-y-8 md:space-y-10">
                {/* Main Stats Card */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 group hover:border-orange-500/30 transition-all relative overflow-hidden">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5 z-10 text-nowrap">Collection</p>
                    <p className="text-xs font-black dark:text-white truncate z-10">{selectedItem.collection}</p>
                    <Folder className="absolute -right-1.5 -bottom-1.5 w-8 h-8 text-gray-400/10 group-hover:text-orange-500/10 transition-colors" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 group hover:border-orange-500/30 transition-all relative overflow-hidden">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5 z-10 text-nowrap">Floor Price</p>
                    <p className="text-xs font-black dark:text-white z-10">{itemFloorPrice ?? '...'}</p>
                    <Zap className="absolute -right-1.5 -bottom-1.5 w-8 h-8 text-gray-400/10 group-hover:text-orange-500/10 transition-colors" />
                  </div>
                </div>

                {/* Description */}
                {selectedItem.description && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Description</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 italic">
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                {/* Attributes Grid */}
                {selectedItem.attributes && selectedItem.attributes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Traits & Properties</h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedItem.attributes.map((attr, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-white/5 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all text-center">
                          <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1">{attr.trait_type}</p>
                          <p className="text-[10px] font-black dark:text-white truncate">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transaction History (Activity) */}
                {selectedItem.identifier && (
                  <NftActivityHistory identifier={selectedItem.identifier} />
                )}

                {/* External Links */}
                <div className="flex items-center justify-center gap-8 py-4 border-t border-gray-100 dark:border-white/5">
                  <a href={`https://explorer.multiversx.com/nfts/${selectedItem.identifier}`} target="_blank" className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-500 transition-colors flex items-center gap-1.5">
                    Explorer <Share2 className="w-3 h-3" />
                  </a>
                  <a href={`https://oox.art/marketplace/nfts/${selectedItem.identifier}`} target="_blank" className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-500 transition-colors flex items-center gap-1.5">
                    OOX Marketplace <DollarSign className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Action Footer */}
              <div className="shrink-0 px-4 py-3 pb-[calc(12px+env(safe-area-bottom))] md:px-6 md:py-4 bg-white dark:bg-[#121212] border-t border-gray-100 dark:border-white/10 flex items-center justify-center gap-2 overflow-visible flex-wrap">
                <button
                  onClick={(e) => {
                    setSelectedItem(null);
                    setTimeout(() => openBurnModal(e, {
                      identifier: selectedItem.identifier!,
                      name: selectedItem.name!,
                      collection: selectedItem.collection!,
                      collectionName: selectedItem.collection!,
                      imageUrl: selectedItem.imageUrl,
                      originalImageUrl: selectedItem.originalImageUrl || null,
                      thumbnailUrl: selectedItem.thumbnailUrl || null,
                      type: selectedItem.type!,
                      balance: selectedItem.balance
                    }), 100);
                  }}
                  className="group relative flex-[1_0_auto] min-w-[70px] h-[44px] bg-red-500/10 dark:bg-red-500/15 text-red-500 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 hover:bg-red-500 hover:text-white active:scale-95 transition-all"
                >
                  <Flame className="w-4 h-4" />
                  <span className="hidden md:inline">Burn</span>
                  <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-lg pointer-events-none whitespace-nowrap shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-[300]">
                    Burn Asset
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 dark:bg-white rotate-45" />
                  </div>
                </button>

                <button
                  onClick={(e) => handleDownload(e, selectedItem.imageUrl, selectedItem.name || 'nft')}
                  className="group relative flex-[1_0_auto] min-w-[70px] h-[44px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 hover:bg-gray-700 hover:text-white dark:hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">Save</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-lg pointer-events-none whitespace-nowrap shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-[300]">
                    Save Image
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-white rotate-45" />
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    setSelectedItem(null);
                    setTimeout(() => openSendModal(e, {
                      identifier: selectedItem.identifier!,
                      name: selectedItem.name!,
                      collection: selectedItem.collection!,
                      collectionName: selectedItem.collection!,
                      imageUrl: selectedItem.imageUrl,
                      originalImageUrl: selectedItem.originalImageUrl || null,
                      thumbnailUrl: selectedItem.thumbnailUrl || null,
                      type: selectedItem.type!,
                      balance: selectedItem.balance
                    }), 100);
                  }}
                  className="group relative flex-[1_0_auto] min-w-[70px] h-[44px] bg-blue-500/10 dark:bg-blue-500/15 text-blue-500 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 hover:bg-blue-500 hover:text-white active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden md:inline">Send</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-lg pointer-events-none whitespace-nowrap shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-[300]">
                    Send Asset
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-white rotate-45" />
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    setSelectedItem(null);
                    setTimeout(() => openSellModal(e, {
                      identifier: selectedItem.identifier!,
                      name: selectedItem.name!,
                      collection: selectedItem.collection!,
                      collectionName: selectedItem.collection!,
                      imageUrl: selectedItem.imageUrl,
                      originalImageUrl: selectedItem.originalImageUrl || null,
                      thumbnailUrl: selectedItem.thumbnailUrl || null,
                      type: selectedItem.type!,
                      balance: selectedItem.balance
                    }), 100);
                  }}
                  className="group relative flex-[1_0_auto] min-w-[70px] h-[44px] bg-orange-500/10 dark:bg-orange-500/15 text-orange-500 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 hover:bg-orange-500 hover:text-white active:scale-95 transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden md:inline">List</span>
                  <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-lg pointer-events-none whitespace-nowrap shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-[300]">
                    List on OOX
                    <div className="absolute -bottom-1 right-4 w-2 h-2 bg-gray-900 dark:bg-white rotate-45" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Asset Send Modal */}
      <AssetSendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        nftToSend={nftToSend}
        recipient={recipient}
        setRecipient={setRecipient}
        sendQuantity={sendQuantity}
        setSendQuantity={setSendQuantity}
        onSend={handleSendNft}
      />

      {/* Sell Modal */}
      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        nftToSell={nftToSell}
        sellPrice={sellPrice}
        setSellPrice={setSellPrice}
        sellQuantity={sellQuantity}
        setSellQuantity={setSellQuantity}
        selectedPaymentToken={selectedPaymentToken}
        setSelectedPaymentToken={setSelectedPaymentToken}
        onSell={handleSellNft}
        paymentTokens={OOX_PAYMENT_TOKENS}
      />

      {/* Move Modal */}
      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={() => { setIsMoveModalOpen(false); setNftToMove(null); }}
        firebaseFolders={firebaseFolders}
        maxFolders={maxFolders}
        isSelectionMode={isSelectionMode}
        handleMoveMultipleNfts={handleMoveMultipleNfts}
        handleMoveNft={handleMoveNft}
        setIsCreateModalOpen={setIsCreateModalOpen}
      />

      {/* Selection Floating Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xl animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white/80 dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-4 shadow-2xl flex items-center justify-between shadow-orange-500/10">
            <div className="flex items-center gap-6 px-4">
              <button onClick={cancelSelection} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
              <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
              <div>
                <p className="text-sm font-black dark:text-white">{selectedNfts.length} Selected</p>
                <p className="text-[10px] text-gray-500 dark:text-orange-500 font-bold uppercase tracking-widest">Multi-Select Mode</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setIsMoveModalOpen(true)} className="flex items-center justify-center px-6 md:px-8 h-[44px] md:h-[48px] bg-orange-500 text-white rounded-[1.5rem] font-black text-sm md:text-base hover:scale-105 transition-all shadow-xl shadow-orange-500/20">
                <span>Move</span>
              </button>
              {activeFolder && (
                <button
                  onClick={() => setIsRemoveConfirmationOpen(true)}
                  className="flex items-center justify-center w-[44px] h-[44px] md:w-auto md:h-[48px] md:px-6 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-[1.5rem] font-black text-sm md:text-base hover:scale-105 transition-all shrink-0"
                >
                  <Trash2 className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline">Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      <RemoveConfirmationModal
        isOpen={isRemoveConfirmationOpen}
        onClose={() => setIsRemoveConfirmationOpen(false)}
        selectedCount={selectedNfts.length}
        onConfirm={handleRemoveMultipleNfts}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setNftToMove(null); }}
        folderTitle={folderTitle}
        setFolderTitle={setFolderTitle}
        folderDesc={folderDesc}
        setFolderDesc={setFolderDesc}
        handleCreateFolder={handleCreateFolder}
      />

      {/* Share Folder Modal */}
      <ShareFolderModal
        isOpen={isShareModalOpen}
        onClose={() => { setIsShareModalOpen(false); setFolderToShare(null); }}
        folderToShare={folderToShare}
        accountInfo={accountInfo}
        walletAddress={walletAddress}
        shareLinkCopied={shareLinkCopied}
        setShareLinkCopied={setShareLinkCopied}
      />
      <BurnModal
        isOpen={isBurnModalOpen}
        onClose={() => setIsBurnModalOpen(false)}
        nftToBurn={nftToBurn}
        burnQuantity={burnQuantity}
        setBurnQuantity={setBurnQuantity}
        onConfirmBurn={handleBurnNft}
      />
    </div>
  );
};

export default TabSystem;

