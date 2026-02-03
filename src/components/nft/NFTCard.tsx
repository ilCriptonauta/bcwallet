'use client';

/* =====================================================
   🥓 BACON WALLET - NFT Card Component
   Individual NFT display card with actions & drag support
   ===================================================== */

import { useState } from 'react';
import { NFT } from '@/types';
import { Tag } from '@/types/folders';
import {
    HeartIcon,
    SettingsIcon,
    DownloadIcon,
    SendIcon,
    TrashIcon,
    TagIcon,
    ShoppingBagIcon,
    XIcon
} from '@/components/ui/Icons';
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
    isMenuOpen?: boolean;
    onToggleMenu?: (open: boolean) => void;
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
    isMenuOpen = false,
    onToggleMenu,
}: NFTCardProps) {
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Find the best media to display (prefers animations if available)
    const getBestMedia = () => {
        if (!nft.media || nft.media.length === 0) {
            return { url: nft.thumbnailUrl || nft.url || '', isVideo: false };
        }

        // Try to find a video first
        const videoMedia = nft.media.find(m => m.fileType?.startsWith('video/'));
        if (videoMedia) {
            return { url: videoMedia.url, isVideo: true, thumbnail: videoMedia.thumbnailUrl || nft.thumbnailUrl };
        }

        // Try to find a GIF
        const gifMedia = nft.media.find(m => m.fileType === 'image/gif');
        if (gifMedia) {
            return { url: gifMedia.url, isVideo: false };
        }

        // Fallback to first thumbnail/url
        return {
            url: nft.media[0].thumbnailUrl || nft.media[0].url || nft.thumbnailUrl || nft.url || '',
            isVideo: false
        };
    };

    const media = getBestMedia();

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
            {/* Media Container */}
            <div className={styles.imageContainer}>
                {!imageError && media.url ? (
                    media.isVideo ? (
                        <video
                            src={media.url}
                            poster={media.thumbnail}
                            className={styles.image}
                            autoPlay
                            muted
                            loop
                            playsInline
                            onError={handleImageError}
                        />
                    ) : (
                        <img
                            src={media.url}
                            alt={nft.name}
                            className={styles.image}
                            onError={handleImageError}
                            loading="lazy"
                        />
                    )
                ) : (
                    <div className={styles.placeholder}>
                        <span>🖼️</span>
                    </div>
                )}

                {/* Selection Checkbox */}
                {isHovered && !isMenuOpen && (
                    <div className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelect?.(nft)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                {/* Actions Menu Overlay */}
                {isMenuOpen && (
                    <div className={styles.menuOverlay} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.menuTitle}>Actions</div>
                        <div className={styles.menuGrid}>
                            {onDownload && (
                                <button className={styles.menuItem} onClick={() => { onDownload(nft); onToggleMenu?.(false); }}>
                                    <div className={styles.menuIcon}><DownloadIcon size={18} /></div>
                                    <span>Download</span>
                                </button>
                            )}
                            {onSend && (
                                <button className={styles.menuItem} onClick={() => { onSend(nft); onToggleMenu?.(false); }}>
                                    <div className={styles.menuIcon}><SendIcon size={18} /></div>
                                    <span>Send</span>
                                </button>
                            )}
                            {onManageTags && (
                                <button className={styles.menuItem} onClick={() => { onManageTags(nft); onToggleMenu?.(false); }}>
                                    <div className={styles.menuIcon}><TagIcon size={18} /></div>
                                    <span>Tags</span>
                                </button>
                            )}
                            {onList && (
                                <button className={`${styles.menuItem} ${styles.menuPrimary}`} onClick={() => { onList(nft); onToggleMenu?.(false); }}>
                                    <div className={styles.menuIcon}><ShoppingBagIcon size={18} /></div>
                                    <span>List</span>
                                </button>
                            )}
                            {onMarkSpam && !isSpam && (
                                <button className={`${styles.menuItem} ${styles.menuDanger}`} onClick={() => { onMarkSpam(nft); onToggleMenu?.(false); }}>
                                    <div className={styles.menuIcon}><TrashIcon size={18} /></div>
                                    <span>Spam</span>
                                </button>
                            )}
                        </div>
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
                <div className={styles.nameRow}>
                    <h3 className={styles.name} title={nft.name}>
                        {nft.name}
                    </h3>

                    {/* Quick Actions (Heart & Gear) - Now moved below image */}
                    <div className={`${styles.bottomActions} ${(isHovered || isFavorite || isMenuOpen) ? styles.visible : ''}`}>
                        {onToggleFavorite && (
                            <button
                                className={`${styles.smallActionBtn} ${isFavorite ? styles.favorited : ''}`}
                                onClick={(e) => handleAction(e, () => onToggleFavorite(nft))}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <HeartIcon size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>
                        )}
                        <button
                            className={`${styles.smallActionBtn} ${isMenuOpen ? styles.active : ''}`}
                            onClick={(e) => handleAction(e, () => onToggleMenu?.(!isMenuOpen))}
                            title="Actions"
                        >
                            {isMenuOpen ? <XIcon size={14} /> : <SettingsIcon size={14} />}
                        </button>
                    </div>
                </div>

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
