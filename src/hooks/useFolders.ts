'use client';

/* =====================================================
   🥓 BACON WALLET - useFolders Hook
   Now acts as a consumer for FoldersContext
   ===================================================== */

import { useFoldersContext } from '@/contexts/FoldersContext';
import { Folder, Tag } from '@/types/folders';
import { NFT } from '@/types';

export interface UseFoldersOptions {
    isPremium?: boolean;
    address?: string | null;
}

export interface UseFoldersResult {
    // Folders
    folders: Folder[];
    customFolders: Folder[];
    systemFolders: Folder[];
    selectedFolderId: string;
    folderCounts: Record<string, number>;

    // Actions
    createFolder: (name: string, icon?: string, color?: string) => Folder | null;
    deleteFolder: (folderId: string) => boolean;
    renameFolder: (folderId: string, newName: string) => boolean;
    selectFolder: (folderId: string) => void;

    // NFT Organization
    addToFolder: (nftIds: string[], folderId: string) => void;
    removeFromFolder: (nftIds: string[], folderId: string) => void;
    toggleFavorite: (nftId: string) => boolean;
    markAsSpam: (nftIds: string[]) => void;
    unmarkSpam: (nftIds: string[]) => void;
    autoDetectSpam: (nfts: NFT[]) => number;

    // Tags
    tags: Tag[];
    createTag: (name: string, color?: string) => Tag | null;
    deleteTag: (tagId: string) => void;
    addTagToNFT: (nftId: string, tagId: string) => void;
    removeTagFromNFT: (nftId: string, tagId: string) => void;
    getTagsForNFT: (nftId: string) => Tag[];

    // Query
    getNFTsInFolder: (folderId: string, allNfts: NFT[]) => NFT[];
    getFolderCount: (folderId: string, allNfts: NFT[]) => number;
    isFavorite: (nftId: string) => boolean;
    isSpam: (nftId: string) => boolean;

    // Limits
    canCreateFolder: boolean;
    canCreateTag: boolean;
    folderLimit: number;
    tagLimit: number;
}

export function useFolders(options: UseFoldersOptions = {}): UseFoldersResult {
    return useFoldersContext();
}
