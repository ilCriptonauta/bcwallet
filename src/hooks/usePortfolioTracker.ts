import { useState, useEffect, useCallback, useRef } from 'react';
import BigNumber from 'bignumber.js';
import { useGetNetworkConfig, useGetAccountInfo } from '@/lib';
import type { NormalizedNft } from '@/helpers';

const OOX_API = 'https://api.oox.art';
const LOCAL_STORAGE_CACHE_KEY = 'bcw_floor_prices_v1';

// In-memory persistent cache across component re-renders
const globalFloorCache = new Map<string, number>();

// Hydrate global cache from localStorage on module load
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (saved) {
      const parsed: Record<string, number> = JSON.parse(saved);
      for (const [col, val] of Object.entries(parsed)) {
        if (typeof val === 'number' && val > 0) {
          globalFloorCache.set(col, val);
        }
      }
    }
  } catch {}
}

function saveGlobalCacheToStorage() {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, number> = {};
    for (const [col, val] of globalFloorCache.entries()) {
      obj[col] = val;
    }
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

export interface CollectionFloorStat {
  collection: string;
  collectionName: string;
  count: number;
  floorEgld: number;
  totalEgld: number;
  totalUsd: number;
}

export interface PortfolioTrackerData {
  totalEgld: number;
  totalUsd: number;
  egldPriceUsd: number;
  nftCount: number;
  sftCount: number;
  isLoading: boolean;
  collectionStats: CollectionFloorStat[];
  refresh: () => Promise<void>;
}

export function usePortfolioTracker(nftsInput?: NormalizedNft[], overrideAddress?: string): PortfolioTrackerData {
  const { network } = useGetNetworkConfig();
  const accountAddress = useGetAccountInfo()?.account?.address;
  const targetAddress = overrideAddress || accountAddress;

  const [totalEgld, setTotalEgld] = useState<number>(0);
  const [totalUsd, setTotalUsd] = useState<number>(0);
  const [egldPriceUsd, setEgldPriceUsd] = useState<number>(0);
  const [nftCount, setNftCount] = useState<number>(0);
  const [sftCount, setSftCount] = useState<number>(0);
  const [collectionStats, setCollectionStats] = useState<CollectionFloorStat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch EGLD economics (USD price)
  const fetchEgldPrice = useCallback(async (apiAddress: string, signal: AbortSignal): Promise<number> => {
    try {
      const res = await fetch(`${apiAddress}/economics`, { signal });
      if (!res.ok) return 0;
      const data = await res.json();
      return typeof data?.price === 'number' ? data.price : 0;
    } catch {
      return 0;
    }
  }, []);

  // Resilient OOX floor price fetcher with cache fallback
  const fetchCollectionFloor = useCallback(async (collection: string, signal: AbortSignal): Promise<number> => {
    try {
      const res = await fetch(`${OOX_API}/collections/${collection}/auction/stats`, {
        signal,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.minPrice && data.minPrice !== '0') {
          const val = new BigNumber(data.minPrice).dividedBy(1e18).toNumber();
          if (val > 0) {
            globalFloorCache.set(collection, val);
            saveGlobalCacheToStorage();
            return val;
          }
        }
      }
    } catch {
      // Network failure or rate limit hit — fallback to known cache below
    }

    return globalFloorCache.get(collection) || 0;
  }, []);

  const computePortfolio = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    const apiAddr = network?.apiAddress || 'https://api.multiversx.com';

    // 1. Fetch EGLD USD Price
    const egldPrice = await fetchEgldPrice(apiAddr, controller.signal);
    if (!controller.signal.aborted && egldPrice > 0) {
      setEgldPriceUsd(egldPrice);
    }

    let allNfts: { collection: string; collectionName: string; type: string; balance?: string }[] = [];
    let exactNftCount = 0;
    let exactSftCount = 0;

    if (targetAddress) {
      // Fetch exact NFT & SFT counts from API count endpoints
      try {
        const [nftCountRes, sftCountRes] = await Promise.all([
          fetch(`${apiAddr}/accounts/${targetAddress}/nfts/count?type=NonFungibleESDT`, { signal: controller.signal }),
          fetch(`${apiAddr}/accounts/${targetAddress}/nfts/count?type=SemiFungibleESDT,MetaESDT`, { signal: controller.signal }),
        ]);

        if (nftCountRes.ok) {
          const txt = await nftCountRes.text();
          exactNftCount = parseInt(txt, 10) || 0;
        }
        if (sftCountRes.ok) {
          const txt = await sftCountRes.text();
          exactSftCount = parseInt(txt, 10) || 0;
        }
      } catch {
        // Fallback to manual computation if count endpoint fails
      }

      // Fetch ALL NFTs for this target address across pages (using size=500)
      const pageSize = 500;
      let from = 0;
      let hasMore = true;

      while (hasMore && !controller.signal.aborted) {
        try {
          const res = await fetch(
            `${apiAddr}/accounts/${targetAddress}/nfts?from=${from}&size=${pageSize}&type=NonFungibleESDT,SemiFungibleESDT,MetaESDT`,
            { signal: controller.signal, headers: { Accept: 'application/json' } }
          );
          if (!res.ok) break;
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) break;

          for (const item of data) {
            allNfts.push({
              collection: item.collection || '',
              collectionName: item.collectionName ? item.collectionName.split('-')[0].trim() : (item.collection ? item.collection.split('-')[0].trim() : 'Unknown Collection'),
              type: item.type === 'SemiFungibleESDT' ? 'SFT' : item.type === 'MetaESDT' ? 'MetaESDT' : 'NFT',
              balance: item.balance,
            });
          }

          if (data.length < pageSize) {
            hasMore = false;
          } else {
            from += pageSize;
          }
        } catch {
          break;
        }
      }
    } else if (nftsInput && nftsInput.length > 0) {
      allNfts = nftsInput;
    }

    if (controller.signal.aborted) return;

    // Calculate fallback counts if API count endpoints failed
    if (exactNftCount === 0 && exactSftCount === 0) {
      for (const item of allNfts) {
        const qty = item.balance ? parseInt(item.balance, 10) || 1 : 1;
        if (item.type === 'SFT' || item.type === 'MetaESDT') {
          exactSftCount += qty;
        } else {
          exactNftCount += qty;
        }
      }
    }

    setNftCount(exactNftCount);
    setSftCount(exactSftCount);

    if (allNfts.length === 0) {
      setTotalEgld(0);
      setTotalUsd(0);
      setCollectionStats([]);
      setIsLoading(false);
      return;
    }

    // Group NFTs by collection counting quantities (SFTs may have balance > 1)
    const collectionsMap = new Map<string, { count: number; name: string }>();
    for (const nft of allNfts) {
      if (!nft.collection) continue;
      const qty = nft.balance ? parseInt(nft.balance, 10) || 1 : 1;
      const existing = collectionsMap.get(nft.collection);
      if (existing) {
        existing.count += qty;
      } else {
        collectionsMap.set(nft.collection, {
          count: qty,
          name: nft.collectionName || nft.collection,
        });
      }
    }

    const collectionsList = Array.from(collectionsMap.entries());
    const stats: CollectionFloorStat[] = [];
    let sumEgld = 0;

    // Fetch floor prices in small sequential batches to respect rate limits
    const BATCH_SIZE = 4;
    for (let i = 0; i < collectionsList.length; i += BATCH_SIZE) {
      if (controller.signal.aborted) break;

      const batch = collectionsList.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async ([col, info]) => {
          const floor = await fetchCollectionFloor(col, controller.signal);
          const totalColEgld = floor * info.count;
          const totalColUsd = totalColEgld * (egldPrice || egldPriceUsd);
          return {
            collection: col,
            collectionName: info.name,
            count: info.count,
            floorEgld: floor,
            totalEgld: totalColEgld,
            totalUsd: totalColUsd,
          };
        })
      );

      for (const item of results) {
        stats.push(item);
        sumEgld += item.totalEgld;
      }
    }

    if (!controller.signal.aborted) {
      // Sort collections by total value descending
      stats.sort((a, b) => b.totalEgld - a.totalEgld);

      const effectivePrice = egldPrice || egldPriceUsd;
      setCollectionStats(stats);
      setTotalEgld(sumEgld);
      setTotalUsd(sumEgld * effectivePrice);
      setIsLoading(false);
    }
  }, [targetAddress, nftsInput, network?.apiAddress, fetchEgldPrice, fetchCollectionFloor, egldPriceUsd]);

  useEffect(() => {
    computePortfolio();
    return () => {
      abortRef.current?.abort();
    };
  }, [targetAddress, nftsInput?.length]);

  return {
    totalEgld,
    totalUsd,
    egldPriceUsd,
    nftCount,
    sftCount,
    isLoading,
    collectionStats,
    refresh: computePortfolio,
  };
}
