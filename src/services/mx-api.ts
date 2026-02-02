/* =====================================================
   🥓 BACON WALLET - MultiversX API Service
   Core API layer for fetching blockchain data
   ===================================================== */

import { NFT, NFTCollection, PaginatedResponse } from '@/types';
import { NETWORK_CONFIG, APP_CONFIG } from '@/lib/constants';

// ---- Types ----
interface AccountInfo {
    address: string;
    balance: string;
    nonce: number;
    shard: number;
    username?: string; // Herotag
    txCount: number;
    scrCount: number;
}

interface FetchOptions {
    from?: number;
    size?: number;
    search?: string;
    collections?: string[];
    withSupply?: boolean;
}

// ---- Cache Implementation ----
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string, ttl: number): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() - entry.timestamp > ttl) {
        cache.delete(key);
        return null;
    }

    return entry.data;
}

function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// ---- API Fetch Helper ----
async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${NETWORK_CONFIG.apiUrl}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
}

// ---- Account APIs ----

/**
 * Fetch account information
 */
export async function getAccount(address: string): Promise<AccountInfo> {
    const cacheKey = `account:${address}`;
    const cached = getCached<AccountInfo>(cacheKey, APP_CONFIG.cacheTTL.balance);
    if (cached) return cached;

    const data = await apiFetch<AccountInfo>(`/accounts/${address}`);
    setCache(cacheKey, data);
    return data;
}

/**
 * Fetch account balance (EGLD)
 */
export async function getAccountBalance(address: string): Promise<string> {
    const account = await getAccount(address);
    return account.balance;
}

/**
 * Get herotag for address
 */
export async function getHerotag(address: string): Promise<string | null> {
    try {
        const account = await getAccount(address);
        return account.username || null;
    } catch {
        return null;
    }
}

/**
 * Resolve herotag to address
 */
export async function resolveHerotag(herotag: string): Promise<string | null> {
    try {
        // Remove @ prefix if present
        const cleanTag = herotag.replace('@', '').replace('.elrond', '');
        const data = await apiFetch<{ address: string }>(`/usernames/${cleanTag}`);
        return data.address;
    } catch {
        return null;
    }
}

// ---- NFT APIs ----

/**
 * Fetch NFTs for an address with pagination
 */
export async function getNFTs(
    address: string,
    options: FetchOptions = {}
): Promise<PaginatedResponse<NFT>> {
    const { from = 0, size = APP_CONFIG.nftsPerPage, collections, search } = options;

    // Build query params
    const params = new URLSearchParams({
        from: from.toString(),
        size: size.toString(),
        withSupply: 'true',
    });

    if (collections?.length) {
        params.set('collections', collections.join(','));
    }

    if (search) {
        params.set('search', search);
    }

    // Fetch NFTs
    const cacheKey = `nfts:${address}:${params.toString()}`;
    const cached = getCached<NFT[]>(cacheKey, APP_CONFIG.cacheTTL.nfts);

    let items: NFT[];
    if (cached) {
        items = cached;
    } else {
        items = await apiFetch<NFT[]>(`/accounts/${address}/nfts?${params}`);
        setCache(cacheKey, items);
    }

    // Fetch total count for pagination
    const countCacheKey = `nfts-count:${address}`;
    let count: number;

    const cachedCount = getCached<number>(countCacheKey, APP_CONFIG.cacheTTL.nfts);
    if (cachedCount !== null) {
        count = cachedCount;
    } else {
        count = await apiFetch<number>(`/accounts/${address}/nfts/count`);
        setCache(countCacheKey, count);
    }

    return {
        items,
        count,
        hasMore: from + size < count,
    };
}

/**
 * Fetch a single NFT by identifier
 */
export async function getNFT(identifier: string): Promise<NFT> {
    const cacheKey = `nft:${identifier}`;
    const cached = getCached<NFT>(cacheKey, APP_CONFIG.cacheTTL.nfts);
    if (cached) return cached;

    const data = await apiFetch<NFT>(`/nfts/${identifier}`);
    setCache(cacheKey, data);
    return data;
}

/**
 * Fetch all NFT collections for an address
 */
export async function getAccountCollections(
    address: string
): Promise<NFTCollection[]> {
    const cacheKey = `collections:${address}`;
    const cached = getCached<NFTCollection[]>(cacheKey, APP_CONFIG.cacheTTL.collections);
    if (cached) return cached;

    const data = await apiFetch<NFTCollection[]>(
        `/accounts/${address}/roles/collections?type=NonFungibleESDT,SemiFungibleESDT`
    );
    setCache(cacheKey, data);
    return data;
}

/**
 * Fetch collection details
 */
export async function getCollection(collection: string): Promise<NFTCollection> {
    const cacheKey = `collection:${collection}`;
    const cached = getCached<NFTCollection>(cacheKey, APP_CONFIG.cacheTTL.collections);
    if (cached) return cached;

    const data = await apiFetch<NFTCollection>(`/collections/${collection}`);
    setCache(cacheKey, data);
    return data;
}

