
'use client';

import { createPortal } from 'react-dom';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import {
  X, Folder, Plus, LayoutDashboard,
  DollarSign, Send, Flame, Download, Heart, Settings,
  Zap, ArrowLeft, Lock, Trash2, Share2
} from 'lucide-react';
import { useGetAccountInfo, Transaction, Address, useGetNetworkConfig } from '@/lib';
import { useAccountNfts, useCollectionNfts, signAndSendTransactions, type NormalizedNft } from '@/helpers';
import { useFirebaseFolders } from '@/hooks/useFirebaseFolders';
import { NftMedia } from './NftMedia';
type ViewMode = 'Collectibles' | 'Management';
type TabId = 'NFTs' | 'Chubby' | 'OnionXCards';

const OOX_CONTRACT_ADDRESS = "erd1qqqqqqqqqqqqqpgqwp73w2a9eyzs64eltupuz3y3hv798vlv899qrjnflg";

interface SelectedItem {
  id: number;
  tab: TabId | 'FolderItem';
  imageUrl: string;
  originalImageUrl?: string | null;
  mimeType?: string;
  identifier?: string;
  collection?: string;
  name?: string;
  attributes?: { trait_type: string; value: string }[];
  description?: string;
  tags?: string[];
  floorPrice?: string;
  type?: 'NFT' | 'SFT';
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

const TabSystem: React.FC<TabSystemProps> = ({ isFullVersion }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('Collectibles');
  const [activeTab, setActiveTab] = useState<TabId>('NFTs');
  const [activeFolder, setActiveFolder] = useState<UserFolder | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [selectedNfts, setSelectedNfts] = useState<NormalizedNft[]>([]);
  const { network } = useGetNetworkConfig();
  const accountInfo = useGetAccountInfo();
  const walletAddress = accountInfo?.account?.address;
  const {
    folders: firebaseFolders,
    folderContents: firebaseFolderContents,
    favorites: firebaseFavorites,
    isPro: firebaseIsPro,
    createFolder: fbCreateFolder,
    deleteFolder: fbDeleteFolder,
    addItemToFolder: fbAddItemToFolder,
    toggleFavorite: fbToggleFavorite
  } = useFirebaseFolders(walletAddress);

  const hasProAccess = firebaseIsPro || isFullVersion;
  const maxFolders = hasProAccess ? 100 : 3;

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
  const [selectedPaymentToken, setSelectedPaymentToken] = useState('EGLD');
  const [recipient, setRecipient] = useState('');
  const [sendQuantity, setSendQuantity] = useState('1');
  const [folderTitle, setFolderTitle] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [nftToMove, setNftToMove] = useState<NormalizedNft | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);

  // No longer needed: local localStorage effects removed since we use Firebase real-time sync.

