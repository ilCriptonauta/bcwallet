/* =====================================================
   🥓 BACON WALLET - Folder & Tag Types
   Type definitions for NFT organization system
   ===================================================== */

export type FolderType = 'system' | 'custom';
export type SystemFolderID = 'all' | 'favorites' | 'high-rarity' | 'spam';

export interface Folder {
    id: string;
    name: string;
    icon: string;
    type: FolderType;
    color?: string;
    nftIds: string[];  // NFT identifiers in this folder
    createdAt: number;
    updatedAt: number;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: number;
}

export interface NFTOrganization {
    nftId: string;
    folderId: string | null;
    tagIds: string[];
    isFavorite: boolean;
    isSpam: boolean;
    notes?: string;
    addedAt: number;
}

// System folders with default configuration
export const SYSTEM_FOLDERS: Record<SystemFolderID, Omit<Folder, 'nftIds' | 'createdAt' | 'updatedAt'>> = {
    all: {
        id: 'all',
        name: 'All NFTs',
        icon: '🖼️',
        type: 'system',
    },
    favorites: {
        id: 'favorites',
        name: 'Favorites',
        icon: '⭐',
        type: 'system',
        color: '#E9C46A',
    },
    'high-rarity': {
        id: 'high-rarity',
        name: 'High Rarity',
        icon: '💎',
        type: 'system',
        color: '#6366F1',
    },
    spam: {
        id: 'spam',
        name: 'Spam Bin',
        icon: '🗑️',
        type: 'system',
        color: '#6B7280',
    },
};

// Default tag colors
export const TAG_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#14B8A6', // Teal
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
];

// Premium limits
export const FOLDER_LIMITS = {
    free: 5,
    premium: Infinity,
};

export const TAG_LIMITS = {
    free: 10,
    premium: Infinity,
};
