'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { NormalizedNft } from './useAccountNfts';

const OOX_API = 'https://api.oox.art';

type CollectionStats = {
    minPrice?: string; // floor price in smallest unit (1e18 = 1 EGLD)
};

/**
 * Fetches the floor price for a collection from OOX.
 * Returns null if the collection has no active listings or errors.
 */
const fetchCollectionFloor = async (
    collection: string,
    signal: AbortSignal
): Promise<BigNumber | null> => {
    try {
        const res = await fetch(`${OOX_API}/collections/${collection}/auction/stats`, {
            signal,
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) return null;
        const data: CollectionStats = await res.json();
        if (!data.minPrice || data.minPrice === '0') return null;
        return new BigNumber(data.minPrice).dividedBy(1e18);
    } catch {
        return null;
    }
};

/**
 * Calculates the estimated total NFT portfolio value in EGLD.
 *
 * Strategy:
 *  - For each unique collection held, fetch the floor price from OOX.
 *  - Multiply floor × number of NFTs the user owns from that collection.
 *  - Sum everything up.
 *
 * Note: collections without an active listing on OOX are skipped (floor = 0).
 */
export const useNftsValue = (nfts: NormalizedNft[]) => {
    const [totalEgld, setTotalEgld] = useState<BigNumber>(new BigNumber(0));
    const [isLoading, setIsLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const compute = useCallback(async () => {
        if (nfts.length === 0) {
            setTotalEgld(new BigNumber(0));
            return;
        }

        // Group NFTs by collection counting quantities (SFTs may have balance > 1)
        const collectionCounts = new Map<string, number>();
        for (const nft of nfts) {
            if (!nft.collection) continue;
            const qty = nft.balance ? parseInt(nft.balance, 10) || 1 : 1;
            collectionCounts.set(nft.collection, (collectionCounts.get(nft.collection) ?? 0) + qty);
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);

        const collections = Array.from(collectionCounts.entries());

        // Fetch all floor prices in parallel (batched if there are many collections)
        const BATCH = 6; // max concurrent requests
        let total = new BigNumber(0);

        for (let i = 0; i < collections.length; i += BATCH) {
            if (controller.signal.aborted) break;

            const slice = collections.slice(i, i + BATCH);
            const results = await Promise.all(
                slice.map(async ([col, qty]) => {
                    const floor = await fetchCollectionFloor(col, controller.signal);
                    if (!floor) return new BigNumber(0);
                    return floor.multipliedBy(qty);
                })
            );

            for (const v of results) {
                total = total.plus(v);
            }
        }

        if (!controller.signal.aborted) {
            setTotalEgld(total);
        }

        setIsLoading(false);
    }, [nfts]);

    useEffect(() => {
        void compute();
        return () => {
            abortRef.current?.abort();
        };
    }, [compute]);

    return { totalEgld, isLoading };
};