/**
 * Get NFT count per collection for an address
 */
export async function getNFTCountByCollection(
    address: string
): Promise<Record<string, number>> {
    const nfts = await getNFTs(address, { size: 10000 });

    const counts: Record<string, number> = {};
    nfts.items.forEach(nft => {
        counts[nft.collection] = (counts[nft.collection] || 0) + 1;
    });

    return counts;
}

// ---- Token APIs ----

export interface Token {
    identifier: string;
    name: string;
    ticker: string;
    balance: string;
    decimals: number;
    price?: number;
    valueUsd?: number;
    assets?: {
        pngUrl?: string;
        svgUrl?: string;
    };
}

/**
 * Fetch ESDT tokens for an address
 */
export async function getTokens(address: string): Promise<Token[]> {
    const cacheKey = `tokens:${address}`;
    const cached = getCached<Token[]>(cacheKey, APP_CONFIG.cacheTTL.balance);
    if (cached) return cached;

    const data = await apiFetch<Token[]>(`/accounts/${address}/tokens`);
    setCache(cacheKey, data);
    return data;
}

// ---- Transaction APIs ----

export interface Transaction {
    txHash: string;
    sender: string;
    receiver: string;
    value: string;
    fee: string;
    timestamp: number;
    status: 'success' | 'pending' | 'fail' | 'invalid';
    function?: string;
    action?: {
        category: string;
        name: string;
        description?: string;
    };
}

/**
 * Fetch recent transactions for an address
 */
export async function getTransactions(
    address: string,
    options: { from?: number; size?: number } = {}
): Promise<Transaction[]> {
    const { from = 0, size = 25 } = options;

    const params = new URLSearchParams({
        from: from.toString(),
        size: size.toString(),
        withOperations: 'true',
    });

    return apiFetch<Transaction[]>(`/accounts/${address}/transactions?${params}`);
}

/**
 * Fetch a single transaction by hash
 */
export async function getTransaction(txHash: string): Promise<Transaction> {
    return apiFetch<Transaction>(`/transactions/${txHash}`);
}

// ---- Spam Detection ----

// Known spam patterns and suspicious traits
const SPAM_INDICATORS = {
    // Suspicious URL patterns in names
    urlPatterns: [/https?:\/\//i, /\.com$/i, /\.xyz$/i, /claim/i, /airdrop/i, /free/i],

    // Collections with high spam probability
    suspiciousCollections: new Set<string>([
        // Add known spam collections here
    ]),

    // Minimum rarity score to NOT be considered spam
    minRarityScore: 0,
};

/**
 * Analyze if an NFT is likely spam
 */
export function analyzeSpamProbability(nft: NFT): number {
    let spamScore = 0;

    // Check URL patterns in name
    for (const pattern of SPAM_INDICATORS.urlPatterns) {
        if (pattern.test(nft.name)) {
            spamScore += 0.3;
        }
    }

    // Check if from known spam collection
    if (SPAM_INDICATORS.suspiciousCollections.has(nft.collection)) {
        spamScore += 0.5;
    }

    // Check if no media
    if (!nft.url && (!nft.media || nft.media.length === 0)) {
        spamScore += 0.2;
    }

    // Check if not whitelisted
    if (nft.isWhitelisted === false) {
        spamScore += 0.3;
    }

    // Normalize to 0-1
    return Math.min(spamScore, 1);
}

/**
 * Filter NFTs to identify likely spam
 */
export function detectSpamNFTs(nfts: NFT[], threshold = 0.5): NFT[] {
    return nfts.filter(nft => analyzeSpamProbability(nft) >= threshold);
}

// ---- Utility Functions ----

import BigNumber from 'bignumber.js';

/**
 * Format EGLD balance from wei to human readable
 */
export function formatEGLD(balanceWei: string, decimals = 4): string {
    if (!balanceWei || balanceWei === '0') return '0';
    try {
        const value = new BigNumber(balanceWei).dividedBy(new BigNumber(10).pow(18));
        return value.toFixed(decimals);
    } catch {
        return '0';
    }
}

/**
 * Format any token balance with its decimals
 */
export function formatTokenBalance(balance: string, decimals: number): string {
    if (!balance || balance === '0') return '0';
    try {
        const bigBalance = new BigNumber(balance);
        const value = bigBalance.dividedBy(new BigNumber(10).pow(decimals));

        if (value.isGreaterThanOrEqualTo(1000000)) {
            return `${value.dividedBy(1000000).toFixed(2)}M`;
        }
        if (value.isGreaterThanOrEqualTo(1000)) {
            return `${value.dividedBy(1000).toFixed(2)}K`;
        }
        return value.toFixed(decimals > 4 ? 4 : decimals);
    } catch {
        return '0';
    }
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars = 6): string {
    if (!address) return '';
    return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Clear cache for a specific address
 */
export function clearAddressCache(address: string): void {
    for (const key of cache.keys()) {
        if (key.includes(address)) {
            cache.delete(key);
        }
    }
}