  const handleCreateFolder = async () => {
    if (!folderTitle.trim()) return;

    if (firebaseFolders.length >= maxFolders) {
      alert(`You've reached the limit of ${maxFolders} folders!${!hasProAccess ? ' Get a Bacon PASS license to unlock up to 100 folders.' : ''}`);
      return;
    }

    await fbCreateFolder(folderTitle, folderDesc);
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
    // Simplified sharing logic: copy current URL or a mock share URL
    const mockUrl = `${window.location.origin}/folder/${folder.id}`;
    navigator.clipboard.writeText(mockUrl).then(() => {
      alert('Folder link copied to clipboard!');
    });
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

  const handleSendNft = async () => {
    if (!nftToSend || !recipient || !walletAddress) return;

    try {
      // 1. Resolve recipient address and herotags
      const cleanRecipient = recipient.trim().replace(/^@/, '').replace(/\.elrond$/, '');
      const toHex = (str: string) => Array.from(new TextEncoder().encode(str))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      let recipientAddr: Address;

      if (cleanRecipient.startsWith('erd1') && cleanRecipient.length === 62) {
        try {
          recipientAddr = new Address(cleanRecipient);
        } catch {
          throw new Error('Invalid ERD address format.');
        }
      } else {
        // Resolve herotag
        const response = await fetch(`${network.apiAddress}/usernames/${cleanRecipient}`);
        if (!response.ok) {
          throw new Error(`Herotag "${cleanRecipient}" not found on MultiversX.`);
        }
        const herotagData = await response.json();
        if (!herotagData.address) {
          throw new Error(`Could not resolve address for herotag "${cleanRecipient}".`);
        }
        recipientAddr = new Address(herotagData.address);
      }

      // 2. Prepare NFT Transfer Data
      const lastDashIndex = nftToSend.identifier.lastIndexOf('-');
      if (lastDashIndex === -1) throw new Error("Invalid NFT identifier format.");

      const collection = nftToSend.identifier.substring(0, lastDashIndex);
      let nonceHex = nftToSend.identifier.substring(lastDashIndex + 1);
      if (nonceHex.length % 2 !== 0) nonceHex = '0' + nonceHex;

      const collectionHex = toHex(collection);
      const receiverHex = Array.from(recipientAddr.getPublicKey())
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const qtyHex = BigInt(sendQuantity).toString(16);
      const qtyHexPadded = qtyHex.length % 2 !== 0 ? '0' + qtyHex : qtyHex;

      const txData = `ESDTNFTTransfer@${collectionHex}@${nonceHex}@${qtyHexPadded}@${receiverHex}`;

      // 3. Build Transaction
      const accountNonce = accountInfo?.account?.nonce ?? 0;
      const tx = new Transaction({
        nonce: BigInt(accountNonce),
        value: 0n,
        receiver: new Address(walletAddress),
        sender: new Address(walletAddress),
        gasLimit: 3000000n,
        chainID: network.chainId,
        data: new TextEncoder().encode(txData),
        version: 1
      });

      await signAndSendTransactions({
        transactions: [Transaction.newFromPlainObject(tx.toPlainObject())],
        transactionsDisplayInfo: {
          processingMessage: `Sending ${sendQuantity} edition(s) of ${nftToSend.name}...`,
          errorMessage: 'Failed to send Asset.',
          successMessage: 'Asset sent successfully!'
        }
      });

      // 4. Optimistic UI Updates
      const sentId = nftToSend.identifier;
      const sentAmount = parseInt(sendQuantity);

      const updateList = (prev: NormalizedNft[]) => {
        return prev.map(n => {
          if (n.identifier === sentId) {
            const currentBalance = parseInt(n.balance || '1');
            if (currentBalance > sentAmount) {
              return { ...n, balance: (currentBalance - sentAmount).toString() };
            }
            return null;
          }
          return n;
        }).filter((n): n is NormalizedNft => n !== null);
      };

      nftsQuery.setItems(prev => updateList(prev));
      onionXCardsQuery.setItems(prev => updateList(prev));
      chubbyCollection1Query.setItems(prev => updateList(prev));
      chubbyCollection2Query.setItems(prev => updateList(prev));

      setIsSendModalOpen(false);
      setNftToSend(null);
    } catch (err: unknown) {
      console.error('Failed to send NFT:', err);
      let message = err instanceof Error ? err.message : 'Check if the address or herotag is valid.';
      if (message.includes("invalid signature")) {
        message = "Signature failed. This could be due to a nonce mismatch or wrong network. Please try again or refresh the page.";
      }
      alert(`Error: ${message}`);
    }
  };

  const handleBurnNft = async () => {
    if (!nftToBurn || !walletAddress) return;

    try {
      const toHex = (str: string) => Array.from(new TextEncoder().encode(str))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // 1. Prepare NFT Burn Data
      const lastDashIndex = nftToBurn.identifier.lastIndexOf('-');
      if (lastDashIndex === -1) throw new Error("Invalid NFT identifier format.");

      const collection = nftToBurn.identifier.substring(0, lastDashIndex);
      let nonceHex = nftToBurn.identifier.substring(lastDashIndex + 1);
      if (nonceHex.length % 2 !== 0) nonceHex = '0' + nonceHex;

      const collectionHex = toHex(collection);
      const qtyHex = BigInt(burnQuantity).toString(16);
      const qtyHexPadded = qtyHex.length % 2 !== 0 ? '0' + qtyHex : qtyHex;

      const txData = `ESDTNFTBurn@${collectionHex}@${nonceHex}@${qtyHexPadded}`;

      // 2. Build Transaction
      const accountNonce = accountInfo?.account?.nonce ?? 0;
      const tx = new Transaction({
        nonce: BigInt(accountNonce),
        value: 0n,
        receiver: new Address(walletAddress),
        sender: new Address(walletAddress),
        gasLimit: 10000000n,
        chainID: network.chainId,
        data: new TextEncoder().encode(txData),
        version: 1
      });

      await signAndSendTransactions({
        transactions: [Transaction.newFromPlainObject(tx.toPlainObject())],
        transactionsDisplayInfo: {
          processingMessage: `Burning ${burnQuantity} edition(s) of ${nftToBurn.name}...`,
          errorMessage: 'Failed to burn Asset.',
          successMessage: 'Asset burned successfully!'
        }
      });

      // 3. Optimistic UI Updates
      const burnedId = nftToBurn.identifier;
      const burnedAmount = parseInt(burnQuantity);

      const updateList = (prev: NormalizedNft[]) => {
        return prev.map(n => {
          if (n.identifier === burnedId) {
            const currentBalance = parseInt(n.balance || '1');
            if (currentBalance > burnedAmount) {
              return { ...n, balance: (currentBalance - burnedAmount).toString() };
            }
            return null;
          }
          return n;
        }).filter((n): n is NormalizedNft => n !== null);
      };

      nftsQuery.setItems(prev => updateList(prev));
      onionXCardsQuery.setItems(prev => updateList(prev));
      chubbyCollection1Query.setItems(prev => updateList(prev));
      chubbyCollection2Query.setItems(prev => updateList(prev));

      setIsBurnModalOpen(false);
      setNftToBurn(null);
    } catch (err: unknown) {
      console.error('Failed to burn NFT:', err);
      const message = err instanceof Error ? err.message : 'Check balance and try again.';
      alert(`Error: ${message}`);
    }
  };

  const openSellModal = (e: React.MouseEvent, nft: NormalizedNft) => {
    e.stopPropagation();
    setNftToSell(nft);
    setSellPrice('');
    setSelectedPaymentToken('EGLD');
    setIsSellModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSellNft = async () => {
    if (!nftToSell || !sellPrice || !walletAddress) return;

    try {
      const toHex = (str: string) => Array.from(new TextEncoder().encode(str))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const priceBN = new BigNumber(sellPrice);
      const decimals = selectedPaymentToken === 'USDC-c7723f' ? 6 : 18;
      const priceRaw = priceBN.times(new BigNumber(10).pow(decimals)).toFixed(0);
      let priceHex = BigInt(priceRaw).toString(16);
      if (priceHex.length % 2 !== 0) priceHex = '0' + priceHex;

      const deadline = Math.floor(Date.now() / 1000) + 3600 * 24 * 30; // 30 days
      let deadlineHex = deadline.toString(16);
      if (deadlineHex.length % 2 !== 0) deadlineHex = '0' + deadlineHex;

      // Prepare NFT data
      const lastDashIndex = nftToSell.identifier.lastIndexOf('-');
      if (lastDashIndex === -1) throw new Error("Invalid NFT identifier format.");

      const collection = nftToSell.identifier.substring(0, lastDashIndex);
      let nonceHex = nftToSell.identifier.substring(lastDashIndex + 1);
      if (nonceHex.length % 2 !== 0) nonceHex = '0' + nonceHex;

      const collectionHex = toHex(collection);
      const marketAddr = new Address(OOX_CONTRACT_ADDRESS);
      const marketHex = Array.from(marketAddr.getPublicKey())
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const functionHex = toHex('auctionToken');
      const qtyHex = "01";
      const paymentTokenHex = toHex(selectedPaymentToken);

      // OOX auctionToken(min_bid, max_bid, deadline, accepted_payment_token)
      // For fixed price: min_bid = max_bid = price
      const txData = `ESDTNFTTransfer@${collectionHex}@${nonceHex}@${qtyHex}@${marketHex}@${functionHex}@${priceHex}@${priceHex}@${deadlineHex}@${paymentTokenHex}`;

      const accountNonce = accountInfo?.account?.nonce ?? 0;

      const tx = new Transaction({
        nonce: BigInt(accountNonce),
        value: 0n,
        receiver: new Address(walletAddress),
        sender: new Address(walletAddress),
        gasLimit: 15000000n,
        chainID: network.chainId,
        data: new TextEncoder().encode(txData),
        version: 1
      });

      // Convert to a plain object and back to ensure compatibility with signers
      const plainTx = tx.toPlainObject();

      await signAndSendTransactions({
        transactions: [Transaction.newFromPlainObject(plainTx)],
        transactionsDisplayInfo: {
          processingMessage: `Listing ${nftToSell.name} for ${sellPrice} ${selectedPaymentToken.split('-')[0]}...`,
          errorMessage: 'Failed to list Asset.',
          successMessage: 'Asset listed successfully!'
        }
      });

      // Optimistic UI Update: Remove listed Unit from wallet
      const listedId = nftToSell.identifier;
      const listedAmount = 1;

      const updateList = (prev: NormalizedNft[]) => {
        return prev.map(n => {
          if (n.identifier === listedId) {
            const currentBalance = parseInt(n.balance || '1');
            if (currentBalance > listedAmount) {
              return { ...n, balance: (currentBalance - listedAmount).toString() };
            }
            return null;
          }
          return n;
        }).filter((n): n is NormalizedNft => n !== null);
      };

      nftsQuery.setItems(prev => updateList(prev));
      onionXCardsQuery.setItems(prev => updateList(prev));
      chubbyCollection1Query.setItems(prev => updateList(prev));
      chubbyCollection2Query.setItems(prev => updateList(prev));

      setIsSellModalOpen(false);
      setNftToSell(null);
    } catch (err: unknown) {
      console.error('Failed to sell NFT:', err);
      const message = err instanceof Error ? err.message : 'Check balance and try again.';
      alert(`Error: ${message}`);
    }
  };

  const handleMoveMultipleNfts = async (targetFolderId: string | number) => {
    if (selectedNfts.length === 0) return;

    await Promise.all(selectedNfts.map((nft) => fbAddItemToFolder(targetFolderId.toString(), nft)));

    setIsMoveModalOpen(false);
    setIsSelectionMode(false);
    setSelectedNfts([]);
    setOpenMenuId(null);
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

  const startLongPress = (nft: NormalizedNft) => {
    isLongPressActive.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      setIsSelectionMode(true);
      setSelectedNfts(prev => {
        if (!prev.some(n => n.identifier === nft.identifier)) {
          return [...prev, nft];
        }
        return prev;
      });
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 600);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };



  const toggleFavorite = (e: React.MouseEvent, nft: NormalizedNft) => {
    e.stopPropagation();
    fbToggleFavorite(nft);
  };

  const [gridColumns, setGridColumns] = useState(2);
  const [rowHeight, setRowHeight] = useState<number>(0);
  const [scrollY, setScrollY] = useState(0);
  const nftGridRef = useRef<HTMLDivElement>(null);
  const nftSentinelRef = useRef<HTMLDivElement>(null);
  const measuredRowHeightRef = useRef<number>(0);
  const rowHeightRafRef = useRef<number | null>(null);



  const menuRef = useRef<HTMLDivElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'NFTs', label: 'NFTs' },
    { id: 'Chubby', label: 'Chubby' },
    { id: 'OnionXCards', label: 'OnionX Cards' },
  ];

