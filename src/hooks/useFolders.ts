'use client';

/* =====================================================
   🥓 BACON WALLET - useFolders Hook
   Folder management with localStorage persistence
   ===================================================== */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Folder,
    Tag,
    NFTOrganization,
    SYSTEM_FOLDERS,
    FOLDER_LIMITS,
    TAG_LIMITS,
    TAG_COLORS,
    SystemFolderID
} from '@/types/folders';
import { NFT } from '@/types';

// Storage keys
const STORAGE_KEYS = {
    folders: 'bacon_folders',
    tags: 'bacon_tags',
    organization: 'bacon_nft_organization',
};

// =====================================================
// Main Hook
// =====================================================

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
    const { isPremium = false, address } = options;

    // State
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [organization, setOrganization] = useState<Map<string, NFTOrganization>>(new Map());
    const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
    const [isInitialized, setIsInitialized] = useState(false);

    // Storage key with address prefix for multi-wallet support
    const getStorageKey = useCallback((key: string) => {
        if (address) {
            return `${key}_${address.slice(0, 10)}`;
        }
        return key;
    }, [address]);

    // =====================================================
    // Initialization & Persistence
    // =====================================================

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            // Load folders
            const storedFolders = localStorage.getItem(getStorageKey(STORAGE_KEYS.folders));
            if (storedFolders) {
                setFolders(JSON.parse(storedFolders));
            } else {
                // Initialize with system folders
                const systemFolders = Object.values(SYSTEM_FOLDERS).map(sf => ({
                    ...sf,
                    nftIds: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                }));
                setFolders(systemFolders);
            }

            // Load tags
            const storedTags = localStorage.getItem(getStorageKey(STORAGE_KEYS.tags));
            if (storedTags) {
                setTags(JSON.parse(storedTags));
            }

            // Load organization
            const storedOrg = localStorage.getItem(getStorageKey(STORAGE_KEYS.organization));
            if (storedOrg) {
                const orgArray: NFTOrganization[] = JSON.parse(storedOrg);
                setOrganization(new Map(orgArray.map(o => [o.nftId, o])));
            }

            setIsInitialized(true);
        } catch (error) {
            console.error('Error loading folder data:', error);
            setIsInitialized(true);
        }
    }, [getStorageKey]);

    // Persist folders
    useEffect(() => {
        if (!isInitialized || typeof window === 'undefined') return;
        localStorage.setItem(getStorageKey(STORAGE_KEYS.folders), JSON.stringify(folders));
    }, [folders, isInitialized, getStorageKey]);

    // Persist tags
    useEffect(() => {
        if (!isInitialized || typeof window === 'undefined') return;
        localStorage.setItem(getStorageKey(STORAGE_KEYS.tags), JSON.stringify(tags));
    }, [tags, isInitialized, getStorageKey]);

    // Persist organization
    useEffect(() => {
        if (!isInitialized || typeof window === 'undefined') return;
        const orgArray = Array.from(organization.values());
        localStorage.setItem(getStorageKey(STORAGE_KEYS.organization), JSON.stringify(orgArray));
    }, [organization, isInitialized, getStorageKey]);

    // =====================================================
    // Derived State
    // =====================================================

    const systemFolders = useMemo(() =>
        folders.filter(f => f.type === 'system'),
        [folders]
    );

    const customFolders = useMemo(() =>
        folders.filter(f => f.type === 'custom'),
        [folders]
    );

    const folderLimit = isPremium ? FOLDER_LIMITS.premium : FOLDER_LIMITS.free;
    const tagLimit = isPremium ? TAG_LIMITS.premium : TAG_LIMITS.free;

    const canCreateFolder = customFolders.length < folderLimit;
    const canCreateTag = tags.length < tagLimit;

    // =====================================================
    // Folder Actions
    // =====================================================

    const createFolder = useCallback((name: string, icon = '📁', color?: string): Folder | null => {
        if (!canCreateFolder) {
            console.warn('Folder limit reached');
            return null;
        }

        const trimmedName = name.trim();
        if (!trimmedName) return null;

        // Check for duplicate names
        if (folders.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
            console.warn('Folder name already exists');
            return null;
        }

        const newFolder: Folder = {
            id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: trimmedName,
            icon,
            type: 'custom',
            color,
            nftIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        setFolders(prev => [...prev, newFolder]);
        return newFolder;
    }, [canCreateFolder, folders]);

    const deleteFolder = useCallback((folderId: string): boolean => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder || folder.type === 'system') {
            return false;
        }

        setFolders(prev => prev.filter(f => f.id !== folderId));

        // Move NFTs back to "all"
        setOrganization(prev => {
            const next = new Map(prev);
            for (const [nftId, org] of next) {
                if (org.folderId === folderId) {
                    next.set(nftId, { ...org, folderId: null });
                }
            }
            return next;
        });

        if (selectedFolderId === folderId) {
            setSelectedFolderId('all');
        }

        return true;
    }, [folders, selectedFolderId]);

    const renameFolder = useCallback((folderId: string, newName: string): boolean => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder || folder.type === 'system') {
            return false;
        }

        const trimmedName = newName.trim();
        if (!trimmedName) return false;

        setFolders(prev => prev.map(f =>
            f.id === folderId
                ? { ...f, name: trimmedName, updatedAt: Date.now() }
                : f
        ));

        return true;
    }, [folders]);

    const selectFolder = useCallback((folderId: string) => {
        setSelectedFolderId(folderId);
    }, []);

    // =====================================================
    // NFT Organization
    // =====================================================

    const getOrCreateOrg = useCallback((nftId: string): NFTOrganization => {
        const existing = organization.get(nftId);
        if (existing) return existing;

        return {
            nftId,
            folderId: null,
            tagIds: [],
            isFavorite: false,
            isSpam: false,
            addedAt: Date.now(),
        };
    }, [organization]);

    const addToFolder = useCallback((nftIds: string[], folderId: string) => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder || folder.type === 'system' || folderId === 'all') return;

        setOrganization(prev => {
            const next = new Map(prev);
            for (const nftId of nftIds) {
                const org = getOrCreateOrg(nftId);
                next.set(nftId, { ...org, folderId, addedAt: Date.now() });
            }
            return next;
        });

        setFolders(prev => prev.map(f => {
            if (f.id === folderId) {
                const newIds = [...new Set([...f.nftIds, ...nftIds])];
                return { ...f, nftIds: newIds, updatedAt: Date.now() };
            }
            // Remove from other custom folders
            if (f.type === 'custom') {
                return { ...f, nftIds: f.nftIds.filter(id => !nftIds.includes(id)) };
            }
            return f;
        }));
    }, [folders, getOrCreateOrg]);

    const removeFromFolder = useCallback((nftIds: string[], folderId: string) => {
        setOrganization(prev => {
            const next = new Map(prev);
            for (const nftId of nftIds) {
                const org = next.get(nftId);
                if (org && org.folderId === folderId) {
                    next.set(nftId, { ...org, folderId: null });
                }
            }
            return next;
        });

        setFolders(prev => prev.map(f =>
            f.id === folderId
                ? { ...f, nftIds: f.nftIds.filter(id => !nftIds.includes(id)), updatedAt: Date.now() }
                : f
        ));
    }, []);

    const toggleFavorite = useCallback((nftId: string): boolean => {
        const org = getOrCreateOrg(nftId);
        const newIsFavorite = !org.isFavorite;

        setOrganization(prev => {
            const next = new Map(prev);
            next.set(nftId, { ...org, isFavorite: newIsFavorite });
            return next;
        });

        // Update favorites folder
        setFolders(prev => prev.map(f => {
            if (f.id === 'favorites') {
                const nftIds = newIsFavorite
                    ? [...f.nftIds, nftId]
                    : f.nftIds.filter(id => id !== nftId);
                return { ...f, nftIds, updatedAt: Date.now() };
            }
            return f;
        }));

        return newIsFavorite;
    }, [getOrCreateOrg]);

    const markAsSpam = useCallback((nftIds: string[]) => {
        setOrganization(prev => {
            const next = new Map(prev);
            for (const nftId of nftIds) {
                const org = getOrCreateOrg(nftId);
                next.set(nftId, { ...org, isSpam: true });
            }
            return next;
        });

        setFolders(prev => prev.map(f => {
            if (f.id === 'spam') {
                const newIds = [...new Set([...f.nftIds, ...nftIds])];
                return { ...f, nftIds: newIds, updatedAt: Date.now() };
            }
            return f;
        }));
    }, [getOrCreateOrg]);

    const unmarkSpam = useCallback((nftIds: string[]) => {
        setOrganization(prev => {
            const next = new Map(prev);
            for (const nftId of nftIds) {
                const org = next.get(nftId);
                if (org) {
                    next.set(nftId, { ...org, isSpam: false });
                }
            }
            return next;
        });

        setFolders(prev => prev.map(f =>
            f.id === 'spam'
                ? { ...f, nftIds: f.nftIds.filter(id => !nftIds.includes(id)), updatedAt: Date.now() }
                : f
        ));
    }, []);

    const autoDetectSpam = useCallback((nfts: NFT[]): number => {
        const SPAM_KEYWORDS = [
            'visit ', 'claim ', 'winner', 'access ', 'gift ', 'airdrop',
            'free mint', 'giveaway', 'congrats', 'reward', '.com', '.net', '.org', '.xyz'
        ];

        const spamIds: string[] = [];

        nfts.forEach(nft => {
            // Skip if already categorized or organized
            if (organization.has(nft.identifier)) return;

            const text = (nft.name + ' ' + (nft.collection || '')).toLowerCase();

            // Check keywords
            const hasKeyword = SPAM_KEYWORDS.some(k => text.includes(k));

            // Check suspicious URL patterns in name
            const hasUrl = /https?:\/\//.test(text) || /www\./.test(text);

            if (hasKeyword || hasUrl) {
                spamIds.push(nft.identifier);
            }
        });

        if (spamIds.length > 0) {
            markAsSpam(spamIds);
        }

        return spamIds.length;
    }, [organization, markAsSpam]);

    // =====================================================
    // Tags
    // =====================================================

    const createTag = useCallback((name: string, color?: string): Tag | null => {
        if (!canCreateTag) {
            console.warn('Tag limit reached');
            return null;
        }

        const trimmedName = name.trim();
        if (!trimmedName) return null;

        const newTag: Tag = {
            id: `tag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: trimmedName,
            color: color || TAG_COLORS[tags.length % TAG_COLORS.length],
            createdAt: Date.now(),
        };

        setTags(prev => [...prev, newTag]);
        return newTag;
    }, [canCreateTag, tags.length]);

    const deleteTag = useCallback((tagId: string) => {
        setTags(prev => prev.filter(t => t.id !== tagId));

        // Remove tag from all NFTs
        setOrganization(prev => {
            const next = new Map(prev);
            for (const [nftId, org] of next) {
                if (org.tagIds.includes(tagId)) {
                    next.set(nftId, { ...org, tagIds: org.tagIds.filter(id => id !== tagId) });
                }
            }
            return next;
        });
    }, []);

    const addTagToNFT = useCallback((nftId: string, tagId: string) => {
        setOrganization(prev => {
            const next = new Map(prev);
            const org = getOrCreateOrg(nftId);
            if (!org.tagIds.includes(tagId)) {
                next.set(nftId, { ...org, tagIds: [...org.tagIds, tagId] });
            }
            return next;
        });
    }, [getOrCreateOrg]);

    const removeTagFromNFT = useCallback((nftId: string, tagId: string) => {
        setOrganization(prev => {
            const next = new Map(prev);
            const org = next.get(nftId);
            if (org) {
                next.set(nftId, { ...org, tagIds: org.tagIds.filter(id => id !== tagId) });
            }
            return next;
        });
    }, []);

    const getTagsForNFT = useCallback((nftId: string): Tag[] => {
        const org = organization.get(nftId);
        if (!org) return [];
        return tags.filter(t => org.tagIds.includes(t.id));
    }, [organization, tags]);

    // =====================================================
    // Query Functions
    // =====================================================

    const isFavorite = useCallback((nftId: string): boolean => {
        return organization.get(nftId)?.isFavorite ?? false;
    }, [organization]);

    const isSpam = useCallback((nftId: string): boolean => {
        return organization.get(nftId)?.isSpam ?? false;
    }, [organization]);

    const getNFTsInFolder = useCallback((folderId: string, allNfts: NFT[]): NFT[] => {
        switch (folderId) {
            case 'all':
                // All NFTs except spam
                return allNfts.filter(nft => !isSpam(nft.identifier));

            case 'favorites':
                return allNfts.filter(nft => isFavorite(nft.identifier));

            case 'high-rarity':
                return allNfts.filter(nft =>
                    nft.rank !== undefined && nft.rank <= 100 && !isSpam(nft.identifier)
                );

            case 'spam':
                return allNfts.filter(nft => isSpam(nft.identifier));

            default:
                // Custom folder
                const folder = folders.find(f => f.id === folderId);
                if (!folder) return [];
                const org = organization.get(folderId);
                return allNfts.filter(nft => {
                    const nftOrg = organization.get(nft.identifier);
                    return nftOrg?.folderId === folderId;
                });
        }
    }, [folders, organization, isFavorite, isSpam]);

    const getFolderCount = useCallback((folderId: string, allNfts: NFT[]): number => {
        return getNFTsInFolder(folderId, allNfts).length;
    }, [getNFTsInFolder]);

    // =====================================================
    // Return
    // =====================================================

    return {
        // Folders
        folders,
        customFolders,
        systemFolders,
        selectedFolderId,

        // Actions
        createFolder,
        deleteFolder,
        renameFolder,
        selectFolder,

        // NFT Organization
        addToFolder,
        removeFromFolder,
        toggleFavorite,
        markAsSpam,
        unmarkSpam,
        autoDetectSpam,

        // Tags
        tags,
        createTag,
        deleteTag,
        addTagToNFT,
        removeTagFromNFT,
        getTagsForNFT,

        // Query
        getNFTsInFolder,
        getFolderCount,
        isFavorite,
        isSpam,

        // Limits
        canCreateFolder,
        canCreateTag,
        folderLimit,
        tagLimit,
    };
}
