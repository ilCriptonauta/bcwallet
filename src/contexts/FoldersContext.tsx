'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
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
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { useNFTsContext } from './NFTsContext';

// Storage keys
const STORAGE_KEYS = {
    folders: 'bacon_folders',
    tags: 'bacon_tags',
    organization: 'bacon_nft_organization',
};

interface FoldersContextType {
    // State
    folders: Folder[];
    customFolders: Folder[];
    systemFolders: Folder[];
    selectedFolderId: string;
    tags: Tag[];
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

    // Tags actions
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

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ children }: { children: ReactNode }) {
    const { address } = useGetAccount();
    const { allNfts } = useNFTsContext();
    const isPremium = false; // Hardcoded for now, can be passed as prop or fetched

    // State
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [organization, setOrganization] = useState<Map<string, NFTOrganization>>(new Map());
    const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
    const [isInitialized, setIsInitialized] = useState(false);

    // Storage key with address prefix
    const getStorageKey = useCallback((key: string) => {
        if (address) {
            return `${key}_${address.slice(0, 10)}`;
        }
        return key;
    }, [address]);

    // Initialization & Load from LocalStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const storedFolders = localStorage.getItem(getStorageKey(STORAGE_KEYS.folders));
            if (storedFolders) {
                setFolders(JSON.parse(storedFolders));
            } else {
                const initialSystemFolders = Object.values(SYSTEM_FOLDERS).map(sf => ({
                    ...sf,
                    nftIds: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                }));
                setFolders(initialSystemFolders);
            }

            const storedTags = localStorage.getItem(getStorageKey(STORAGE_KEYS.tags));
            if (storedTags) {
                setTags(JSON.parse(storedTags));
            }

            const storedOrg = localStorage.getItem(getStorageKey(STORAGE_KEYS.organization));
            if (storedOrg) {
                const orgArray: NFTOrganization[] = JSON.parse(storedOrg);
                setOrganization(new Map(orgArray.map(o => [o.nftId, o])));
            }

            setIsInitialized(true);
        } catch (error) {
            console.error('Error loading folders context:', error);
            setIsInitialized(true);
        }
    }, [getStorageKey]);

    // Persistence to LocalStorage
    useEffect(() => {
        if (!isInitialized || typeof window === 'undefined') return;
        localStorage.setItem(getStorageKey(STORAGE_KEYS.folders), JSON.stringify(folders));
    }, [folders, isInitialized, getStorageKey]);

    useEffect(() => {
        if (!isInitialized || typeof window === 'undefined') return;
        localStorage.setItem(getStorageKey(STORAGE_KEYS.tags), JSON.stringify(tags));
    }, [tags, isInitialized, getStorageKey]);

    useEffect(() => {
        if (!isInitialized || typeof window === 'undefined') return;
        const orgArray = Array.from(organization.values());
        localStorage.setItem(getStorageKey(STORAGE_KEYS.organization), JSON.stringify(orgArray));
    }, [organization, isInitialized, getStorageKey]);

    // Derived values
    const systemFolders = useMemo(() => folders.filter(f => f.type === 'system'), [folders]);
    const customFolders = useMemo(() => folders.filter(f => f.type === 'custom'), [folders]);
    const folderLimit = isPremium ? FOLDER_LIMITS.premium : FOLDER_LIMITS.free;
    const tagLimit = isPremium ? TAG_LIMITS.premium : TAG_LIMITS.free;
    const canCreateFolder = customFolders.length < folderLimit;
    const canCreateTag = tags.length < tagLimit;

    // Helper functions for counts (moved here for use in useMemo)
    const isFavoriteLocal = useCallback((nftId: string) => organization.get(nftId)?.isFavorite ?? false, [organization]);
    const isSpamLocal = useCallback((nftId: string) => organization.get(nftId)?.isSpam ?? false, [organization]);

    const getNFTsInFolderLocal = useCallback((folderId: string, nfts: NFT[]) => {
        switch (folderId) {
            case 'all': return nfts.filter(nft => !isSpamLocal(nft.identifier));
            case 'favorites': return nfts.filter(nft => isFavoriteLocal(nft.identifier));
            case 'high-rarity': return nfts.filter(nft => nft.rank !== undefined && nft.rank <= 100 && !isSpamLocal(nft.identifier));
            case 'spam': return nfts.filter(nft => isSpamLocal(nft.identifier));
            default:
                return nfts.filter(nft => organization.get(nft.identifier)?.folderId === folderId);
        }
    }, [organization, isFavoriteLocal, isSpamLocal]);

    // REAL-TIME COUNTS
    const folderCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        folders.forEach(f => {
            counts[f.id] = getNFTsInFolderLocal(f.id, allNfts).length;
        });
        return counts;
    }, [folders, allNfts, getNFTsInFolderLocal]);

    // Actions
    const createFolder = useCallback((name: string, icon = '📁', color?: string) => {
        if (!canCreateFolder) return null;
        const trimmedName = name.trim();
        if (!trimmedName || folders.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) return null;

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

    const deleteFolder = useCallback((folderId: string) => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder || folder.type === 'system') return false;

        setFolders(prev => prev.filter(f => f.id !== folderId));
        setOrganization(prev => {
            const next = new Map(prev);
            for (const [nftId, org] of next) {
                if (org.folderId === folderId) {
                    next.set(nftId, { ...org, folderId: null });
                }
            }
            return next;
        });

        if (selectedFolderId === folderId) setSelectedFolderId('all');
        return true;
    }, [folders, selectedFolderId]);

    const renameFolder = useCallback((folderId: string, newName: string) => {
        const trimmedName = newName.trim();
        if (!trimmedName) return false;
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: trimmedName, updatedAt: Date.now() } : f));
        return true;
    }, []);

    const selectFolder = useCallback((folderId: string) => setSelectedFolderId(folderId), []);

    const getOrCreateOrg = useCallback((nftId: string): NFTOrganization => {
        return organization.get(nftId) || {
            nftId,
            folderId: null,
            tagIds: [],
            isFavorite: false,
            isSpam: false,
            addedAt: Date.now(),
        };
    }, [organization]);

    const addToFolder = useCallback((nftIds: string[], folderId: string) => {
        if (folderId === 'all') return;
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
            if (f.type === 'custom') {
                return { ...f, nftIds: f.nftIds.filter(id => !nftIds.includes(id)) };
            }
            return f;
        }));
    }, [getOrCreateOrg]);

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
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, nftIds: f.nftIds.filter(id => !nftIds.includes(id)), updatedAt: Date.now() } : f));
    }, []);

    const toggleFavorite = useCallback((nftId: string) => {
        const org = getOrCreateOrg(nftId);
        const newIsFavorite = !org.isFavorite;
        setOrganization(prev => {
            const next = new Map(prev);
            next.set(nftId, { ...org, isFavorite: newIsFavorite });
            return next;
        });
        setFolders(prev => prev.map(f => {
            if (f.id === 'favorites') {
                const nftIds = newIsFavorite ? [...f.nftIds, nftId] : f.nftIds.filter(id => id !== nftId);
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
                if (org) next.set(nftId, { ...org, isSpam: false });
            }
            return next;
        });
        setFolders(prev => prev.map(f => f.id === 'spam' ? { ...f, nftIds: f.nftIds.filter(id => !nftIds.includes(id)), updatedAt: Date.now() } : f));
    }, []);

    const autoDetectSpam = useCallback((nfts: NFT[]) => {
        const SPAM_KEYWORDS = ['visit ', 'claim ', 'winner', 'gift ', 'airdrop', 'free mint', '.com', '.net'];
        const spamIds: string[] = [];
        nfts.forEach(nft => {
            if (organization.has(nft.identifier)) return;
            const text = (nft.name + ' ' + (nft.collection || '')).toLowerCase();
            if (SPAM_KEYWORDS.some(k => text.includes(k)) || /https?:\/\//.test(text)) {
                spamIds.push(nft.identifier);
            }
        });
        if (spamIds.length > 0) markAsSpam(spamIds);
        return spamIds.length;
    }, [organization, markAsSpam]);

    const createTag = useCallback((name: string, color?: string) => {
        if (!canCreateTag) return null;
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
            if (!org.tagIds.includes(tagId)) next.set(nftId, { ...org, tagIds: [...org.tagIds, tagId] });
            return next;
        });
    }, [getOrCreateOrg]);

    const removeTagFromNFT = useCallback((nftId: string, tagId: string) => {
        setOrganization(prev => {
            const next = new Map(prev);
            const org = next.get(nftId);
            if (org) next.set(nftId, { ...org, tagIds: org.tagIds.filter(id => id !== tagId) });
            return next;
        });
    }, []);

    const getTagsForNFT = useCallback((nftId: string) => {
        const org = organization.get(nftId);
        return org ? tags.filter(t => org.tagIds.includes(t.id)) : [];
    }, [organization, tags]);

    const isFavorite = useCallback((nftId: string) => isFavoriteLocal(nftId), [isFavoriteLocal]);
    const isSpam = useCallback((nftId: string) => isSpamLocal(nftId), [isSpamLocal]);

    const getNFTsInFolder = useCallback((folderId: string, nfts: NFT[]) => {
        return getNFTsInFolderLocal(folderId, nfts);
    }, [getNFTsInFolderLocal]);

    const getFolderCount = useCallback((folderId: string, nfts: NFT[]) => getNFTsInFolder(folderId, nfts).length, [getNFTsInFolder]);

    const value = {
        folders, customFolders, systemFolders, selectedFolderId, tags, folderCounts,
        createFolder, deleteFolder, renameFolder, selectFolder,
        addToFolder, removeFromFolder, toggleFavorite, markAsSpam, unmarkSpam, autoDetectSpam,
        createTag, deleteTag, addTagToNFT, removeTagFromNFT, getTagsForNFT,
        getNFTsInFolder, getFolderCount, isFavorite, isSpam,
        canCreateFolder, canCreateTag, folderLimit, tagLimit
    };

    return <FoldersContext.Provider value={value}>{children}</FoldersContext.Provider>;
}

export function useFoldersContext() {
    const context = useContext(FoldersContext);
    if (context === undefined) {
        throw new Error('useFoldersContext must be used within a FoldersProvider');
    }
    return context;
}