  const dynamicUserFolders: UserFolder[] = [
    {
      id: "favorites",
      name: 'My Favorites',
      description: 'Your favorite assets in one place.',
      itemCount: firebaseFavorites.length,
      previewImages: firebaseFavorites.length > 0
        ? firebaseFavorites.slice(0, 4).map(n => n.imageUrl || n.identifier)
        : []
    },
    ...firebaseFolders
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
    return () => {
      if (rowHeightRafRef.current) {
        window.cancelAnimationFrame(rowHeightRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const computeColumns = () => {
      const width = window.innerWidth;
      const cols = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
      setGridColumns(cols);
    };

    computeColumns();
    window.addEventListener('resize', computeColumns);
    return () => window.removeEventListener('resize', computeColumns);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setScrollY(window.scrollY);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const renderContextMenu = (i: number, nft: NormalizedNft) => {
    if (openMenuId !== i) return null;
    const contentJSX = (
      <>
        {/* Mobile Backdrop */}
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
        <div ref={menuRef} onClick={(e) => e.stopPropagation()} className="fixed md:absolute bottom-0 md:bottom-12 left-0 right-0 md:left-auto md:-right-2 z-[70] w-full md:w-44 bg-white dark:bg-[#252525] rounded-t-[2rem] md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl border-t md:border border-gray-100 dark:border-white/10 p-5 md:p-1.5 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-2 md:zoom-in-95 duration-300">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
          <button onClick={(e) => openSellModal(e, nft)} className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all">
            <div className="flex items-center gap-4 md:gap-2"><DollarSign className="w-5 h-5 md:w-4 md:h-4 text-green-500" /><span>Sell Asset</span></div>
          </button>
          <button onClick={(e) => openSendModal(e, nft)} className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all">
            <div className="flex items-center gap-4 md:gap-2"><Send className="w-5 h-5 md:w-4 md:h-4 text-blue-500" /><span>Send</span></div>
          </button>
          <button onClick={(e) => openMoveModal(e, nft)} className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all">
            <div className="flex items-center gap-4 md:gap-2"><Folder className="w-5 h-5 md:w-4 md:h-4 text-orange-500" /><span>Move to Folder</span></div>
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

  const isNftsTabActive = viewMode === 'Collectibles' && activeTab === 'NFTs';
  const nftsQuery = useAccountNfts({
    address: walletAddress,
    enabled: isNftsTabActive,
    pageSize: 30
  });

  const isChubbyTabActive = viewMode === 'Collectibles' && activeTab === 'Chubby';
  const chubbyCollection1Query = useCollectionNfts({
    address: walletAddress,
    collection: 'CHBONX-3e0201',
    enabled: isChubbyTabActive,
    pageSize: 30
  });
  const chubbyCollection2Query = useCollectionNfts({
    address: walletAddress,
    collection: 'CTMCHUB-9298c1',
    enabled: isChubbyTabActive,
    pageSize: 30
  });

  const chubbyNfts = useMemo(() => {
    return [...chubbyCollection1Query.items, ...chubbyCollection2Query.items];
  }, [chubbyCollection1Query.items, chubbyCollection2Query.items]);

  const isOnionXCardsTabActive = viewMode === 'Collectibles' && activeTab === 'OnionXCards';
  const onionXCardsQuery = useCollectionNfts({
    address: walletAddress,
    collection: 'ONXCRDS-ab712e',
    enabled: isOnionXCardsTabActive,
    pageSize: 30
  });

  useEffect(() => {
    if (!isNftsTabActive) {
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
  }, [isNftsTabActive, nftsQuery]);

  useEffect(() => {
    if (!isOnionXCardsTabActive) {
      return;
    }
    if (!nftSentinelRef.current) {
      return;
    }

    const el = nftSentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void onionXCardsQuery.loadMore();
        }
      },
      {
        root: null,
        rootMargin: '1000px 0px'
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [isOnionXCardsTabActive, onionXCardsQuery]);

  useEffect(() => {
    if (!isChubbyTabActive) return;
    if (!nftSentinelRef.current) return;

    const el = nftSentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void chubbyCollection1Query.loadMore();
          void chubbyCollection2Query.loadMore();
        }
      },
      {
        root: null,
        rootMargin: '1000px 0px'
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [isChubbyTabActive, chubbyCollection1Query, chubbyCollection2Query]);



  const firstNftCardRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      return;
    }

    const next = Math.round(el.getBoundingClientRect().height);
    if (!next) {
      return;
    }
    if (measuredRowHeightRef.current === next) {
      return;
    }
    measuredRowHeightRef.current = next;

    if (rowHeightRafRef.current) {
      return;
    }

    rowHeightRafRef.current = window.requestAnimationFrame(() => {
      rowHeightRafRef.current = null;
      const measured = measuredRowHeightRef.current;
      setRowHeight((prev) => (prev === measured ? prev : measured));
    });
  }, []);

  const handleItemClick = (id: number, type: TabId | 'FolderItem' = activeTab) => {
    setSelectedItem({
      id,
      tab: type,
      imageUrl: `https://picsum.photos/seed/${type}-${id}/1200/1200`,
      name: type === 'FolderItem' ? `${activeFolder?.name} #${id + 1}` : undefined,
      type: 'NFT',
      attributes: [
        { trait_type: 'RARITY', value: 'Legendary' },
        { trait_type: 'BACKGROUND', value: 'Sunset Orange' },
        { trait_type: 'SKIN', value: 'Crispy Gold' }
      ],
      tags: ['Bacon', 'Genesis', 'OnionX', 'Rare'],
      floorPrice: '1.45 EGLD'
    });
  };

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

  const handleFolderClick = (folder: UserFolder) => setActiveFolder(folder);
  const toggleMenu = (e: React.MouseEvent, id: number) => { e.stopPropagation(); setOpenMenuId(openMenuId === id ? null : id); };
  const toggleFolderMenu = (e: React.MouseEvent, id: string | number) => { e.stopPropagation(); setOpenFolderMenuId(openFolderMenuId === id ? null : id); };
  const closeCollection = () => setActiveCollectionId(null);

  const renderNftGrid = (items: NormalizedNft[], tabId: TabId) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((nft, i) => (
          <div
            key={nft.identifier}
            ref={i === 0 ? firstNftCardRef : undefined}
            onClick={() => {
              if (isLongPressActive.current) {
                isLongPressActive.current = false;
                return;
              }
              if (isSelectionMode) {
                toggleSelection(nft);
                return;
              }
              setSelectedItem({
                id: i,
                tab: tabId,
                identifier: nft.identifier,
                collection: nft.collection,
                imageUrl: nft.imageUrl || `https://picsum.photos/seed/NFTs-${i}/1200/1200`,
                originalImageUrl: nft.originalImageUrl,
                mimeType: nft.mimeType,
                name: nft.name,
                type: nft.type,
                balance: nft.balance,
                attributes: nft.metadata?.attributes as { trait_type: string; value: string }[] || [],
                description: nft.metadata?.description || '',
                tags: ['MultiversX'],
                floorPrice: '—'
              });
            }}
            onMouseDown={() => startLongPress(nft)}
            onMouseUp={clearLongPress}
            onMouseLeave={clearLongPress}
            onTouchStart={() => startLongPress(nft)}
            onTouchEnd={clearLongPress}
            className={`group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 active:scale-[0.98] active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}
          >
            <div className="aspect-square bg-gray-50 dark:bg-zinc-800/50 overflow-hidden relative">
              {selectedNfts.some(n => n.identifier === nft.identifier) && (
                <div className="absolute top-3 left-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                  <Zap className="w-3 h-3 text-white fill-current" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                <button
                  onClick={(e) => toggleFavorite(e, nft)}
                  className={`p-3 md:p-3 md:p-2 backdrop-blur-md rounded-full transition-all active:scale-90 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white hover:text-orange-500'}`}
                >
                  <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => toggleMenu(e, i)}
                  className="p-3 md:p-3 md:p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-orange-500 transition-all active:scale-90"
                >
                  <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                </button>
              </div>
              {renderContextMenu(i, nft)}
              <NftMedia
                src={nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/400/400`}
                alt={nft.name}
                mimeType={nft.mimeType}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="p-5">
              <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors">
                {nft.name}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
                {nft.collection}
              </p>
            </div>
          </div>
        ))
        }
        {/* Sentinel for infinite scroll */}
        <div ref={nftSentinelRef} className="h-10 col-span-full" />
      </div >
    );
  };

  const renderCollectibles = () => {
    if (activeTab === 'Chubby') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!walletAddress && (
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              Login required to load Chubby NFTs
            </div>
          )}
          {renderNftGrid(chubbyNfts, 'Chubby')}
        </div>
      );
    }

    if (activeTab === 'OnionXCards') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!walletAddress && (
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              Login required to load OnionX Cards
            </div>
          )}
          {renderNftGrid(onionXCardsQuery.items, 'OnionXCards')}
        </div>
      );
    }

    if (activeTab === 'NFTs') {
      const rowGapPx = 24; // gap-6
      const allItems = nftsQuery.items;

      // Grouping logic
      const collectionsMap = new Map<string, NormalizedNft[]>();
      for (const item of allItems) {
        const list = collectionsMap.get(item.collection) || [];
        list.push(item);
        collectionsMap.set(item.collection, list);
      }

      const displayFolders: { type: 'folder'; id: string; name: string; items: NormalizedNft[] }[] = [];
      const displaySingles: NormalizedNft[] = [];

      for (const [id, list] of collectionsMap.entries()) {
        if (list.length > 1) {
          displayFolders.push({ type: 'folder', id, name: list[0].collectionName, items: list });
        } else {
          displaySingles.push(list[0]);
        }
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
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {collectionItems.map((nft, i) => (
                <div
                  key={nft.identifier}
                  onClick={() => handleNftClick(i, nft)}
                  onMouseDown={() => startLongPress(nft)}
                  onMouseUp={clearLongPress}
                  onMouseLeave={clearLongPress}
                  onTouchStart={() => startLongPress(nft)}
                  onTouchEnd={clearLongPress}
                  className={`group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 active:scale-[0.98] active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}
                >
                  <div className="aspect-square bg-gray-50 dark:bg-zinc-800/50 overflow-hidden relative">
                    {selectedNfts.some(n => n.identifier === nft.identifier) && (
                      <div className="absolute top-3 left-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                        <Zap className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                    <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                      <button
                        onClick={(e) => toggleFavorite(e, nft)}
                        className={`p-3 md:p-3 md:p-2 backdrop-blur-md rounded-full transition-all active:scale-90 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white hover:text-orange-500'}`}
                      >
                        <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => toggleMenu(e, i)}
                        className="p-3 md:p-3 md:p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-orange-500 transition-all active:scale-90"
                      >
                        <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                      </button>
                    </div>
                    {renderContextMenu(i, nft)}
                    <NftMedia
                      src={nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/400/400`}
                      alt={nft.name}
                      mimeType={nft.mimeType}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors">
                      {nft.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {nft.collection}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      const totalDisplayItems = displayFolders.length + displaySingles.length;
      const totalRows = Math.ceil(totalDisplayItems / gridColumns);
      const rowStep = rowHeight > 0 ? rowHeight + rowGapPx : 0;

      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
      const containerTop = nftGridRef.current ? nftGridRef.current.getBoundingClientRect().top + window.scrollY : 0;
      const relativeScrollTop = Math.max(0, scrollY - containerTop);

      const startRow = rowStep > 0 ? Math.max(0, Math.floor(relativeScrollTop / rowStep) - 3) : 0;
      const endRow = rowStep > 0 ? Math.min(totalRows - 1, Math.floor((relativeScrollTop + viewportHeight) / rowStep) + 3) : Math.min(totalRows - 1, 8);

      const startIndex = startRow * gridColumns;
      const endIndex = Math.min(totalDisplayItems, (endRow + 1) * gridColumns);

      // Final list: Folders first, then singles
      const finalItems = [...displayFolders, ...displaySingles.map(nft => ({ type: 'nft' as const, data: nft }))];
      const visibleItems = finalItems.slice(startIndex, endIndex);

      const topSpacerHeight = rowHeight > 0 && startRow > 0 ? startRow * rowHeight + Math.max(0, startRow - 1) * rowGapPx : 0;
      const bottomRows = Math.max(0, totalRows - endRow - 1);
      const bottomSpacerHeight = rowHeight > 0 && bottomRows > 0 ? bottomRows * rowHeight + Math.max(0, bottomRows - 1) * rowGapPx : 0;

      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!walletAddress && (
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              Login required to load NFTs
            </div>
          )}

          <div ref={nftGridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {topSpacerHeight > 0 && <div style={{ gridColumn: '1 / -1', height: topSpacerHeight }} />}

            {visibleItems.map((item, localIndex) => {
              const i = startIndex + localIndex;
              const attachRef = localIndex === 0 ? firstNftCardRef : undefined;

              if (item.type === 'folder') {
                return (
                  <div
                    key={item.id}
                    ref={attachRef}
                    onClick={() => handleCollectionClick(item.id)}
                    className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2"
                  >
                    <div className="aspect-square bg-gray-50 dark:bg-zinc-800/30 overflow-hidden relative p-4">
                      {item.items.slice(0, 3).reverse().map((nft, idx, arr) => {
                        const isTop = idx === arr.length - 1;
                        const rotation = isTop ? 'rotate-0' : idx === 0 ? '-rotate-6' : 'rotate-6';
                        const scale = isTop ? 'scale-100' : idx === 0 ? 'scale-90' : 'scale-95';
                        const zIndex = isTop ? 'z-20' : idx === 0 ? 'z-0' : 'z-10';
                        const opacity = isTop ? 'opacity-100' : 'opacity-40 group-hover:opacity-60';

                        return (
                          <div key={idx} className={`absolute inset-4 rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl ${rotation} ${scale} ${zIndex} ${opacity}`}>
                            <NftMedia
                              src={nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/200/200`}
                              alt="preview"
                              mimeType={nft.mimeType}
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
                      {item.items.length > 1 && (
                        <div className="absolute top-4 right-4 z-30 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a]">
                          {item.items.length} Assets
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {item.items.length} Items
                      </p>
                    </div>
                  </div>
                );
              }

              const nft = item.data;
              const imageUrl = nft.imageUrl || `https://picsum.photos/seed/NFTs-${i}/400/400`;
              return (
                <div
                  key={nft.identifier}
                  ref={attachRef}
                  onClick={() => handleNftClick(i, nft)}
                  onMouseDown={() => startLongPress(nft)}
                  onMouseUp={clearLongPress}
                  onMouseLeave={clearLongPress}
                  onTouchStart={() => startLongPress(nft)}
                  onTouchEnd={clearLongPress}
                  className={`group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 active:scale-[0.98] active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}
                >
                  <div className="aspect-square bg-gray-50 dark:bg-zinc-800/50 overflow-hidden relative">
                    {selectedNfts.some(n => n.identifier === nft.identifier) && (
                      <div className="absolute top-3 left-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                        <Zap className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                    <NftMedia
                      src={imageUrl}
                      alt={nft.name}
                      mimeType={nft.mimeType}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />

                    <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                      <button
                        onClick={(e) => toggleFavorite(e, nft)}
                        className={`p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                      >
                        <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => toggleMenu(e, i)}
                        className={`p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${openMenuId === i ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                      >
                        <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                      </button>
                      {renderContextMenu(i, nft)}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                      {nft.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {nft.collection}
                    </p>
                  </div>
                </div>
              );
            })}

            {bottomSpacerHeight > 0 && <div style={{ gridColumn: '1 / -1', height: bottomSpacerHeight }} />}
          </div>

          <div ref={nftSentinelRef} className="h-1" />

          {nftsQuery.error && (
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-red-500">
              {nftsQuery.error}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'OnionXCards') {
      const items = onionXCardsQuery.items;
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!walletAddress && (
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              Login required to load Cards
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((nft, i) => {
              const imageUrl = nft.imageUrl || `https://picsum.photos/seed/Cards-${i}/400/400`;
              const title = nft.name || `Card #${i}`;
              const subtitle = nft.collection || 'OnionX Cards';

              return (
                <div
                  key={nft.identifier}
                  onClick={() => handleNftClick(i, nft)}
                  onMouseDown={() => startLongPress(nft)}
                  onMouseUp={clearLongPress}
                  onMouseLeave={clearLongPress}
                  onTouchStart={() => startLongPress(nft)}
                  onTouchEnd={clearLongPress}
                  className={`group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 active:scale-[0.98] active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}
                >
                  <div className="aspect-square bg-gray-50 dark:bg-zinc-800/50 overflow-hidden relative">
                    {selectedNfts.some(n => n.identifier === nft.identifier) && (
                      <div className="absolute top-3 left-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                        <Zap className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                    <NftMedia
                      src={imageUrl}
                      alt={title}
                      mimeType={nft.mimeType}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />

                    <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                      <button
                        onClick={(e) => toggleFavorite(e, nft)}
                        className={`p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                      >
                        <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => toggleMenu(e, i)}
                        className={`p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${openMenuId === i ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                      >
                        <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                      </button>
                      {renderContextMenu(i, nft)}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                      {title}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={nftSentinelRef} className="h-1" />

          {(onionXCardsQuery.isLoading || onionXCardsQuery.hasMore) && walletAddress && (
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              {onionXCardsQuery.isLoading ? 'Loading Cards…' : 'Scroll to load more'}
            </div>
          )}
        </div>
      );
    }

    // For any other tab (specifically 'Badge')
    const badgeCount = 6;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {Array.from({ length: badgeCount }).map((_, i) => (
          <div
            key={i}
            onClick={() => handleItemClick(i)}
            className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2"
          >
            <div className="aspect-square bg-gray-50 dark:bg-zinc-800/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); /* Badges are just placeholders for now */ }}
                  className="p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg bg-black/40 text-white/70 hover:text-white"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); /* Placeholder Settings */ }}
                  className="p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg bg-black/40 text-white/70 hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <img
                src={`https://picsum.photos/seed/${activeTab}-${i}/400/400`}
                alt={`${activeTab} Placeholder`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="p-5">
              <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors">
                Badge #{1240 + i}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Bacon Collection</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderManagementView = () => {
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
            {firebaseFavorites.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10">
                <Heart className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-500">No favorites yet. Start hearting your NFTs!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {firebaseFavorites.map((nft, i) => (
                  <div key={nft.identifier} onClick={() => handleNftClick(i, nft)}
                    onMouseDown={() => startLongPress(nft)}
                    onMouseUp={clearLongPress}
                    onMouseLeave={clearLongPress}
                    onTouchStart={() => startLongPress(nft)}
                    onTouchEnd={clearLongPress}
                    className={`group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 active:scale-[0.98] active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}>
                    <div className="aspect-square bg-gray-100 dark:bg-zinc-800/50 overflow-hidden relative">
                      {selectedNfts.some(n => n.identifier === nft.identifier) && (
                        <div className="absolute top-3 left-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                          <Zap className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                      <NftMedia
                        src={nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/400/400`}
                        alt={nft.name}
                        mimeType={nft.mimeType}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                        <button
                          onClick={(e) => toggleFavorite(e, nft)}
                          className="p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg bg-orange-500 text-white"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          onClick={(e) => toggleMenu(e, i)}
                          className={`p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${openMenuId === i ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                        >
                          <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                        </button>
                        {renderContextMenu(i, nft)}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">{nft.name}</h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">{nft.collection}</p>
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
                <h2 className="text-2xl font-black dark:text-white text-gray-900">{activeFolder.name}</h2>
                <div className="flex flex-col space-y-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{activeFolder.itemCount} items curated</p>
                  {activeFolder.description && (
                    <p className="text-xs text-gray-400 font-medium italic">{activeFolder.description}</p>
                  )}
                </div>
              </div>
            </div>
            <button className="flex items-center space-x-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-sm hover:scale-105 transition-all"><Plus className="w-4 h-4" /><span>Add Items</span></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(firebaseFolderContents[activeFolder.id] || []).length === 0 ? (
              <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10">
                <Folder className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-500">Folder is empty. Move items here!</p>
              </div>
            ) : (
              (firebaseFolderContents[activeFolder.id] || []).map((nft, i) => (
                <div key={nft.identifier} onClick={() => handleNftClick(i, nft)}
                  onMouseDown={() => startLongPress(nft)}
                  onMouseUp={clearLongPress}
                  onMouseLeave={clearLongPress}
                  onTouchStart={() => startLongPress(nft)}
                  onTouchEnd={clearLongPress}
                  className={`group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a1a] border transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 active:scale-[0.98] active:scale-[0.98] ${selectedNfts.some(n => n.identifier === nft.identifier) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-white/5'}`}>
                  <div className="aspect-square bg-gray-100 dark:bg-zinc-800/50 overflow-hidden relative">
                    {selectedNfts.some(n => n.identifier === nft.identifier) && (
                      <div className="absolute top-3 left-3 z-30 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1a1a] animate-in zoom-in-50 duration-200">
                        <Zap className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                    <NftMedia
                      src={nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/400/400`}
                      alt={nft.name}
                      mimeType={nft.mimeType}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                      <button
                        onClick={(e) => toggleFavorite(e, nft)}
                        className={`p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                      >
                        <Heart className={`w-4 h-4 ${firebaseFavorites.some((f) => f.identifier === nft.identifier) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => toggleMenu(e, i)}
                        className={`p-3 md:p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90 shadow-lg ${openMenuId === i ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                      >
                        <Settings className={`w-4 h-4 transition-transform duration-500 ${openMenuId === i ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                      </button>
                      {renderContextMenu(i, nft)}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-black dark:text-white text-gray-900 group-hover:text-orange-500 transition-colors truncate">{nft.name}</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">{nft.collection}</p>
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
                alert(`You've reached the limit of ${maxFolders} folders!${!hasProAccess ? ' Get a Bacon PASS license to unlock up to 100 folders.' : ''}`);
                return;
              }
              setIsCreateModalOpen(true);
            }}
            className={`group relative p-6 rounded-[2.5rem] bg-gray-50 dark:bg-[#0a0a0a]/20 border-2 border-dashed flex flex-col items-center justify-center space-y-4 transition-all h-full min-h-[280px] ${firebaseFolders.length >= maxFolders ? 'border-gray-300 dark:border-white/5 opacity-60 cursor-not-allowed' : 'border-gray-200 dark:border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5'}`}
          >
            <div className={`w-16 h-16 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-lg transition-all ${firebaseFolders.length >= maxFolders ? '' : 'group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white'}`}>
              {firebaseFolders.length >= maxFolders ? <Lock className="w-8 h-8 text-gray-400" /> : <Plus className="w-8 h-8" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-black dark:text-white">{firebaseFolders.length >= maxFolders ? 'Folder Limit Reached' : 'Create New Folder'}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{firebaseFolders.length >= maxFolders ? `Limit: ${maxFolders} folders` : 'Organize your collection'}</p>
            </div>
          </button>

          {dynamicUserFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              className="group relative cursor-pointer p-6 rounded-[2.5rem] bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 active:scale-[0.98]"
            >
              <div className="flex items-center mb-6">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    {folder.id === 'favorites' ? <Heart className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black dark:text-white text-gray-900 truncate pr-2">{folder.name}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{folder.itemCount} Items</p>
                  </div>
                </div>
              </div>

              <div className="aspect-square bg-gray-50 dark:bg-zinc-800/20 overflow-hidden relative p-4">
                {folder.previewImages.length > 0 ? (
                  folder.previewImages.slice(0, 3).reverse().map((img, idx, arr) => {
                    const isTop = idx === arr.length - 1;
                    const rotation = isTop ? 'rotate-0' : idx === 0 ? '-rotate-6' : 'rotate-6';
                    const scale = isTop ? 'scale-100' : idx === 0 ? 'scale-90' : 'scale-95';
                    const zIndex = isTop ? 'z-20' : idx === 0 ? 'z-0' : 'z-10';
                    const opacity = isTop ? 'opacity-100' : 'opacity-40 group-hover:opacity-60';

                    return (
                      <div key={idx} className={`absolute inset-4 rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl ${rotation} ${scale} ${zIndex} ${opacity}`}>
                        <NftMedia
                          src={img.startsWith('http') ? img : `https://picsum.photos/seed/${img}/200/200`}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="absolute inset-8 rounded-2xl bg-gray-100/50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center">
                    <Folder className="w-8 h-8 text-gray-300 dark:text-white/20" />
                  </div>
                )}
                {folder.itemCount > 0 && (
                  <div className="absolute top-4 right-4 z-30 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#1a1a1a]">
                    {folder.itemCount} Items
                  </div>
                )}

                {folder.id !== 'favorites' && (
                  <div className="absolute bottom-4 right-4 z-30">
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
                          <div ref={folderMenuRef} onClick={(e) => e.stopPropagation()} className="fixed md:absolute bottom-0 md:top-10 left-0 right-0 md:left-auto md:right-0 z-[70] w-full md:w-40 bg-white dark:bg-[#252525] rounded-t-[2rem] md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl border-t md:border border-gray-100 dark:border-white/10 p-5 md:p-1.5 animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
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
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
        {/* Navigation & Header */}
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center h-7 px-4 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] pl-[0.2em] mb-[1px] leading-none">Asset Hub</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1.5 bg-white dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-xl backdrop-blur-xl">
            <button
              onClick={() => setViewMode('Collectibles')}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-[1.5rem] text-sm font-black transition-all ${viewMode === 'Collectibles' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Collectibles</span>
            </button>
            <button
              onClick={() => setViewMode('Management')}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-[1.5rem] text-sm font-black transition-all ${viewMode === 'Management' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Folder className="w-4 h-4" />
              <span>Management</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        {viewMode === 'Collectibles' ? (
          <div className="space-y-10">
            {/* Horizontal Tabs */}
            <div className="flex items-center justify-start md:justify-center gap-6 md:gap-8 border-b border-gray-100 dark:border-white/5 pb-2 px-1 md:px-0 overflow-x-auto scrollbar-hide no-scrollbar w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative pb-4 group"
                >
                  <span className={`text-sm font-black transition-colors ${activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'}`}>
                    {tab.label}
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full animate-in fade-in slide-in-from-left-4 duration-300" />
                  )}
                </button>
              ))}
            </div>

            {renderCollectibles()}
          </div>
        ) : (
          renderManagementView()
        )}
      </div>

      {/* NFT Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-10 animate-in fade-in duration-400">
          <div className="absolute inset-0 bg-black/80 md:bg-black/90 backdrop-blur-md md:backdrop-blur-3xl" onClick={() => setSelectedItem(null)}></div>

          <div className="relative w-full max-w-5xl bg-white dark:bg-[#121212] rounded-t-[2.5rem] md:rounded-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] md:shadow-[0_0_100px_rgba(249,115,22,0.15)] overflow-hidden border-t md:border border-gray-100 dark:border-white/10 animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-10 duration-500 flex flex-col md:flex-row h-[92dvh] md:h-[90dvh] max-h-screen">

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
            <div className="w-full md:w-[45%] h-[40%] md:h-full relative group bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center p-8 md:p-16">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative z-0 w-full h-full flex items-center justify-center">
                <NftMedia
                  src={selectedItem.originalImageUrl || selectedItem.imageUrl}
                  alt={selectedItem.name || ''}
                  mimeType={selectedItem.mimeType}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-md drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-10 left-10 right-10 z-20 hidden md:block opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                <h2 className="text-2xl font-black text-white drop-shadow-2xl">{selectedItem.name}</h2>
                <p className="text-orange-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 drop-shadow-lg">{selectedItem.collection}</p>
              </div>
            </div>

            {/* Right Side: Details & Actions */}
            <div className="w-full md:w-[55%] h-[60%] md:h-full flex flex-col bg-white dark:bg-[#121212] overflow-hidden">
              <div className="flex-1 overflow-y-auto scrollbar-hide p-8 md:p-12 space-y-10">

                {/* Header Info */}
                <div className="flex items-start justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                        {selectedItem.type || 'NFT'}
                      </span>
                      {selectedItem.identifier?.includes('ONX') && (
                        <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                          Bacon Premium
                        </span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                        {selectedItem.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-3 cursor-pointer group/id" onClick={() => {
                        navigator.clipboard.writeText(selectedItem.identifier || '');
                        alert('Identifier copied!');
                      }}>
                        <p className="text-[10px] text-gray-400 font-bold group-hover/id:text-orange-500 transition-colors">
                          ID: {selectedItem.identifier?.slice(0, 16)}...
                        </p>
                        <Share2 className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 transition-all hidden md:block"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Main Stats Card */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex flex-col justify-between group hover:border-orange-500/30 transition-all relative overflow-hidden">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1 z-10 text-nowrap">Collection</p>
                    <p className="text-xs font-black dark:text-white truncate z-10">{selectedItem.collection}</p>
                    <Folder className="absolute -right-2 -bottom-2 w-10 h-10 text-gray-400/10 group-hover:text-orange-500/10 transition-colors" />
                  </div>
                  <div className="p-5 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex flex-col justify-between group hover:border-blue-500/30 transition-all relative overflow-hidden">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1 z-10 text-nowrap">Quantity</p>
                    <p className="text-xs font-black dark:text-white z-10">{selectedItem.balance || '1'}</p>
                    <Zap className="absolute -right-2 -bottom-2 w-10 h-10 text-gray-400/10 group-hover:text-blue-500/10 transition-colors" />
                  </div>
                </div>

                {/* Description */}
                {selectedItem.description && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Description</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/10 italic">
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

              {/* Action Footer - Fixed at bottom */}
              <div className="shrink-0 p-6 pb-8 md:p-8 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/10 flex flex-wrap sm:flex-nowrap items-center gap-2 md:gap-3 z-50">
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
                      type: selectedItem.type!,
                      balance: selectedItem.balance
                    }), 100);
                  }}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-red-500/20 group/burn"
                  title="Burn Asset"
                >
                  <Flame className="w-5 h-5 group-hover/burn:scale-110 transition-transform" />
                  <span className="hidden md:inline">Burn</span>
                </button>

                <button
                  onClick={(e) => handleDownload(e, selectedItem.imageUrl, selectedItem.name || 'nft')}
                  className="flex-1 py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase md:normal-case tracking-wider md:tracking-normal flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-slate-800/20"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span className="hidden md:inline">Download</span>
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
                      type: selectedItem.type!,
                      balance: selectedItem.balance
                    }), 100);
                  }}
                  className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden md:inline">Send</span>
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
                      type: selectedItem.type!,
                      balance: selectedItem.balance
                    }), 100);
                  }}
                  className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-orange-500/20"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden md:inline">List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Send Modal */}
      {isSendModalOpen && nftToSend && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsSendModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 p-8 md:p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Send className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black dark:text-white">Send Asset</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Transfer to another wallet</p>
                </div>
              </div>
              <button onClick={() => setIsSendModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 mb-8">
              <NftMedia
                src={nftToSend.imageUrl || `https://picsum.photos/seed/${nftToSend.identifier}/200/200`}
                alt={nftToSend.name}
                mimeType={nftToSend.mimeType}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
              <div>
                <h4 className="font-black text-gray-900 dark:text-white">{nftToSend.name}</h4>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{nftToSend.collection}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-gray-200 dark:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider dark:text-gray-300">{nftToSend.type}</span>
                  {parseInt(nftToSend.balance || '1') > 1 && (
                    <span className="px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg text-[10px] font-black uppercase tracking-wider border border-orange-500/20">Balance: {nftToSend.balance}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Recipient Address or Herotag</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="erd1... or username.elrond"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                />
              </div>

              {parseInt(nftToSend.balance || '1') > 1 && (
                <div className="space-y-2">
                  <div className="flex justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Transfer Quantity</label>
                    <button onClick={() => setSendQuantity(nftToSend.balance || '1')} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Max Available</button>
                  </div>
                  <div className="relative group/input">
                    <input
                      type="number"
                      value={sendQuantity}
                      onChange={(e) => setSendQuantity(e.target.value)}
                      max={nftToSend.balance}
                      min="1"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleSendNft}
                disabled={!recipient}
                className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                <span>Send Now</span>
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {isSellModalOpen && nftToSell && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsSellModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 p-8 md:p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <DollarSign className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black dark:text-white">List for Sale</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">OOX Marketplace Instant Listing</p>
                </div>
              </div>
              <button onClick={() => setIsSellModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 mb-8">
              <NftMedia
                src={nftToSell.imageUrl || `https://picsum.photos/seed/${nftToSell.identifier}/200/200`}
                alt={nftToSell.name}
                mimeType={nftToSell.mimeType}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-gray-900 dark:text-white truncate">{nftToSell.name}</h4>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest truncate">{nftToSell.collection}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-wider border border-orange-500/20">Verified Collection</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              <div className="p-6 rounded-[2rem] bg-orange-500/5 border border-orange-500/10 relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Zap className="w-5 h-5 text-gray-900 fill-current" />
                    </div>
                    <div>
                      <span className="block text-sm font-black dark:text-white">BUY NOW</span>
                      <span className="block text-[10px] text-orange-500 font-bold uppercase tracking-widest">Fixed Price Listing</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Verified Marketplace</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Set Listing Price</label>
                    <div className="relative group/input">
                      <input
                        type="number"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-5 text-lg font-black focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all dark:text-white"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10 mr-1" />
                        <select
                          value={selectedPaymentToken}
                          onChange={(e) => setSelectedPaymentToken(e.target.value)}
                          className="bg-gray-200 dark:bg-zinc-800 border-none rounded-xl text-xs font-black py-2 px-3 focus:ring-0 cursor-pointer dark:text-white hover:bg-orange-500 hover:text-gray-900 transition-colors"
                        >
                          <option value="EGLD">EGLD</option>
                          <option value="USDC-c7723f">USDC</option>
                          <option value="ONX-3e51c8">ONX</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1">Choose your preferred payment token</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSellNft}
              disabled={!sellPrice}
              className="w-full py-5 bg-gradient-to-r from-orange-500 to-yellow-500 text-gray-900 font-black rounded-3xl shadow-2xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              <span>List Now</span>
              <DollarSign className="w-5 h-5" />
            </button>
            <p className="text-[10px] text-gray-500 font-bold text-center mt-6 uppercase tracking-widest">Powered by <a href="https://oox.art" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">oox.art</a></p>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsMoveModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 p-8 md:p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <Folder className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black dark:text-white">Move to Folder</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Organize your collection</p>
                </div>
              </div>
              <button onClick={() => setIsMoveModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {firebaseFolders.length === 0 ? (
                <button
                  onClick={() => {
                    if (firebaseFolders.length >= maxFolders) {
                      alert(`You've reached the limit of ${maxFolders} folders!`);
                      return;
                    }
                    setIsMoveModalOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-center group"
                >
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white text-sm">Create New Folder</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Organize your collection</p>
                  </div>
                </button>
              ) : (
                firebaseFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      if (isSelectionMode) {
                        handleMoveMultipleNfts(folder.id);
                      } else {
                        handleMoveNft(folder.id);
                      }
                    }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-gray-900 dark:text-white text-sm">{folder.name}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{folder.itemCount} items</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => setIsMoveModalOpen(true)} className="flex items-center justify-center px-8 py-3 bg-orange-500 text-white rounded-[1.5rem] font-black text-sm md:text-base hover:scale-105 transition-all shadow-xl shadow-orange-500/20">
                <span>Move</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 p-8 md:p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <Plus className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black dark:text-white">Create Folder</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Organize your assets</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Folder Name</label>
                <input
                  type="text"
                  value={folderTitle}
                  onChange={(e) => setFolderTitle(e.target.value)}
                  placeholder="e.g. Rare NFTs"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Description (Optional)</label>
                <input
                  type="text"
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  placeholder="What's in this folder?"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all dark:text-white"
                />
              </div>

              <button
                onClick={handleCreateFolder}
                disabled={!folderTitle.trim()}
                className="w-full py-5 bg-gradient-to-r from-orange-500 to-yellow-500 text-gray-900 font-black rounded-3xl shadow-2xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                <span>Create Now</span>
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {isBurnModalOpen && nftToBurn && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsBurnModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 p-8 md:p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <Flame className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black dark:text-white">Burn Asset</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">This action is permanent</p>
                </div>
              </div>
              <button onClick={() => setIsBurnModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-3xl bg-red-500/5 border border-red-500/10 mb-8">
              <NftMedia
                src={nftToBurn.imageUrl || `https://picsum.photos/seed/${nftToBurn.identifier}/200/200`}
                alt={nftToBurn.name}
                mimeType={nftToBurn.mimeType}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-gray-900 dark:text-white truncate">{nftToBurn.name}</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest truncate">{nftToBurn.collection}</p>
                <div className="mt-2 text-[10px] font-bold text-red-500/70 bg-red-500/5 px-2 py-1 rounded-lg inline-block border border-red-500/10">
                  WARNING: Burned assets cannot be recovered
                </div>
              </div>
            </div>

            {nftToBurn.type === 'SFT' && parseInt(nftToBurn.balance || '1') > 1 && (
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Burn Quantity</label>
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Available: {nftToBurn.balance}</span>
                </div>
                <input
                  type="number"
                  value={burnQuantity}
                  onChange={(e) => setBurnQuantity(e.target.value)}
                  max={nftToBurn.balance}
                  min="1"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all dark:text-white"
                />
              </div>
            )}

            <button
              onClick={handleBurnNft}
              className="w-full py-5 bg-gradient-to-r from-red-600 to-red-500 text-white font-black rounded-3xl shadow-2xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <span>Confirm Burn</span>
              <Flame className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabSystem;

