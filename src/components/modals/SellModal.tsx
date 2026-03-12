import React from 'react';
import { X, DollarSign, Zap } from 'lucide-react';
import { NftMedia } from '../NftMedia';
import type { NormalizedNft } from '@/helpers';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftToSell: NormalizedNft | null;
  sellPrice: string;
  setSellPrice: (value: string) => void;
  sellQuantity: string;
  setSellQuantity: (value: string) => void;
  selectedPaymentToken: string;
  setSelectedPaymentToken: (value: string) => void;
  onSell: () => void;
  paymentTokens: { identifier: string; ticker: string; decimals: number; }[];
}

export const SellModal: React.FC<SellModalProps> = ({
  isOpen,
  onClose,
  nftToSell,
  sellPrice,
  setSellPrice,
  sellQuantity,
  setSellQuantity,
  selectedPaymentToken,
  setSelectedPaymentToken,
  onSell,
  paymentTokens,
}) => {
  if (!isOpen || !nftToSell) return null;

  const q = parseInt(sellQuantity, 10) || 1;
  const b = parseInt(nftToSell.balance || '1', 10);
  const canList = !!sellPrice && q >= 1 && q <= b;

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 overscroll-contain" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] md:shadow-2xl border-t border-gray-100 dark:border-white/10 md:border p-8 md:p-10 animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-0 duration-300 max-h-[92dvh] overflow-y-auto scrollbar-hide" style={{ touchAction: 'auto' }}>
        {/* Mobile Drag Indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full md:hidden" />
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
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
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
                  <span className="block text-sm font-black dark:text-white">SELL</span>
                  <span className="block text-[10px] text-orange-500 font-bold uppercase tracking-widest">Fixed Price Listing</span>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">OOX</span>
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
                      {paymentTokens.map((t) => (
                        <option key={t.identifier} value={t.identifier}>{t.ticker}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1">Choose your preferred token</p>
              </div>

              {nftToSell.type === 'SFT' && parseInt(nftToSell.balance || '1') > 1 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Set Listing Quantity</label>
                    <button
                      onClick={() => setSellQuantity(nftToSell.balance || '1')}
                      className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline"
                    >
                      Max ({nftToSell.balance})
                    </button>
                  </div>
                  <div className="relative group/input">
                    <input
                      type="number"
                      value={sellQuantity}
                      onChange={(e) => setSellQuantity(e.target.value)}
                      max={nftToSell.balance}
                      min="1"
                      className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onSell}
          disabled={!canList}
          className="w-full py-5 bg-gradient-to-r from-orange-500 to-yellow-500 text-gray-900 font-black rounded-3xl shadow-2xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          <span>List Now</span>
          <DollarSign className="w-5 h-5" />
        </button>
        <p className="text-[10px] text-gray-500 font-bold text-center mt-6 uppercase tracking-widest">Powered by <a href="https://oox.art" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">oox.art</a></p>
      </div>
    </div>
  );
};
