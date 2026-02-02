/* =====================================================
   🥓 BACON WALLET - Custom React Hooks
   Data fetching and state management hooks
   ===================================================== */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { NFT, NFTCollection, Folder, FolderType } from '@/types';
import * as api from '@/services/mx-api';
import { STORAGE_KEYS, APP_CONFIG } from '@/lib/constants';

// ---- Types ----
interface UseAsyncState<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

// ---- useAccount Hook ----
interface AccountData {
    address: string;
    balance: string;
    balanceFormatted: string;
    herotag: string | null;
    shard: number;
}

export function useAccount(address: string | null): UseAsyncState<AccountData> {
    const [data, setData] = useState<AccountData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchAccount = useCallback(async () => {
        if (!address) {
            setData(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const account = await api.getAccount(address);
            setData({
                address: account.address,
                balance: account.balance,
                balanceFormatted: api.formatEGLD(account.balance),
                herotag: account.username || null,
                shard: account.shard,
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch account'));
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchAccount();
    }, [fetchAccount]);

    return { data, isLoading, error, refetch: fetchAccount };
}

// ---- useNFTs Hook ----
interface UseNFTsOptions {
    collections?: string[];
    search?: string;
    pageSize?: number;
}

interface UseNFTsResult extends UseAsyncState<NFT[]> {
    loadMore: () => Promise<void>;
    hasMore: boolean;
    totalCount: number;
}

export function useNFTs(
    address: string | null,
    options: UseNFTsOptions = {}
): UseNFTsResult {
    const { collections, search, pageSize = APP_CONFIG.nftsPerPage } = options;

    const [data, setData] = useState<NFT[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);

    const optionsRef = useRef({ collections, search });

    // Reset when options change
    useEffect(() => {
        const optionsChanged =
            JSON.stringify(optionsRef.current) !== JSON.stringify({ collections, search });

        if (optionsChanged) {
            optionsRef.current = { collections, search };
            setData([]);
            setPage(0);
        }
    }, [collections, search]);

    const fetchNFTs = useCallback(async (reset = false) => {
        if (!address) {
            setData([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const currentPage = reset ? 0 : page;
            const result = await api.getNFTs(address, {
                from: currentPage * pageSize,
                size: pageSize,
                collections,
                search,
            });

            setData(prev => reset ? result.items : [...prev, ...result.items]);
            setHasMore(result.hasMore);
            setTotalCount(result.count);

            if (!reset && result.items.length > 0) {
                setPage(p => p + 1);
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch NFTs'));
        } finally {
            setIsLoading(false);
        }
    }, [address, page, pageSize, collections, search]);

    const refetch = useCallback(async () => {
        setPage(0);
        await fetchNFTs(true);
    }, [fetchNFTs]);

    const loadMore = useCallback(async () => {
        if (!isLoading && hasMore) {
            await fetchNFTs(false);
        }
    }, [isLoading, hasMore, fetchNFTs]);

    // Initial fetch
    useEffect(() => {
        refetch();
    }, [address, collections, search]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data: data.length > 0 ? data : null,
        isLoading,
        error,
        refetch,
        loadMore,
        hasMore,
        totalCount
    };
}

// ---- useCollections Hook ----
export function useCollections(address: string | null): UseAsyncState<NFTCollection[]> {
    const [data, setData] = useState<NFTCollection[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchCollections = useCallback(async () => {
        if (!address) {
            setData(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const collections = await api.getAccountCollections(address);
            setData(collections);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch collections'));
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    return { data, isLoading, error, refetch: fetchCollections };
}

// ---- useNFTCountByCollection Hook ----
export function useNFTCountByCollection(
    address: string | null
): UseAsyncState<Record<string, number>> {
    const [data, setData] = useState<Record<string, number> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchCounts = useCallback(async () => {
        if (!address) {
            setData(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const counts = await api.getNFTCountByCollection(address);
            setData(counts);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch counts'));
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    return { data, isLoading, error, refetch: fetchCounts };
}

// ---- useFolders Hook ----
interface UseFoldersResult {
    folders: Folder[];
    createFolder: (name: string, type: FolderType) => Folder;
    updateFolder: (id: string, updates: Partial<Folder>) => void;
    deleteFolder: (id: string) => void;
    addNFTToFolder: (folderId: string, nftId: string) => void;
    removeNFTFromFolder: (folderId: string, nftId: string) => void;
    getFolderNFTs: (folderId: string, allNFTs: NFT[]) => NFT[];
    canCreateFolder: boolean;
    maxFolders: number;
}

export function useFolders(isPremium = false): UseFoldersResult {
    const [folders, setFolders] = useState<Folder[]>([]);
    const maxFolders = isPremium ? Infinity : APP_CONFIG.freeTierMaxFolders;

    // Load folders from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.folders);
            if (saved) {
                try {
                    setFolders(JSON.parse(saved));
                } catch {
                    console.error('Failed to parse saved folders');
                }
            }
        }
    }, []);

    // Save folders to localStorage on change
    useEffect(() => {
        if (typeof window !== 'undefined' && folders.length > 0) {
            localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(folders));
        }
    }, [folders]);

    const createFolder = useCallback((name: string, type: FolderType): Folder => {
        const newFolder: Folder = {
            id: `folder_${Date.now()}`,
            name,
            type,
            nftIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        setFolders(prev => [...prev, newFolder]);
        return newFolder;
    }, []);

    const updateFolder = useCallback((id: string, updates: Partial<Folder>) => {
        setFolders(prev =>
            prev.map(folder =>
                folder.id === id
                    ? { ...folder, ...updates, updatedAt: Date.now() }
                    : folder
            )
        );
    }, []);

    const deleteFolder = useCallback((id: string) => {
        setFolders(prev => prev.filter(folder => folder.id !== id));
    }, []);

    const addNFTToFolder = useCallback((folderId: string, nftId: string) => {
        setFolders(prev =>
            prev.map(folder =>
                folder.id === folderId && !folder.nftIds.includes(nftId)
                    ? { ...folder, nftIds: [...folder.nftIds, nftId], updatedAt: Date.now() }
                    : folder
            )
        );
    }, []);

    const removeNFTFromFolder = useCallback((folderId: string, nftId: string) => {
        setFolders(prev =>
            prev.map(folder =>
                folder.id === folderId
                    ? { ...folder, nftIds: folder.nftIds.filter(id => id !== nftId), updatedAt: Date.now() }
                    : folder
            )
        );
    }, []);

    const getFolderNFTs = useCallback((folderId: string, allNFTs: NFT[]): NFT[] => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return [];

        if (folder.type === 'classic') {
            // Classic folders group by collection
            return allNFTs.filter(nft => nft.collection === folder.name);
        }

        // Manual folders use explicit nftIds
        return allNFTs.filter(nft => folder.nftIds.includes(nft.identifier));
    }, [folders]);

    return {
        folders,
        createFolder,
        updateFolder,
        deleteFolder,
        addNFTToFolder,
        removeNFTFromFolder,
        getFolderNFTs,
        canCreateFolder: folders.length < maxFolders,
        maxFolders,
    };
}

// ---- useSpamDetection Hook ----
interface UseSpamDetectionResult {
    spamNFTs: NFT[];
    isAnalyzing: boolean;
    analyzeNFTs: (nfts: NFT[]) => void;
    markAsNotSpam: (nftId: string) => void;
    markedNotSpam: Set<string>;
}

export function useSpamDetection(): UseSpamDetectionResult {
    const [spamNFTs, setSpamNFTs] = useState<NFT[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [markedNotSpam, setMarkedNotSpam] = useState<Set<string>>(new Set());

    const analyzeNFTs = useCallback((nfts: NFT[]) => {
        setIsAnalyzing(true);

        // Simulate async analysis
        setTimeout(() => {
            const detected = api.detectSpamNFTs(nfts);
            const filtered = detected.filter(nft => !markedNotSpam.has(nft.identifier));
            setSpamNFTs(filtered);
            setIsAnalyzing(false);
        }, 100);
    }, [markedNotSpam]);

    const markAsNotSpam = useCallback((nftId: string) => {
        setMarkedNotSpam(prev => new Set([...prev, nftId]));
        setSpamNFTs(prev => prev.filter(nft => nft.identifier !== nftId));
    }, []);

    return {
        spamNFTs,
        isAnalyzing,
        analyzeNFTs,
        markAsNotSpam,
        markedNotSpam,
    };
}

// ---- useDebounce Hook ----
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

// ---- useLocalStorage Hook ----
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
}

// ---- useMediaQuery Hook ----
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}

// ---- useIsMobile Hook ----
export function useIsMobile(): boolean {
    return useMediaQuery('(max-width: 768px)');
}

// ---- useTransactions Hook ----
export function useTransactions(address: string | null, size = 5): UseAsyncState<api.Transaction[]> {
    const [data, setData] = useState<api.Transaction[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchTransactions = useCallback(async () => {
        if (!address) {
            setData(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const txs = await api.getTransactions(address, { size });
            setData(txs);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
        } finally {
            setIsLoading(false);
        }
    }, [address, size]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return { data, isLoading, error, refetch: fetchTransactions };
}

// ---- useTokens Hook ----
export function useTokens(address: string | null): UseAsyncState<api.Token[]> {
    const [data, setData] = useState<api.Token[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchTokens = useCallback(async () => {
        if (!address) {
            setData(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const tokens = await api.getTokens(address);
            setData(tokens);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch tokens'));
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchTokens();
    }, [fetchTokens]);

    return { data, isLoading, error, refetch: fetchTokens };
}

