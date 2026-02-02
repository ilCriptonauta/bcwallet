'use client';

/* =====================================================
   🥓 BACON WALLET - NFT Card Component
   Individual NFT display card with actions & drag support
   ===================================================== */

import { useState } from 'react';
import { NFT } from '@/types';
import { Tag } from '@/types/folders';
import styles from './NFTCard.module.css';

interface NFTCardProps {
    nft: NFT;
    onSelect?: (nft: NFT) => void;
    onDownload?: (nft: NFT) => void;
    onSend?: (nft: NFT) => void;
    onList?: (nft: NFT) => void;
    onToggleFavorite?: (nft: NFT) => void;
    onMarkSpam?: (nft: NFT) => void;
    onManageTags?: (nft: NFT) => void;
    isSelected?: boolean;
    isFavorite?: boolean;
    isSpam?: boolean;
    tags?: Tag[];
    showActions?: boolean;
    isDraggable?: boolean;
}

export function NFTCard({
    nft,
    onSelect,
    onDownload,
    onSend,
    onList,
    onToggleFavorite,
    onMarkSpam,
    onManageTags,
    isSelected = false,
    isFavorite = false,
    isSpam = false,
    tags = [],
    showActions = true,
    isDraggable = true,
}: NFTCardProps) {
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Get the best available image URL
    const getImageUrl = (): string => {
        if (nft.media && nft.media.length > 0) {
            return nft.media[0].thumbnailUrl || nft.media[0].url;
        }
        return nft.thumbnailUrl || nft.url || '';
    };

    const imageUrl = getImageUrl();

    const handleImageError = () => {
        setImageError(true);
    };

    const handleClick = () => {
        onSelect?.(nft);
    };

    const handleAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    // Drag handlers
    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'nft',
            nftId: nft.identifier,
            nftName: nft.name,
            collection: nft.collection,
        }));
        e.dataTransfer.effectAllowed = 'move';

        // Add a custom drag image
        const dragPreview = document.createElement('div');
        dragPreview.className = styles.dragPreview;
        dragPreview.textContent = nft.name;
        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 0, 0);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            className={`${styles.card} ${isSelected ? styles.selected : ''} ${isSpam ? styles.spam : ''} ${isDragging ? styles.dragging : ''}`}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            draggable={isDraggable}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {/* Image Container */}
            <div className={styles.imageContainer}>
                {!imageError && imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={nft.name}
                        className={styles.image}
                        onError={handleImageError}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.placeholder}>
                        <span>🖼️</span>
                    </div>
                )}

                {/* Favorite Button - Always visible if favorited, or on hover */}
                {onToggleFavorite && (isFavorite || isHovered) && (
                    <button
                        className={`${styles.favoriteBtn} ${isFavorite ? styles.favorited : ''}`}
                        onClick={(e) => handleAction(e, () => onToggleFavorite(nft))}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={isFavorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                )}

                {/* Spam indicator */}
                {isSpam && (
                    <div className={styles.spamBadge}>
                        <span>🚫</span>
                    </div>
                )}

                {/* Selection Checkbox */}
                {isHovered && (
                    <div className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelect?.(nft)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                {/* Quick Actions Overlay */}
                {showActions && isHovered && (
                    <div className={styles.actionsOverlay}>
                        {onDownload && (
                            <button
                                className={styles.actionBtn}
                                onClick={(e) => handleAction(e, () => onDownload(nft))}
                                title="Download"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7,10 12,15 17,10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </button>
                        )}
                        {onSend && (
                            <button
                                className={styles.actionBtn}
                                onClick={(e) => handleAction(e, () => onSend(nft))}
                                title="Send"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22,2 15,22 11,13 2,9 22,2" />
                                </svg>
                            </button>
                        )}
                        {onMarkSpam && !isSpam && (
                            <button
                                className={styles.actionBtn}
                                onClick={(e) => handleAction(e, () => onMarkSpam(nft))}
                                title="Mark as spam"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        )}
                        {onManageTags && (
                            <button
                                className={styles.actionBtn}
                                onClick={(e) => handleAction(e, () => onManageTags(nft))}
                                title="Manage Tags"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                </svg>
                            </button>
                        )}
                        {onList && (
                            <button
                                className={`${styles.actionBtn} ${styles.actionPrimary}`}
                                onClick={(e) => handleAction(e, () => onList(nft))}
                                title="List on OOX"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Rarity Badge */}
                {nft.rank && (
                    <div className={styles.rarityBadge}>
                        #{nft.rank}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className={styles.info}>
                {tags.length > 0 && (
                    <div className={styles.tagsRow}>
                        {tags.map(tag => (
                            <div
                                key={tag.id}
                                className={styles.tagDot}
                                style={{ backgroundColor: tag.color }}
                                title={tag.name}
                            />
                        ))}
                    </div>
                )}
                <h3 className={styles.name} title={nft.name}>
                    {nft.name}
                </h3>
                <p className={styles.collection} title={nft.collection}>
                    {nft.collection.split('-')[0]}
                </p>

                {/* Price if listed */}
                {nft.price && (
                    <div className={styles.price}>
                        <span className={styles.priceValue}>{nft.price}</span>
                        <span className={styles.priceUnit}>EGLD</span>
                    </div>
                )}
            </div>
        </div>
    );
}
