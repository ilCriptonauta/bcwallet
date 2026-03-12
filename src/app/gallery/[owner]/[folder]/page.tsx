'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import GalleryCarousel, { type GalleryNft } from '@/components/GalleryCarousel';
import { NftMedia } from '@/components/NftMedia';
import { Folder, ExternalLink, Loader2, X, Share2, Zap, Copy, Check, LayoutGrid, Square } from 'lucide-react';
import { use } from 'react';

interface NftApiDetails {
  description?: string;
  attributes?: { trait_type: string; value: string }[];
  owner?: string;
  royalties?: number;
  tags?: string[];
}

interface FolderData {
  name: string;
  description?: string;
  items: GalleryNft[];
}

type PageParams = { owner: string; folder: string };

export default function GalleryPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const { owner, folder } = resolvedParams;

  const [folderData, setFolderData] = useState<FolderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  // NFT Detail Modal state
  const [selectedNft, setSelectedNft] = useState<GalleryNft | null>(null);
  const [nftDetails, setNftDetails] = useState<NftApiDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');

  const folderSlug = decodeURIComponent(folder);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        let erdAddress: string;

        if (owner.startsWith('erd1') && owner.length === 62) {
          erdAddress = owner;
        } else {
          const response = await fetch(
            `https://api.multiversx.com/usernames/${decodeURIComponent(owner)}`
          );
          if (!response.ok) {
            setError('User not found');
            setLoading(false);
            return;
          }
          const data = await response.json();
          if (!data.address) {
            setError('User not found');
            setLoading(false);
            return;
          }
          erdAddress = data.address;
        }

        setResolvedAddress(erdAddress);

        const foldersRef = collection(db, 'users', erdAddress, 'folders');
        const snapshot = await getDocs(foldersRef);

        let found: FolderData | null = null;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const slugifiedName = slugify(data.name || '');
          if (slugifiedName === folderSlug || data.name === folderSlug) {
            found = {
              name: data.name,
              description: data.description,
              items: data.items || [],
            };
          }
        });

        if (!found) {
          setError('Folder not found');
        } else {
          setFolderData(found);
        }
      } catch (err) {
        console.error('Gallery load error:', err);
        setError('Failed to load gallery');
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [owner, folderSlug]);

  // Fetch additional NFT details from MultiversX API when detail modal opens
  useEffect(() => {
    if (!selectedNft?.identifier) {
      setNftDetails(null);
      return;
    }

    let active = true;
    setDetailsLoading(true);
    setNftDetails(null);

    fetch(`https://api.multiversx.com/nfts/${selectedNft.identifier}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!active || !data) { setDetailsLoading(false); return; }
        setNftDetails({
          description: data.metadata?.description || '',
          attributes: data.metadata?.attributes || [],
          owner: data.owner,
          royalties: data.royalties,
          tags: data.tags || [],
        });
        setDetailsLoading(false);
      })
      .catch(() => {
        if (active) setDetailsLoading(false);
      });

    return () => { active = false; };
  }, [selectedNft?.identifier]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedNft) {
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
  }, [selectedNft]);

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = id;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0c0c0e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-sm font-bold text-white/50">Loading gallery...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !folderData) {
    return (
      <div className="min-h-[100dvh] bg-[#0c0c0e] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center">
            <Folder className="w-10 h-10 text-white/20" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">
              {error === 'User not found' ? 'User Not Found' : 'Folder Not Found'}
            </h1>
            <p className="text-sm font-bold text-white/40 leading-relaxed">
              {error === 'User not found'
                ? 'This user does not exist on MultiversX.'
                : 'This folder doesn\'t exist or may have been deleted.'}
            </p>
          </div>
          <a
            href="https://baconwallet.vercel.app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-orange-500/20"
          >
            Open Bacon Wallet
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const displayOwner = resolvedAddress
    ? owner.startsWith('erd1')
      ? `${owner.slice(0, 8)}...${owner.slice(-4)}`
      : `@${decodeURIComponent(owner)}`
    : '';

  return (
    <div className="min-h-[100dvh] bg-[#0c0c0e] text-white overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-5 max-w-3xl mx-auto">
        <a
          href="https://baconwallet.vercel.app"
          className="flex items-center gap-2.5 group"
        >
          <div className="relative w-8 h-8 group-hover:scale-110 transition-transform">
            <div className="absolute -inset-1 bg-gradient-to-tr from-orange-500 to-yellow-400 rounded-lg opacity-30 blur-md group-hover:opacity-50 transition-opacity" />
            <img
              src="/bacon-icon.png"
              alt="Bacon Wallet"
              className="relative w-full h-full object-cover rounded-lg"
            />
          </div>
          <span className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Bacon
          </span>
        </a>

        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          Gallery
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center px-4 sm:px-6 pb-16 pt-4 md:pt-8 max-w-3xl mx-auto">
        {/* Owner Badge */}
        <div className="flex items-center gap-2 mb-6 md:mb-8">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center">
            <span className="text-[8px] font-black text-black">
              {displayOwner.replace('@', '').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-bold text-white/50">{displayOwner}</span>
        </div>

        {/* Folder Title */}
        <h1 className="text-3xl md:text-5xl font-black text-center bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50 leading-tight mb-3">
          {folderData.name}
        </h1>

        {/* Description */}
        {folderData.description && (
          <p className="text-sm md:text-base font-medium text-white/40 text-center max-w-md mb-8 leading-relaxed">
            {folderData.description}
          </p>
        )}

        {!folderData.description && <div className="mb-8" />}

        {/* View Mode Toggle */}
        <div className="flex items-center justify-center mb-10 md:mb-14">
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full p-1.5 shadow-inner">
            {/* Animated Slider Background */}
            <div 
              className={`absolute top-1.5 bottom-1.5 w-10 bg-orange-500 rounded-full shadow-lg shadow-orange-500/20 transition-transform duration-300 ease-out z-0 ${
                viewMode === 'carousel' ? 'translate-x-0' : 'translate-x-full'
              }`}
            />
            
            <button
              onClick={() => setViewMode('carousel')}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 z-10 ${
                viewMode === 'carousel' 
                  ? 'text-white' 
                  : 'text-white/40 hover:text-white'
              }`}
              aria-label="Carousel view"
            >
              <Square className={`w-5 h-5 transition-transform duration-300 ${viewMode === 'carousel' ? 'scale-110' : 'scale-100'}`} />
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 z-10 ${
                viewMode === 'grid' 
                  ? 'text-white' 
                  : 'text-white/40 hover:text-white'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className={`w-5 h-5 transition-transform duration-300 ${viewMode === 'grid' ? 'scale-110' : 'scale-100'}`} />
            </button>
          </div>
        </div>

        {/* Content (Carousel or Grid) */}
        {viewMode === 'carousel' ? (
          <GalleryCarousel
            items={folderData.items}
            onItemClick={(item) => {
              setSelectedNft(item);
              setIdCopied(false);
            }}
          />
        ) : (
          <div className="w-full grid grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl mx-auto px-2">
            {folderData.items.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setSelectedNft(item);
                  setIdCopied(false);
                }}
                className="group relative aspect-square bg-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden cursor-pointer border border-white/10 hover:border-orange-500/50 transition-all duration-500 shadow-xl"
              >
                <NftMedia
                  src={item.imageUrl || `https://picsum.photos/seed/${item.identifier}/400/400`}
                  alt={item.name}
                  mimeType={item.mimeType}
                  loading="lazy"
                  thumbnailFallback={item.thumbnailUrl || undefined}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6">
                  <h3 className="text-sm md:text-xl font-black text-white truncate drop-shadow-md">
                    {item.name}
                  </h3>
                  <p className="text-[9px] md:text-xs font-bold text-orange-400 mt-1 uppercase tracking-widest truncate drop-shadow-md">
                    {item.collectionName || item.collection}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 md:mt-16 flex flex-col items-center gap-3">
          <a
            href="https://baconwallet.vercel.app"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-orange-500/20 text-sm"
          >
            Open Bacon Wallet
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
            Manage your NFTs on MultiversX
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
          Powered by Bacon Wallet · OnionX Labs
        </p>
      </footer>

      {/* ─── NFT Detail Modal ─── */}
      {selectedNft && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-10" style={{ touchAction: 'none' }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300"
            onClick={() => setSelectedNft(null)}
          />

          {/* Modal Container */}
          <div
            className="relative w-full max-w-4xl bg-[#121212] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_0_80px_rgba(249,115,22,0.1)] overflow-hidden border-t md:border border-white/10 animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-10 duration-500 flex flex-col md:flex-row h-[92dvh] md:h-[75vh] max-h-[100dvh]"
            style={{ touchAction: 'auto' }}
          >
            {/* Mobile Drag Indicator */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full md:hidden z-50" />

            {/* Close Button (Mobile) */}
            <button
              onClick={() => setSelectedNft(null)}
              className="absolute top-4 right-4 z-50 p-2.5 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-orange-500 transition-all md:hidden active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Large Image */}
            <div className="w-full md:w-[45%] shrink-0 h-[40%] sm:h-[45%] md:h-full relative group bg-[#080808] flex items-center justify-center p-0 md:p-8">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative z-0 w-full h-full flex items-center justify-center">
                <NftMedia
                  src={selectedNft.originalImageUrl || selectedNft.imageUrl || `https://picsum.photos/seed/${selectedNft.identifier}/600/600`}
                  alt={selectedNft.name}
                  mimeType={selectedNft.mimeType}
                  thumbnailFallback={selectedNft.thumbnailUrl || undefined}
                  className="max-w-full max-h-full w-auto h-auto object-contain xl:object-cover rounded-xl md:rounded-[2rem] drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
              </div>
              {/* Hover overlay on desktop */}
              <div className="absolute bottom-10 left-10 right-10 z-20 hidden md:block opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                <h2 className="text-2xl font-black text-white drop-shadow-2xl">{selectedNft.name}</h2>
                <p className="text-orange-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 drop-shadow-lg">{selectedNft.collection}</p>
              </div>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-[55%] flex-1 md:h-full flex flex-col bg-[#121212] overflow-hidden">
              {/* Header */}
              <div className="shrink-0 p-6 pb-2 md:p-10 md:pb-4 space-y-4 bg-[#121212] z-10 border-b border-white/5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-xl md:text-2xl font-black text-white leading-tight truncate">
                        {selectedNft.name}
                      </h1>
                      <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm shrink-0">
                        {selectedNft.type || 'NFT'}
                      </span>
                      {selectedNft.type === 'SFT' && parseInt(selectedNft.balance || '1') > 1 && (
                        <span className="px-2.5 py-1 bg-orange-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm shrink-0">
                          {selectedNft.balance} Assets
                        </span>
                      )}
                    </div>
                    {/* Identifier with Copy */}
                    <button
                      onClick={() => handleCopyId(selectedNft.identifier)}
                      className="flex items-center gap-2 group/id"
                    >
                      <p className="text-[10px] text-gray-500 font-bold group-hover/id:text-orange-500 transition-colors">
                        ID: {selectedNft.identifier.length > 20 ? `${selectedNft.identifier.slice(0, 16)}...` : selectedNft.identifier}
                      </p>
                      {idCopied ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-500" />
                      )}
                    </button>
                  </div>
                  {/* Close (Desktop) */}
                  <button
                    onClick={() => setSelectedNft(null)}
                    className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 transition-all hidden md:block"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-10 pt-4 md:pt-6 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 group hover:border-orange-500/30 transition-all relative overflow-hidden">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Collection</p>
                    <p className="text-xs font-black text-white truncate">{selectedNft.collectionName || selectedNft.collection}</p>
                    <Folder className="absolute -right-1.5 -bottom-1.5 w-8 h-8 text-white/5 group-hover:text-orange-500/10 transition-colors" />
                  </div>
                  {nftDetails?.royalties !== undefined && (
                    <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 group hover:border-orange-500/30 transition-all relative overflow-hidden">
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Royalties</p>
                      <p className="text-xs font-black text-white">{(nftDetails.royalties / 100).toFixed(2)}%</p>
                      <Zap className="absolute -right-1.5 -bottom-1.5 w-8 h-8 text-white/5 group-hover:text-orange-500/10 transition-colors" />
                    </div>
                  )}
                </div>

                {/* Loading Details */}
                {detailsLoading && (
                  <div className="flex items-center gap-3 py-4">
                    <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                    <span className="text-xs font-bold text-white/40">Loading details...</span>
                  </div>
                )}

                {/* Description */}
                {nftDetails?.description && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Description</h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl border border-white/10 italic">
                      {nftDetails.description}
                    </p>
                  </div>
                )}

                {/* Attributes */}
                {nftDetails?.attributes && nftDetails.attributes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Traits & Properties</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {nftDetails.attributes.map((attr, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#1a1a1a] shadow-sm border border-white/5 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all text-center">
                          <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1">{attr.trait_type}</p>
                          <p className="text-[10px] font-black text-white truncate">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {nftDetails?.tags && nftDetails.tags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {nftDetails.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Links */}
                <div className="flex items-center justify-center gap-8 py-4 border-t border-white/5">
                  <a
                    href={`https://explorer.multiversx.com/nfts/${selectedNft.identifier}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-orange-500 transition-colors flex items-center gap-1.5"
                  >
                    Explorer <Share2 className="w-3 h-3" />
                  </a>
                  <a
                    href={`https://oox.art/marketplace/nfts/${selectedNft.identifier}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-orange-500 transition-colors flex items-center gap-1.5"
                  >
                    OOX Marketplace <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Slugify a folder name for URL matching */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
