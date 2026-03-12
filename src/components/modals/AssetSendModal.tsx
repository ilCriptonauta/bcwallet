import React from 'react';
import { X, Send } from 'lucide-react';
import { NftMedia } from '../NftMedia';
import type { NormalizedNft } from '@/helpers';

interface AssetSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftToSend: NormalizedNft | null;
  recipient: string;
  setRecipient: (value: string) => void;
  sendQuantity: string;
  setSendQuantity: (value: string) => void;
  onSend: () => void;
}

export const AssetSendModal: React.FC<AssetSendModalProps> = ({
  isOpen,
  onClose,
  nftToSend,
  recipient,
  setRecipient,
  sendQuantity,
  setSendQuantity,
  onSend,
}) => {
  if (!isOpen || !nftToSend) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 overscroll-contain" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] md:shadow-2xl border-t border-gray-100 dark:border-white/10 md:border p-8 md:p-10 animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-0 duration-300 max-h-[92dvh] overflow-y-auto scrollbar-hide" style={{ touchAction: 'auto' }}>
        {/* Mobile Drag Indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full md:hidden" />
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
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
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
                <button onClick={() => setSendQuantity(nftToSend.balance || '1')} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Max</button>
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
            onClick={onSend}
            disabled={!recipient}
            className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            <span>Send Now</span>
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
