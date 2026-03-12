import React from 'react';
import { X, Flame } from 'lucide-react';
import { NftMedia } from '../NftMedia';
import type { NormalizedNft } from '@/helpers';

interface BurnModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftToBurn: NormalizedNft | null;
  burnQuantity: string;
  setBurnQuantity: (value: string) => void;
  onConfirmBurn: () => void;
}

export const BurnModal: React.FC<BurnModalProps> = ({
  isOpen,
  onClose,
  nftToBurn,
  burnQuantity,
  setBurnQuantity,
  onConfirmBurn,
}) => {
  if (!isOpen || !nftToBurn) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 overscroll-contain" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] md:shadow-2xl border-t border-gray-100 dark:border-white/10 md:border p-8 md:p-10 animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-0 duration-300 max-h-[92dvh] overflow-y-auto scrollbar-hide" style={{ touchAction: 'auto' }}>
        {/* Mobile Drag Indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full md:hidden" />
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
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
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
          onClick={onConfirmBurn}
          className="w-full py-5 bg-gradient-to-r from-red-600 to-red-500 text-white font-black rounded-3xl shadow-2xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <span>Confirm Burn</span>
          <Flame className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
