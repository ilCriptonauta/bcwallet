'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NormalizedNft, MultiversxNftApiItem, UseAccountNftsOptions } from './useAccountNfts';
import { pickBestImageUrl, pickOriginalImageUrl } from './useAccountNfts';
import { useGetNetworkConfig } from '@/lib';

import useSWRInfinite from 'swr/infinite';

const fetcher = async (url: string) => {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`MultiversX API error (${res.status})`);
  }
  return res.json();
};

export const useCollectionNfts = ({
  address,
  collection,
  enabled = true,
  pageSize = 30,
}: UseAccountNftsOptions) => {
  const { network } = useGetNetworkConfig();

  const getKey = (pageIndex: number, previousPageData: MultiversxNftApiItem[] | null) => {
    if (!enabled || !address) return null; // do not fetch
    if (previousPageData && !previousPageData.length) return null; // Reached the end

    // API uses from/size
    const from = pageIndex * pageSize;
    let url = `${network.apiAddress}/accounts/${address}/nfts?from=${from}&size=${pageSize}&type=NonFungibleESDT,SemiFungibleESDT`;
    if (collection) {
      url += `&collection=${collection}`;
    }
    return url;
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
      type: (nft.type === 'SemiFungibleESDT' || nft.type === 'MetaESDT') ? 'SFT' : 'NFT',
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
  const setItems = useCallback(
    (updater: (prev: NormalizedNft[]) => NormalizedNft[]) => {
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
