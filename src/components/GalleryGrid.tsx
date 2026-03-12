import React from 'react';
import { Heart, Settings, Zap } from 'lucide-react';
import { NftMedia } from './NftMedia';
import type { NormalizedNft } from '@/helpers';

export interface GalleryGridProps {
  items: NormalizedNft[];
  isLargeGrid: boolean;
  selectedNfts: NormalizedNft[];
  firebaseFavorites: any[];
  openMenuId: number | null;
  handleNftClick: (index: number, nft: NormalizedNft) => void;
  startLongPress: (nft: NormalizedNft, e?: React.TouchEvent | React.MouseEvent) => void;
  clearLongPress: () => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  toggleFavorite: (e: React.MouseEvent, nft: NormalizedNft) => void;
  toggleMenu: (e: React.MouseEvent, id: number) => void;
  renderContextMenu: (i: number, nft: NormalizedNft) => React.ReactNode;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  items,
  isLargeGrid,
  selectedNfts,
  firebaseFavorites,
  openMenuId,
  handleNftClick,
  startLongPress,
  clearLongPress,
  handleTouchMove,
  toggleFavorite,
  toggleMenu,
  renderContextMenu,
}) => {
  return (
    <div className={`grid ${isLargeGrid ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-6`}>
      {items.map((nft, i) => {
        const imageUrl = nft.imageUrl || `https://picsum.photos/seed/${nft.identifier}/400/400`;
        return (
          <div
            key={nft.identifier}
            onClick={() => handleNftClick(i, nft)}
            onMouseDown={(e) => startLongPress(nft, e)}
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
  );
};
