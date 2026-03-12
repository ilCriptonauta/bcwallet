import React from 'react';
import { X, Folder, Plus } from 'lucide-react';

interface FolderType {
  id: string;
  name: string;
  itemCount: number;
}

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxFolders: number;
  firebaseFolders: FolderType[];
  isSelectionMode: boolean;
  handleMoveMultipleNfts: (folderId: string) => void;
  handleMoveNft: (folderId: string) => void;
  setIsCreateModalOpen: (isOpen: boolean) => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  onClose,
  maxFolders,
  firebaseFolders,
  isSelectionMode,
  handleMoveMultipleNfts,
  handleMoveNft,
  setIsCreateModalOpen,
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
              <Folder className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-black dark:text-white">Move to Folder</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Organize your collection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
          <button
            onClick={() => {
              if (firebaseFolders.length >= maxFolders) {
                alert(`You've reached the limit of ${maxFolders} folders!`);
                return;
              }
              onClose();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border-2 border-dashed border-orange-200 dark:border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-sm text-orange-500 group-hover:shadow-orange-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-orange-600 dark:text-orange-400 text-sm">Create New Folder</h4>
              <p className="text-[10px] text-orange-500/70 font-bold uppercase tracking-widest">Move instantly</p>
            </div>
          </button>

          {firebaseFolders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                if (isSelectionMode) {
                  handleMoveMultipleNfts(folder.id);
                } else {
                  handleMoveNft(folder.id);
                }
              }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Folder className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-gray-900 dark:text-white text-sm">{folder.name}</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{folder.itemCount} items</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
