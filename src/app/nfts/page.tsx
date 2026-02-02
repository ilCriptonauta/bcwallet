'use client';

/* =====================================================
   🥓 BACON WALLET - My NFTs Page
   Display and manage user's NFT collection
   ===================================================== */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNFTs, useDebounce, useNFTCountByCollection } from '@/hooks';
import { useFolders } from '@/hooks/useFolders';
import { NFTGrid } from '@/components/nft/NFTGrid';
import { NFTDetailModal } from '@/components/nft/NFTDetailModal';
import { TagSelectionModal } from '@/components/nft/TagSelectionModal';
import { SendModal } from '@/components/transaction/SendModal';
import { ListOnOOXModal } from '@/components/transaction/ListOnOOXModal';
import { NFT } from '@/types';
import { Tag } from '@/types/folders';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import styles from './page.module.css';

// Hardcoded test address removed

export default function NFTsPage() {
    // State
    const { address: walletAddress } = useGetAccount();
    const address = walletAddress || 'erd1knr6ha4xat3juryp47x3duj4lykjhlxqhdu67vtj4ey9apy6aa5sg0hlem';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCollection, setSelectedCollection] = useState<string | null>('all');
    const [selectedNFTs, setSelectedNFTs] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [gridColumns, setGridColumns] = useState<4 | 5 | 6>(4);
    const [detailNFT, setDetailNFT] = useState<NFT | null>(null);
    const [tagModalNftId, setTagModalNftId] = useState<string | null>(null);
    const [sendModalNft, setSendModalNft] = useState<NFT | null>(null);
    const [listModalNft, setListModalNft] = useState<NFT | null>(null);
    const [activeFolder, setActiveFolder] = useState<string>('all');

    // Debounced search
    const debouncedSearch = useDebounce(searchQuery, 300);

    const fetchOptions = useMemo(() => ({
        search: debouncedSearch || undefined,
        collections: (selectedCollection && selectedCollection !== 'all') ? [selectedCollection] : undefined,
    }), [debouncedSearch, selectedCollection]);

    // Fetch NFTs
    const {
        data: allNfts,
        isLoading,
        hasMore,
        loadMore,
        totalCount,
        refetch,
    } = useNFTs(address, fetchOptions);

    // Folders hook
    const {
        systemFolders,
        customFolders,
        selectedFolderId,
        selectFolder,
        toggleFavorite,
        markAsSpam,
        unmarkSpam,
        isFavorite,
        isSpam,
        getNFTsInFolder,
        getFolderCount,
        addToFolder,
        removeFromFolder,
        tags,
        createTag,
        addTagToNFT,
        removeTagFromNFT,
        getTagsForNFT,
        autoDetectSpam,
    } = useFolders({ isPremium: false, address: address || 'erd1knr6ha4xat3juryp47x3duj4lykjhlxqhdu67vtj4ey9apy6aa5sg0hlem' });

    // Listen for folder selection from sidebar
    useEffect(() => {
        const handleFolderSelected = (event: CustomEvent<{ folderId: string }>) => {
            setActiveFolder(event.detail.folderId);
        };

        window.addEventListener('folderSelected', handleFolderSelected as EventListener);
        return () => {
            window.removeEventListener('folderSelected', handleFolderSelected as EventListener);
        };
    }, []);

    // Auto-detect spam on load
    useEffect(() => {
        if (!isLoading && allNfts && allNfts.length > 0) {
            const spamCount = autoDetectSpam(allNfts);
            if (spamCount > 0) {
                console.log(`🛡️ Auto-detected and moved ${spamCount} spam NFTs individually to Spam Bin`);
            }
        }
    }, [isLoading, allNfts, autoDetectSpam]);

    // Filter NFTs based on active folder
    const filteredNfts = useMemo(() => {
        if (!allNfts) return [];
        return getNFTsInFolder(activeFolder, allNfts);
    }, [allNfts, activeFolder, getNFTsInFolder]);

    // Fetch collection counts
    const { data: collectionCounts } = useNFTCountByCollection(address);

    // Unique collections from NFTs
    const collections = useMemo(() => {
        if (!collectionCounts) return [];
        return Object.entries(collectionCounts)
            .map(([collection, count]) => ({ collection, count }))
            .sort((a, b) => b.count - a.count);
    }, [collectionCounts]);

    // Get folder name for display
    const getFolderName = useCallback(() => {
        const sysFolder = systemFolders.find(f => f.id === activeFolder);
        if (sysFolder) return sysFolder.name;
        const customFolder = customFolders.find(f => f.id === activeFolder);
        if (customFolder) return customFolder.name;
        return 'All NFTs';
    }, [activeFolder, systemFolders, customFolders]);

    // Handlers
    const handleViewNFT = (nft: NFT) => {
        setDetailNFT(nft);
    };

    const handleSelectNFT = (nft: NFT) => {
        setSelectedNFTs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nft.identifier)) {
                newSet.delete(nft.identifier);
            } else {
                newSet.add(nft.identifier);
            }
            return newSet;
        });
    };

    const handleDownloadNFT = (nft: NFT) => {
        // Open media URL in new tab for download
        const url = nft.media?.[0]?.originalUrl || nft.url;
        if (url) {
            window.open(url, '_blank');
        }
    };

    const handleSendNFT = (nft: NFT) => {
        setSendModalNft(nft);
    };

    const handleListNFT = (nft: NFT) => {
        setListModalNft(nft);
    };

    const handleToggleFavorite = (nft: NFT) => {
        toggleFavorite(nft.identifier);
    };

    const handleMarkSpam = (nft: NFT) => {
        markAsSpam([nft.identifier]);
    };

    const handleManageTags = (nft: NFT) => {
        setTagModalNftId(nft.identifier);
    };

    const clearSelection = () => {
        setSelectedNFTs(new Set());
    };

    // Calculate display count
    const displayCount = useMemo(() => {
        if (activeFolder === 'all') {
            return totalCount > 0 ? totalCount : filteredNfts.length;
        }
        return filteredNfts.length;
    }, [activeFolder, totalCount, filteredNfts.length]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>{getFolderName()}</h1>
                    <span className={styles.count}>
                        {displayCount > 0 ? `${displayCount} items` : 'Loading...'}
                    </span>
                </div>

                <div className={styles.headerRight}>
                    {/* Grid Size Controls */}
                    <div className={styles.viewControls}>
                        <button
                            className={`${styles.viewBtn} ${gridColumns === 4 ? styles.active : ''}`}
                            onClick={() => setGridColumns(4)}
                            title="Large grid"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="0" y="0" width="7" height="7" />
                                <rect x="9" y="0" width="7" height="7" />
                                <rect x="0" y="9" width="7" height="7" />
                                <rect x="9" y="9" width="7" height="7" />
                            </svg>
                        </button>
                        <button
                            className={`${styles.viewBtn} ${gridColumns === 5 ? styles.active : ''}`}
                            onClick={() => setGridColumns(5)}
                            title="Medium grid"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="0" y="0" width="4" height="4" />
                                <rect x="6" y="0" width="4" height="4" />
                                <rect x="12" y="0" width="4" height="4" />
                                <rect x="0" y="6" width="4" height="4" />
                                <rect x="6" y="6" width="4" height="4" />
                                <rect x="12" y="6" width="4" height="4" />
                            </svg>
                        </button>
                        <button
                            className={`${styles.viewBtn} ${gridColumns === 6 ? styles.active : ''}`}
                            onClick={() => setGridColumns(6)}
                            title="Small grid"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="0" y="0" width="3" height="3" />
                                <rect x="4.5" y="0" width="3" height="3" />
                                <rect x="9" y="0" width="3" height="3" />
                                <rect x="13" y="0" width="3" height="3" />
                                <rect x="0" y="4.5" width="3" height="3" />
                                <rect x="4.5" y="4.5" width="3" height="3" />
                                <rect x="9" y="4.5" width="3" height="3" />
                                <rect x="13" y="4.5" width="3" height="3" />
                            </svg>
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button className={styles.refreshBtn} onClick={refetch} title="Refresh">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className={styles.filtersBar}>
                {/* Search */}
                <div className={styles.searchContainer}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search NFTs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className={styles.clearSearch}
                            onClick={() => setSearchQuery('')}
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Collection Filter */}
                <div className={styles.collectionFilter}>
                    <select
                        className={styles.select}
                        value={selectedCollection || ''}
                        onChange={(e) => setSelectedCollection(e.target.value || null)}
                    >
                        <option value="">All Collections ({collections.length})</option>
                        {collections.map(({ collection, count }) => (
                            <option key={collection} value={collection}>
                                {collection.split('-')[0]} ({count})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Selection Bar (when items selected) */}
            {selectedNFTs.size > 0 && (
                <div className={styles.selectionBar}>
                    <span className={styles.selectionCount}>
                        {selectedNFTs.size} selected
                    </span>
                    <div className={styles.selectionActions}>
                        <button className={styles.selectionBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22,2 15,22 11,13 2,9 22,2" />
                            </svg>
                            Send All
                        </button>
                        <button className={styles.selectionBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                <line x1="7" y1="7" x2="7.01" y2="7" />
                            </svg>
                            List All
                        </button>
                        <button
                            className={`${styles.selectionBtn} ${styles.clearBtn}`}
                            onClick={clearSelection}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* NFT Grid */}
            <NFTGrid
                nfts={filteredNfts}
                isLoading={isLoading}
                hasMore={hasMore && activeFolder === 'all'}
                onLoadMore={loadMore}
                onSelectNFT={handleViewNFT}
                onDownloadNFT={handleDownloadNFT}
                onSendNFT={handleSendNFT}
                onListNFT={handleListNFT}
                onToggleFavorite={handleToggleFavorite}
                onMarkSpam={handleMarkSpam}
                onManageTags={handleManageTags}
                selectedNFTs={selectedNFTs}
                favoriteNFTs={new Set(
                    (allNfts || [])
                        .filter(nft => isFavorite(nft.identifier))
                        .map(nft => nft.identifier)
                )}
                spamNFTs={new Set(
                    (allNfts || [])
                        .filter(nft => isSpam(nft.identifier))
                        .map(nft => nft.identifier)
                )}
                getTagsForNFT={getTagsForNFT}
                columns={gridColumns}
                emptyMessage={
                    activeFolder === 'favorites'
                        ? 'No favorite NFTs yet. Click the heart on any NFT to add it!'
                        : activeFolder === 'high-rarity'
                            ? 'No high rarity NFTs (rank ≤ 100) found'
                            : activeFolder === 'spam'
                                ? 'No spam NFTs. That\'s good!'
                                : searchQuery
                                    ? `No NFTs found for "${searchQuery}"`
                                    : 'No NFTs in this folder'
                }
            />

            {/* NFT Detail Modal */}
            <NFTDetailModal
                nft={detailNFT}
                isOpen={detailNFT !== null}
                onClose={() => setDetailNFT(null)}
                onDownload={handleDownloadNFT}
                onSend={handleSendNFT}
                onList={handleListNFT}
                onManageTags={handleManageTags}
            />

            {/* Tag Selection / Organization Modal */}
            <TagSelectionModal
                isOpen={tagModalNftId !== null}
                onClose={() => setTagModalNftId(null)}
                allTags={tags}
                assignedTags={tagModalNftId ? getTagsForNFT(tagModalNftId) : []}
                folders={customFolders}
                currentFolderId={tagModalNftId ? customFolders.find(f => f.nftIds.includes(tagModalNftId))?.id : null}
                onAddTag={(tagId) => tagModalNftId && addTagToNFT(tagModalNftId, tagId)}
                onRemoveTag={(tagId) => tagModalNftId && removeTagFromNFT(tagModalNftId, tagId)}
                onCreateTag={createTag}
                onMoveToFolder={(folderId) => tagModalNftId && addToFolder([tagModalNftId], folderId)}
                onRemoveFromFolder={() => {
                    if (!tagModalNftId) return;
                    const folderId = customFolders.find(f => f.nftIds.includes(tagModalNftId))?.id;
                    if (folderId) {
                        removeFromFolder([tagModalNftId], folderId);
                    }
                }}
            />

            {/* Send Modal */}
            <SendModal
                isOpen={sendModalNft !== null}
                onClose={() => setSendModalNft(null)}
                initialNFT={sendModalNft}
            />

            {/* List on OOX Modal */}
            <ListOnOOXModal
                isOpen={listModalNft !== null}
                onClose={() => setListModalNft(null)}
                nft={listModalNft}
            />
        </div>
    );
}
