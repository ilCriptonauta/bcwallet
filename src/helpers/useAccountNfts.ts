/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGetNetworkConfig } from '@/lib';

export type MultiversxMediaItem = {
  url?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  fileType?: string;
};

export type MultiversxNftApiItem = {
  identifier: string;
  name?: string;
  collection?: string;
  collectionName?: string;
  nonce?: number;
  balance?: string;
  url?: string;
  media?: MultiversxMediaItem[];
  type?: string;
  metadata?: Record<string, any>;
};

export type NormalizedNft = {
  identifier: string;
  name: string;
  collection: string;
  collectionName: string;
  imageUrl: string | null;
  originalImageUrl: string | null;
  thumbnailUrl: string | null;
  type: 'NFT' | 'SFT' | 'MetaESDT';
  balance?: string;
  metadata?: Record<string, any>;
  mimeType?: string;
};

export const normalizeMediaUrl = (url: string): string => {
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
  }
  return url;
};

export const pickBestImageUrl = (nft: MultiversxNftApiItem): string | null => {
  const fileType = nft.media?.[0]?.fileType || '';
  const isVideoOrGif = fileType.startsWith('video/') || fileType === 'image/gif';

  let candidate;
  if (isVideoOrGif) {
    candidate =
      nft.media?.[0]?.originalUrl ||
      nft.media?.[0]?.url ||
      nft.url ||
      nft.media?.[0]?.thumbnailUrl;
  } else {
    candidate =
      nft.media?.[0]?.thumbnailUrl ||
      nft.media?.[0]?.url ||
      nft.media?.[0]?.originalUrl ||
      nft.url;
  }

  if (!candidate) {
    return null;
  }
  return normalizeMediaUrl(candidate);
};

export const pickOriginalImageUrl = (nft: MultiversxNftApiItem): string | null => {
  // Il link root `nft.url` è quello originale scritto su blockchain (spesso IPFS), non alterato.
  const candidate =
    nft.url ||
    nft.media?.[0]?.originalUrl ||
    nft.media?.[0]?.url ||
    nft.media?.[0]?.thumbnailUrl;

  if (!candidate) {
    return null;
  }
  return normalizeMediaUrl(candidate);
};

export type UseAccountNftsOptions = {
  address?: string;
  collection?: string;
  enabled?: boolean;
  pageSize?: number;
  /** Minimum time (ms) between API calls. Default is slightly above 500ms to respect 2 req/sec limits. */
  minTimeBetweenRequestsMs?: number;
};


import useSWRInfinite from 'swr/infinite';

const fetcher = async (url: string) => {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`MultiversX API error (${res.status})`);
  }
  return res.json();
};

export const useAccountNfts = ({
  address,
  enabled = true,
  pageSize = 30,
}: UseAccountNftsOptions) => {
  const { network } = useGetNetworkConfig();

  const getKey = (pageIndex: number, previousPageData: MultiversxNftApiItem[] | null) => {
    if (!enabled || !address) return null; // do not fetch
    if (previousPageData && !previousPageData.length) return null; // Reached the end

    // API uses from/size
    const from = pageIndex * pageSize;
    return `${network.apiAddress}/accounts/${address}/nfts?from=${from}&size=${pageSize}&type=NonFungibleESDT,SemiFungibleESDT`;
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<MultiversxNftApiItem[]>(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      persistSize: false,
    }
  );

  const flatData = useMemo(() => {
    if (!data) return [];

    const raw = data.flat();
    return raw.map((nft) => ({
      identifier: nft.identifier,
      name: nft.name ? nft.name.split('-')[0].trim() : (nft.identifier ? nft.identifier.split('-')[0].trim() : ''),
      collection: nft.collection || '',
      collectionName: nft.collectionName ? nft.collectionName.split('-')[0].trim() : (nft.collection ? nft.collection.split('-')[0].trim() : 'Unknown Collection'),
      imageUrl: pickBestImageUrl(nft),
      originalImageUrl: pickOriginalImageUrl(nft),
      thumbnailUrl: nft.media?.[0]?.thumbnailUrl ? normalizeMediaUrl(nft.media[0].thumbnailUrl) : null,
      type: nft.type === 'SemiFungibleESDT' ? 'SFT' : nft.type === 'MetaESDT' ? 'MetaESDT' : 'NFT',
      balance: nft.balance,
      metadata: nft.metadata,
      mimeType: nft.media?.[0]?.fileType,
    })) as NormalizedNft[];
  }, [data]);

  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.length < pageSize);
  const isRefreshing = isValidating && data && data.length === size;

  const loadMore = useCallback(() => {
    if (!isReachingEnd && !isValidating) {
      setSize(size + 1);
    }
  }, [isReachingEnd, isValidating, size, setSize]);

  // Provide a setter to locally mutate the flattened data array
  // useful for optimistic UI if needed
  const setItems = useCallback(
    (updater: (prev: NormalizedNft[]) => NormalizedNft[]) => {
      // In SWR infinite, to fully optimistically update nested pages we'd need complex mutate logic.
      // Easiest approach for a simple refresh is just to trigger revalidation.
      mutate();
    },
    [mutate]
  );

  const reset = useCallback(() => {
    setSize(1);
  }, [setSize]);

  return useMemo(
    () => ({
      items: flatData,
      isLoading: isLoading || Boolean(isRefreshing),
      error: error ? (error.message || 'Failed to load NFTs') : null,
      hasMore: !isReachingEnd,
      loadMore,
      reset,
      setItems
    }),
    [flatData, isLoading, isRefreshing, error, isReachingEnd, loadMore, reset, setItems]
  );
};
