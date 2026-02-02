'use client';

/* =====================================================
   🥓 BACON WALLET - NFT Detail Modal
   Full-screen modal for viewing NFT details
   ===================================================== */

import { useEffect, useCallback, useState } from 'react';
import { NFT } from '@/types';
import styles from './NFTDetailModal.module.css';

interface NFTDetailModalProps {
    nft: NFT | null;
    isOpen: boolean;
    onClose: () => void;
    onSend?: (nft: NFT) => void;
    onList?: (nft: NFT) => void;
    onDownload?: (nft: NFT) => void;
    onManageTags?: (nft: NFT) => void;
}

export function NFTDetailModal({
    nft,
    isOpen,
    onClose,
    onSend,
    onList,
    onDownload,
    onManageTags,
}: NFTDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'attributes' | 'activity'>('details');
    const [imageLoaded, setImageLoaded] = useState(false);
    const [copied, setCopied] = useState(false);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Reset state when NFT changes
    useEffect(() => {
        setImageLoaded(false);
        setActiveTab('details');
    }, [nft?.identifier]);

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    const getMediaUrl = (): string => {
        if (!nft) return '';
        if (nft.media && nft.media.length > 0) {
            return nft.media[0].originalUrl || nft.media[0].url;
        }
        return nft.url || '';
    };

    const getThumbnailUrl = (): string => {
        if (!nft) return '';
        if (nft.media && nft.media.length > 0) {
            return nft.media[0].thumbnailUrl || nft.media[0].url;
        }
        return nft.thumbnailUrl || nft.url || '';
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
    };

    const parseAttributes = (): { trait_type: string; value: string }[] => {
        if (!nft) return [];

        // Try metadata attributes first
        if (nft.metadata?.attributes) {
            return nft.metadata.attributes.map(attr => ({
                trait_type: attr.trait_type,
                value: String(attr.value),
            }));
        }

        // Try to parse from attributes string
        if (nft.attributes) {
            try {
                // Base64 decode if needed
                const decoded = atob(nft.attributes);
                const parsed = JSON.parse(decoded);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
                if (parsed.attributes) {
                    return parsed.attributes;
                }
            } catch {
                // Try direct JSON parse
                try {
                    const parsed = JSON.parse(nft.attributes);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch {
                    // Return empty if can't parse
                }
            }
        }

        return [];
    };

    if (!isOpen || !nft) return null;

    const mediaUrl = getMediaUrl();
    const thumbnailUrl = getThumbnailUrl();
    const attributes = parseAttributes();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Close Button */}
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className={styles.content}>
                    {/* Left: Media */}
                    <div className={styles.mediaSection}>
                        <div className={styles.mediaContainer}>
                            {!imageLoaded && (
                                <div className={styles.imagePlaceholder}>
                                    <img
                                        src={thumbnailUrl}
                                        alt=""
                                        className={styles.thumbnailPreview}
                                    />
                                    <div className={styles.loadingOverlay}>
                                        <span className={styles.loadingIcon}>🥓</span>
                                    </div>
                                </div>
                            )}
                            <img
                                src={mediaUrl}
                                alt={nft.name}
                                className={`${styles.media} ${imageLoaded ? styles.loaded : ''}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={(e) => {
                                    console.error('Failed to load high-res image, falling back');
                                    setImageLoaded(true); // Hide placeholder even on error to show whatever we have
                                    // Optionally set a fallback image source if mediaUrl failed
                                    if (e.currentTarget.src !== thumbnailUrl) {
                                        e.currentTarget.src = thumbnailUrl;
                                    }
                                }}
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className={styles.quickActions}>
                            {onDownload && (
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => onDownload(nft)}
                                    title="Download high-resolution image"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span>Download HD</span>
                                </button>
                            )}
                            {onSend && (
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => onSend(nft)}
                                    title="Send NFT to another address"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                    <span>Send</span>
                                </button>
                            )}
                            {onList && (
                                <button
                                    className={`${styles.actionBtn} ${styles.primaryBtn}`}
                                    onClick={() => onList(nft)}
                                    title="List on OOX Marketplace"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                        <line x1="7" y1="7" x2="7.01" y2="7" />
                                    </svg>
                                    <span>List on OOX</span>
                                </button>
                            )}
                            {onManageTags && (
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => onManageTags(nft)}
                                    title="Manage folders and tags"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="14" width="7" height="7" rx="1" />
                                        <rect x="3" y="14" width="7" height="7" rx="1" />
                                    </svg>
                                    <span>Organize</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className={styles.detailsSection}>
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.collectionBadge}>
                                {nft.collection.split('-')[0]}
                            </div>
                            <h1 className={styles.title}>{nft.name}</h1>

                            {nft.rank && (
                                <div className={styles.rankBadge}>
                                    <span className={styles.rankLabel}>Rank</span>
                                    <span className={styles.rankValue}>#{nft.rank}</span>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
                                onClick={() => setActiveTab('details')}
                            >
                                Details
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'attributes' ? styles.active : ''}`}
                                onClick={() => setActiveTab('attributes')}
                            >
                                Attributes ({attributes.length})
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
                                onClick={() => setActiveTab('activity')}
                            >
                                Activity
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className={styles.tabContent}>
                            {activeTab === 'details' && (
                                <div className={styles.detailsTab}>
                                    {/* Description */}
                                    {nft.metadata?.description && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Description</span>
                                            <p className={styles.description}>{nft.metadata.description}</p>
                                        </div>
                                    )}

                                    {/* Token ID */}
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Token ID</span>
                                        <div className={styles.copyableValue}>
                                            <code className={styles.identifier}>{nft.identifier}</code>
                                            <button
                                                className={styles.copyBtn}
                                                onClick={() => copyToClipboard(nft.identifier)}
                                            >
                                                {copied ? '✓' : '📋'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Collection */}
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Collection</span>
                                        <span className={styles.detailValue}>{nft.collection}</span>
                                    </div>

                                    {/* Creator */}
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Creator</span>
                                        <a
                                            href={`https://explorer.multiversx.com/accounts/${nft.creator}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.addressLink}
                                        >
                                            {formatAddress(nft.creator)}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                <polyline points="15,3 21,3 21,9" />
                                                <line x1="10" y1="14" x2="21" y2="3" />
                                            </svg>
                                        </a>
                                    </div>

                                    {/* Royalties */}
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Royalties</span>
                                        <span className={styles.detailValue}>{(nft.royalties / 100).toFixed(2)}%</span>
                                    </div>

                                    {/* Type */}
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Token Type</span>
                                        <span className={styles.typeBadge}>{nft.type}</span>
                                    </div>

                                    {/* Explorer Link */}
                                    <a
                                        href={`https://explorer.multiversx.com/nfts/${nft.identifier}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.explorerLink}
                                    >
                                        View on Explorer
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                            <polyline points="15,3 21,3 21,9" />
                                            <line x1="10" y1="14" x2="21" y2="3" />
                                        </svg>
                                    </a>
                                </div>
                            )}

                            {activeTab === 'attributes' && (
                                <div className={styles.attributesTab}>
                                    {attributes.length > 0 ? (
                                        <div className={styles.attributesGrid}>
                                            {attributes.map((attr, index) => (
                                                <div key={index} className={styles.attributeCard}>
                                                    <span className={styles.attrType}>{attr.trait_type}</span>
                                                    <span className={styles.attrValue}>{attr.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.emptyAttributes}>
                                            <span className={styles.emptyIcon}>🏷️</span>
                                            <p>No attributes available</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div className={styles.activityTab}>
                                    <div className={styles.emptyActivity}>
                                        <span className={styles.emptyIcon}>📊</span>
                                        <p>Transaction history coming soon</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
