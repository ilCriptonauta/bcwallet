import React, { useState, useEffect } from 'react';
import { X, Flame, AlertTriangle } from 'lucide-react';
import { NftMedia } from '../NftMedia';
import type { NormalizedNft } from '@/helpers';

export interface MultiBurnItem {
  nft: NormalizedNft;
  quantity: string;
}

interface MultiBurnModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNfts: NormalizedNft[];
  onBurnMultiple: (items: MultiBurnItem[]) => Promise<void>;
}

export const MultiBurnModal: React.FC<MultiBurnModalProps> = ({
  isOpen,
  onClose,
  selectedNfts,
  onBurnMultiple,
}) => {
  const [items, setItems] = useState<MultiBurnItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConfirmedWarning, setHasConfirmedWarning] = useState(false);

  useEffect(() => {
    if (selectedNfts.length > 0) {
      setItems(
        selectedNfts.map((nft) => ({
          nft,
          quantity: '1',
        }))
      );
      setHasConfirmedWarning(false);
    }
  }, [selectedNfts]);

  if (!isOpen || selectedNfts.length === 0) return null;

  const handleUpdateItemQuantity = (identifier: string, quantity: string) => {
    setItems((prev) =>
      prev.map((item) => (item.nft.identifier === identifier ? { ...item, quantity } : item))
    );
  };

  const canSubmit = hasConfirmedWarning && items.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onBurnMultiple(items);
      onClose();
    } catch (err) {
      console.error("MultiBurn error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 overscroll-contain" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={onClose} />
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-[#151518] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border-t border-red-500/20 md:border p-6 md:p-8 animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 max-h-[90dvh] flex flex-col"
        style={{ touchAction: 'auto' }}
      >
        {/* Mobile Drag Bar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-black dark:text-white">Batch Asset Burn</h3>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                Permanently Destroy {selectedNfts.length} Assets
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5 shrink-0 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-red-400 leading-relaxed">
            Warning: Burning assets is IRREVERSIBLE. The selected NFTs/SFTs will be removed from your wallet and destroyed forever on the MultiversX blockchain.
          </p>
        </div>

        {/* Selected Items List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-5 scrollbar-hide">
          {items.map((item) => {
            const maxQty = parseInt(item.nft.balance || '1', 10);
            return (
              <div
                key={item.nft.identifier}
                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <NftMedia
                    src={item.nft.imageUrl || `https://picsum.photos/seed/${item.nft.identifier}/150/150`}
                    alt={item.nft.name}
                    mimeType={item.nft.mimeType}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black dark:text-white truncate">{item.nft.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">
                      {item.nft.collection}
                    </p>
                  </div>
                </div>

                {item.nft.type === 'SFT' && maxQty > 1 && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="text-[10px] text-gray-400 font-bold">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      max={maxQty}
                      value={item.quantity}
                      onChange={(e) => handleUpdateItemQuantity(item.nft.identifier, e.target.value)}
                      className="w-14 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl px-2 py-1 text-xs font-bold text-center dark:text-white"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-center gap-3 mb-5 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={hasConfirmedWarning}
            onChange={(e) => setHasConfirmedWarning(e.target.checked)}
            className="w-4 h-4 rounded text-red-500 focus:ring-red-500 border-white/20 bg-white/5 cursor-pointer"
          />
          <span className="text-xs font-bold dark:text-white/80">
            I understand these {items.length} assets will be permanently destroyed.
          </span>
        </label>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-sm"
        >
          <span>Burn {items.length} Assets Permanently</span>
          <Flame className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
