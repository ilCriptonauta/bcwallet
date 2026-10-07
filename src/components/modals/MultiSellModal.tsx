import React, { useState, useEffect } from 'react';
import { X, DollarSign, Zap, Check, Layers } from 'lucide-react';
import { NftMedia } from '../NftMedia';
import type { NormalizedNft } from '@/helpers';

export interface MultiSellItem {
  nft: NormalizedNft;
  price: string;
  quantity: string;
}

interface MultiSellModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNfts: NormalizedNft[];
  selectedPaymentToken: string;
  setSelectedPaymentToken: (value: string) => void;
  paymentTokens: { identifier: string; ticker: string; decimals: number; }[];
  onSellMultiple: (items: MultiSellItem[], paymentToken: string) => Promise<void>;
}

export const MultiSellModal: React.FC<MultiSellModalProps> = ({
  isOpen,
  onClose,
  selectedNfts,
  selectedPaymentToken,
  setSelectedPaymentToken,
  paymentTokens,
  onSellMultiple,
}) => {
  const [items, setItems] = useState<MultiSellItem[]>([]);
  const [globalPrice, setGlobalPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedNfts.length > 0) {
      setItems(
        selectedNfts.map((nft) => ({
          nft,
          price: '',
          quantity: '1',
        }))
      );
      setGlobalPrice('');
    }
  }, [selectedNfts]);

  if (!isOpen || selectedNfts.length === 0) return null;

  const handleApplyGlobalPrice = () => {
    if (!globalPrice) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        price: globalPrice,
      }))
    );
  };

  const handleUpdateItemPrice = (identifier: string, price: string) => {
    setItems((prev) =>
      prev.map((item) => (item.nft.identifier === identifier ? { ...item, price } : item))
    );
  };

  const handleUpdateItemQuantity = (identifier: string, quantity: string) => {
    setItems((prev) =>
      prev.map((item) => (item.nft.identifier === identifier ? { ...item, quantity } : item))
    );
  };

  const activeTokenTicker = paymentTokens.find(t => t.identifier === selectedPaymentToken)?.ticker || 'EGLD';

  const validItems = items.filter((item) => {
    const priceNum = parseFloat(item.price);
    const qtyNum = parseInt(item.quantity, 10);
    const maxQty = parseInt(item.nft.balance || '1', 10);
    return !isNaN(priceNum) && priceNum > 0 && !isNaN(qtyNum) && qtyNum >= 1 && qtyNum <= maxQty;
  });

  const canSubmit = validItems.length > 0 && validItems.length === items.length && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSellMultiple(validItems, selectedPaymentToken);
      onClose();
    } catch (err) {
      console.error("MultiSell error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 overscroll-contain" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#151518] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border-t border-gray-100 dark:border-white/10 md:border p-6 md:p-8 animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 max-h-[90dvh] flex flex-col" 
        style={{ touchAction: 'auto' }}
      >
        {/* Drag Bar Mobile */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Layers className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-black dark:text-white">Batch Listing on OOX</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                List {selectedNfts.length} Assets Simultaneously
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Global Controls Section */}
        <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 mb-5 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500 fill-current" />
              <span className="text-xs font-black dark:text-white uppercase tracking-wider">Fast Pricing & Payment</span>
            </div>
            {/* Payment Token Selector */}
            <select
              value={selectedPaymentToken}
              onChange={(e) => setSelectedPaymentToken(e.target.value)}
              className="bg-gray-200 dark:bg-zinc-800 border-none rounded-xl text-xs font-black py-1.5 px-3 cursor-pointer dark:text-white hover:bg-orange-500 hover:text-gray-900 transition-colors"
            >
              {paymentTokens.map((t) => (
                <option key={t.identifier} value={t.identifier}>{t.ticker}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={globalPrice}
              onChange={(e) => setGlobalPrice(e.target.value)}
              placeholder={`Price for all items in ${activeTokenTicker}...`}
              className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:text-white"
            />
            <button
              onClick={handleApplyGlobalPrice}
              className="px-4 py-2.5 bg-orange-500 text-white font-black text-xs rounded-xl hover:bg-orange-600 transition-colors shrink-0"
            >
              Apply to All
            </button>
          </div>
        </div>

        {/* Selected Items List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-6 scrollbar-hide">
          {items.map((item, idx) => {
            const maxQty = parseInt(item.nft.balance || '1', 10);
            return (
              <div
                key={item.nft.identifier}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <NftMedia
                    src={item.nft.imageUrl || `https://picsum.photos/seed/${item.nft.identifier}/150/150`}
                    alt={item.nft.name}
                    mimeType={item.nft.mimeType}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black dark:text-white truncate">{item.nft.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">
                      {item.nft.collection}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.nft.type === 'SFT' && maxQty > 1 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-bold">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        max={maxQty}
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemQuantity(item.nft.identifier, e.target.value)}
                        className="w-14 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-xs font-bold text-center dark:text-white"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={item.price}
                      onChange={(e) => handleUpdateItemPrice(item.nft.identifier, e.target.value)}
                      className="w-28 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold dark:text-white pr-10 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-500">
                      {activeTokenTicker}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-gray-900 font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-sm"
          >
            <span>List {validItems.length} Assets on OOX</span>
            <DollarSign className="w-4 h-4" />
          </button>
          <p className="text-[9px] text-gray-500 font-bold text-center uppercase tracking-widest">
            Batch signing powered by MultiversX Wallet & <a href="https://oox.art" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">oox.art</a>
          </p>
        </div>
      </div>
    </div>
  );
};
