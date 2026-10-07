import { useState, useEffect, useCallback, useRef } from 'react';
import BigNumber from 'bignumber.js';
import { useGetNetworkConfig } from '@/lib';
import type { NormalizedNft } from '@/helpers';

const OOX_API = 'https://api.oox.art';

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
  isLoading: boolean;
  collectionStats: CollectionFloorStat[];
  refresh: () => Promise<void>;
}

export function usePortfolioTracker(nfts: NormalizedNft[]): PortfolioTrackerData {
  const { network } = useGetNetworkConfig();
  const [totalEgld, setTotalEgld] = useState<number>(0);
  const [totalUsd, setTotalUsd] = useState<number>(0);
  const [egldPriceUsd, setEgldPriceUsd] = useState<number>(0);
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

  // Fetch OOX floor price for a collection
  const fetchCollectionFloor = useCallback(async (collection: string, signal: AbortSignal): Promise<number> => {
    try {
      const res = await fetch(`${OOX_API}/collections/${collection}/auction/stats`, {
        signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return 0;
      const data = await res.json();
      if (!data?.minPrice || data.minPrice === '0') return 0;
      return new BigNumber(data.minPrice).dividedBy(1e18).toNumber();
    } catch {
      return 0;
    }
  }, []);

  const computePortfolio = useCallback(async () => {
    if (!nfts || nfts.length === 0) {
      setTotalEgld(0);
      setTotalUsd(0);
      setCollectionStats([]);
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    const apiAddr = network?.apiAddress || 'https://api.multiversx.com';

    // 1. Fetch EGLD USD Price
    const egldPrice = await fetchEgldPrice(apiAddr, controller.signal);
    if (!controller.signal.aborted) {
      setEgldPriceUsd(egldPrice);
    }

    // 2. Group NFTs by Collection
    const collectionsMap = new Map<string, { count: number; name: string }>();
    for (const nft of nfts) {
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

    // Fetch floor prices in parallel batches
    const BATCH_SIZE = 6;
    for (let i = 0; i < collectionsList.length; i += BATCH_SIZE) {
      if (controller.signal.aborted) break;

      const batch = collectionsList.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async ([col, info]) => {
          const floor = await fetchCollectionFloor(col, controller.signal);
          const totalColEgld = floor * info.count;
          const totalColUsd = totalColEgld * egldPrice;
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

      for (const res of batchResults) {
        stats.push(res);
        sumEgld += res.totalEgld;
      }
    }

    if (!controller.signal.aborted) {
      // Sort collections by total value descending
      stats.sort((a, b) => b.totalEgld - a.totalEgld);

      setCollectionStats(stats);
      setTotalEgld(sumEgld);
      setTotalUsd(sumEgld * egldPrice);
      setIsLoading(false);
    }
  }, [nfts, network?.apiAddress, fetchEgldPrice, fetchCollectionFloor]);

  useEffect(() => {
    computePortfolio();
    return () => {
      abortRef.current?.abort();
    };
  }, [computePortfolio]);

  return {
    totalEgld,
    totalUsd,
    egldPriceUsd,
    isLoading,
    collectionStats,
    refresh: computePortfolio,
  };
}
