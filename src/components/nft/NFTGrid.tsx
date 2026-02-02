'use client';

/* =====================================================
   🥓 BACON WALLET - NFT Grid Component
   Displays a responsive grid of NFT cards
   ===================================================== */

import { useRef, useCallback, useEffect } from 'react';
import { NFT } from '@/types';
import { Tag } from '@/types/folders';
import { NFTCard } from './NFTCard';
import styles from './NFTGrid.module.css';

interface NFTGridProps {
    nfts: NFT[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onSelectNFT?: (nft: NFT) => void;
    onDownloadNFT?: (nft: NFT) => void;
    onSendNFT?: (nft: NFT) => void;
    onListNFT?: (nft: NFT) => void;
    onToggleFavorite?: (nft: NFT) => void;
    onMarkSpam?: (nft: NFT) => void;
    onManageTags?: (nft: NFT) => void;
    selectedNFTs?: Set<string>;
    favoriteNFTs?: Set<string>;
    spamNFTs?: Set<string>;
    getTagsForNFT?: (nftId: string) => Tag[];
    emptyMessage?: string;
    columns?: 2 | 3 | 4 | 5 | 6;
}

// Skeleton card for loading state
function SkeletonCard() {
    return (
        <div className={styles.skeletonCard}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonInfo}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonSubtitle} />
            </div>
        </div>
    );
}

export function NFTGrid({
    nfts,
    isLoading = false,
    hasMore = false,
    onLoadMore,
    onSelectNFT,
    onDownloadNFT,
    onSendNFT,
    onListNFT,
    onToggleFavorite,
    onMarkSpam,
    onManageTags,
    selectedNFTs = new Set(),
    favoriteNFTs = new Set(),
    spamNFTs = new Set(),
    getTagsForNFT,
    emptyMessage = 'No NFTs found',
    columns = 4,
}: NFTGridProps) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Infinite scroll setup
    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !isLoading && onLoadMore) {
                onLoadMore();
            }
        },
        [hasMore, isLoading, onLoadMore]
    );

    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '100px',
            threshold: 0.1,
        });

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver]);

    // Get grid class based on columns
    const getGridClass = () => {
        switch (columns) {
            case 2: return styles.grid2;
            case 3: return styles.grid3;
            case 5: return styles.grid5;
            case 6: return styles.grid6;
            default: return styles.grid4;
        }
    };

    // Empty state
    if (!isLoading && nfts.length === 0) {
        return (
            <div className={styles.empty}>
                <span className={styles.emptyIcon}>📭</span>
                <p className={styles.emptyText}>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={`${styles.grid} ${getGridClass()}`}>
                {nfts.map((nft) => (
                    <NFTCard
                        key={nft.identifier}
                        nft={nft}
                        onSelect={onSelectNFT}
                        onDownload={onDownloadNFT}
                        onSend={onSendNFT}
                        onList={onListNFT}
                        onToggleFavorite={onToggleFavorite}
                        onMarkSpam={onMarkSpam}
                        onManageTags={onManageTags}
                        isSelected={selectedNFTs.has(nft.identifier)}
                        isFavorite={favoriteNFTs.has(nft.identifier)}
                        isSpam={spamNFTs.has(nft.identifier)}
                        tags={getTagsForNFT ? getTagsForNFT(nft.identifier) : []}
                    />
                ))}

                {/* Loading skeletons */}
                {isLoading && (
                    <>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonCard key={`skeleton-${i}`} />
                        ))}
                    </>
                )}
            </div>

            {/* Load more trigger */}
            {hasMore && (
                <div ref={loadMoreRef} className={styles.loadMore}>
                    {isLoading ? (
                        <div className={styles.loader}>
                            <span className={styles.loaderIcon}>🥓</span>
                            <span>Loading more...</span>
                        </div>
                    ) : (
                        <button className={styles.loadMoreBtn} onClick={onLoadMore}>
                            Load More
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
