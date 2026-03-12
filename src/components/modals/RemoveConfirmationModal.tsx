import React from 'react';
import { Trash2 } from 'lucide-react';

interface RemoveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: () => void;
}

export const RemoveConfirmationModal: React.FC<RemoveConfirmationModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 overscroll-contain" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] md:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-t border-gray-100 dark:border-white/10 md:border p-8 pb-10 md:p-10 animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-0 duration-300 max-h-[92dvh] overflow-y-auto scrollbar-hide" style={{ touchAction: 'auto' }}>
        {/* Mobile Drag Indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full md:hidden" />
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-black dark:text-white">Remove Items</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Required Action</p>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-relaxed mb-8">
          The selected {selectedCount > 1 ? 'items' : 'item'} will be removed from the folder but will remain in your wallet. Are you sure you want to proceed?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center py-3 md:py-4 px-6 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 dark:text-white rounded-[1.5rem] font-black text-sm md:text-base transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full flex items-center justify-center py-3 md:py-4 px-6 bg-red-500 hover:bg-red-600 text-white rounded-[1.5rem] font-black text-sm md:text-base hover:scale-[1.02] shadow-xl shadow-red-500/20 transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
