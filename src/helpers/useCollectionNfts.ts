'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NormalizedNft, MultiversxNftApiItem, UseAccountNftsOptions } from './useAccountNfts';
import { pickBestImageUrl, pickOriginalImageUrl } from './useAccountNfts';

const sleep = (ms: number, signal?: AbortSignal) => {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    };

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort);
    }
  });
};

export const useCollectionNfts = ({
  address,
  collection,
  enabled = true,
  pageSize = 30,
  minTimeBetweenRequestsMs = 550
}: UseAccountNftsOptions) => {
  const [items, setItems] = useState<NormalizedNft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fromRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const lastRequestAtRef = useRef(0);

  const canLoad = Boolean(enabled && address);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    fromRef.current = 0;
    inFlightRef.current = false;
    lastRequestAtRef.current = 0;
    setItems([]);
    setError(null);
    setHasMore(true);
    setIsLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (!canLoad || isLoading || !hasMore || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const from = fromRef.current;

    let url = `https://api.multiversx.com/accounts/${address}/nfts?from=${from}&size=${pageSize}`;
    if (collection) {
      url += `&collection=${collection}`;
    }

    try {
      // Rate-limit calls (MultiversX API allows ~2 req/sec).
      const now = Date.now();
      const elapsed = now - lastRequestAtRef.current;
      const waitMs = Math.max(0, minTimeBetweenRequestsMs - elapsed);
      await sleep(waitMs, controller.signal);
      lastRequestAtRef.current = Date.now();

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`MultiversX API error (${res.status})`);
      }

      const raw = (await res.json()) as MultiversxNftApiItem[];
      const normalized: NormalizedNft[] = raw.map((nft) => ({
        identifier: nft.identifier,
        name: nft.name || nft.identifier,
        collection: nft.collection || '',
        collectionName: nft.collectionName || nft.collection || 'Unknown Collection',
        imageUrl: pickBestImageUrl(nft),
        originalImageUrl: pickOriginalImageUrl(nft),
        type: (nft.type === 'SemiFungibleESDT' || nft.type === 'MetaESDT') ? 'SFT' : 'NFT',
        balance: nft.balance,
        metadata: nft.metadata,
        mimeType: nft.media?.[0]?.fileType,
      }));

      setItems((prev) => {
        const map = new Map<string, NormalizedNft>();
        for (const item of prev) {
          map.set(item.identifier, item);
        }
        for (const item of normalized) {
          map.set(item.identifier, item);
        }
        return Array.from(map.values());
      });

      fromRef.current = from + raw.length;
      setHasMore(raw.length === pageSize);
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') {
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load NFTs');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [address, collection, canLoad, hasMore, isLoading, minTimeBetweenRequestsMs, pageSize]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // When address or collection changes, restart pagination.
    reset();
  }, [address, collection, enabled, reset]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!canLoad) {
      return;
    }

    // Initial page.
    void loadMore();
  }, [canLoad, loadMore]);

  return useMemo(
    () => ({
      items,
      isLoading,
      error,
      hasMore,
      loadMore,
      reset,
      setItems
    }),
    [items, isLoading, error, hasMore, loadMore, reset, setItems]
  );
};
