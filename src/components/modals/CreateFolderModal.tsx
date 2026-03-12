import React from 'react';
import { X, Plus } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderTitle: string;
  setFolderTitle: (title: string) => void;
  folderDesc: string;
  setFolderDesc: (desc: string) => void;
  handleCreateFolder: () => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  folderTitle,
  setFolderTitle,
  folderDesc,
  setFolderDesc,
  handleCreateFolder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 overscroll-contain" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] md:shadow-2xl border-t border-gray-100 dark:border-white/10 md:border p-8 md:p-10 animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-0 duration-300 max-h-[92dvh] overflow-y-auto scrollbar-hide" style={{ touchAction: 'auto' }}>
        {/* Mobile Drag Indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full md:hidden" />
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
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
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
  );
};
