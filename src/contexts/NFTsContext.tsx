'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { useNFTs } from '@/hooks';
import { NFT } from '@/types';

interface NFTsContextType {
    allNfts: NFT[];
    totalCount: number;
    isLoading: boolean;
    refetch: () => Promise<void>;
}

const NFTsContext = createContext<NFTsContextType | undefined>(undefined);

export function NFTsProvider({ children }: { children: ReactNode }) {
    const { address } = useGetAccount();

    // Fetch all NFTs for the user (or at least a good chunk for counts)
    // For now we use the standard hook which handles pagination but we might need 
    // a separate "fetchAll" for accurate sidebar counts if the user has thousands.
    // However, for MVP, we'll use the data from the main hook.
    const { data: nfts, totalCount, isLoading, refetch } = useNFTs(address, {
        pageSize: 100 // Fetch a larger batch initially for counts
    });

    const value = useMemo(() => ({
        allNfts: nfts || [],
        totalCount,
        isLoading,
        refetch
    }), [nfts, totalCount, isLoading, refetch]);

    return <NFTsContext.Provider value={value}>{children}</NFTsContext.Provider>;
}

export function useNFTsContext() {
    const context = useContext(NFTsContext);
    if (context === undefined) {
        throw new Error('useNFTsContext must be used within an NFTsProvider');
    }
    return context;
}
