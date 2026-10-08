'use client';

import React from 'react';
import { X, DollarSign, Send, Folder, Flame, Trash2 } from 'lucide-react';
import type { NormalizedNft } from '@/helpers';
import type { UserFolder } from './types';

interface MultiSelectFloatingBarProps {
  selectedNfts: NormalizedNft[];
  activeFolder: UserFolder | null;
  cancelSelection: () => void;
  onOpenMultiSell: () => void;
  onOpenMultiSend: () => void;
  onOpenMoveModal: () => void;
  onOpenMultiBurn: () => void;
  onOpenRemoveConfirmation: () => void;
}

export const MultiSelectFloatingBar: React.FC<MultiSelectFloatingBarProps> = ({
  selectedNfts,
  activeFolder,
  cancelSelection,
  onOpenMultiSell,
  onOpenMultiSend,
  onOpenMoveModal,
  onOpenMultiBurn,
  onOpenRemoveConfirmation,
}) => {
  if (selectedNfts.length === 0) return null;

  return (
    <>
      {/* Mobile Bottom Sheet (< md) */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-[9999] bg-white/95 dark:bg-[#121215]/95 backdrop-blur-2xl border-t border-gray-200 dark:border-white/10 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-300">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-900 dark:text-white">
                {selectedNfts.length} Selected
              </span>
              <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                Multi-Select
              </span>
            </div>
            <button
              onClick={cancelSelection}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={onOpenMultiSell}
              className="flex flex-col items-center justify-center py-2.5 px-2 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 font-black text-xs rounded-2xl active:scale-95 transition-all shadow-md shadow-orange-500/20 gap-1"
            >
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
              <span>List ({selectedNfts.length})</span>
            </button>

            <button
              onClick={onOpenMultiSend}
              className="flex flex-col items-center justify-center py-2.5 px-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white font-bold text-xs rounded-2xl border border-gray-200 dark:border-white/10 active:scale-95 transition-all gap-1"
            >
              <Send className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              <span>Send</span>
            </button>

            <button
              onClick={onOpenMoveModal}
              className="flex flex-col items-center justify-center py-2.5 px-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white font-bold text-xs rounded-2xl border border-gray-200 dark:border-white/10 active:scale-95 transition-all gap-1"
            >
              <Folder className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Move</span>
            </button>

            <button
              onClick={onOpenMultiBurn}
              className="flex flex-col items-center justify-center py-2.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 font-bold text-xs rounded-2xl border border-red-500/20 active:scale-95 transition-all gap-1"
            >
              <Flame className="w-4 h-4 text-red-500" />
              <span>Burn</span>
            </button>

            {activeFolder && (
              <button
                onClick={onOpenRemoveConfirmation}
                className="flex flex-col items-center justify-center py-2.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 font-bold text-xs rounded-2xl border border-red-500/20 active:scale-95 transition-all gap-1"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Floating Bar (>= md) */}
      <div className="max-md:hidden fixed bottom-8 inset-x-0 z-[9999] flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-[#121215] dark:bg-[#121215] border border-white/20 rounded-full px-6 py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center gap-6 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={cancelSelection}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              aria-label="Cancel selection"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-black text-white whitespace-nowrap">
                {selectedNfts.length} Selected
              </span>
              <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-widest bg-orange-500/20 px-2.5 py-0.5 rounded-full border border-orange-500/30 whitespace-nowrap">
                Multi-Select
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenMultiSell}
              className="flex items-center justify-center px-5 h-[44px] bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-gray-950 rounded-full font-black text-sm hover:scale-105 transition-all shadow-lg shadow-orange-500/25 gap-1.5 whitespace-nowrap"
            >
              <DollarSign className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>List on OOX ({selectedNfts.length})</span>
            </button>

            <button
              onClick={onOpenMultiSend}
              className="flex items-center justify-center px-5 h-[44px] bg-white/10 hover:bg-white/15 text-white rounded-full font-bold text-sm hover:scale-105 transition-all border border-white/10 gap-1.5 whitespace-nowrap"
            >
              <Send className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Send</span>
            </button>

            <button
              onClick={onOpenMoveModal}
              className="flex items-center justify-center px-5 h-[44px] bg-white/10 hover:bg-white/15 text-white rounded-full font-bold text-sm hover:scale-105 transition-all border border-white/10 gap-1.5 whitespace-nowrap"
            >
              <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Move</span>
            </button>

            <button
              onClick={onOpenMultiBurn}
              className="flex items-center justify-center px-4 h-[44px] bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-full font-bold text-sm hover:scale-105 transition-all border border-red-500/30 gap-1.5 whitespace-nowrap"
            >
              <Flame className="w-4 h-4 text-red-400 shrink-0" />
              <span>Burn</span>
            </button>

            {activeFolder && (
              <button
                onClick={onOpenRemoveConfirmation}
                className="flex items-center justify-center px-4 h-[44px] bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-full font-bold text-sm hover:scale-105 transition-all border border-red-500/30 gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
