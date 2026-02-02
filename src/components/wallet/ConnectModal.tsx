'use client';

/* =====================================================
   🥓 BACON WALLET - Connect Modal Component
   Simplified version for initial UI development
   ===================================================== */

import { useEffect, useCallback } from 'react';
import styles from './ConnectModal.module.css';

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    isConnected: boolean;
}

// Mock data for development
const MOCK_ADDRESS = 'erd1qqqqqqqqqqqqqq...example';
const MOCK_BALANCE = '10.5';

const WALLET_OPTIONS = [
    {
        id: 'xportal',
        name: 'xPortal App',
        description: 'Scan with xPortal',
        icon: '📱',
    },
    {
        id: 'extension',
        name: 'DeFi Wallet',
        description: 'Browser Extension',
        icon: '🔌',
    },
    {
        id: 'web',
        name: 'Web Wallet',
        description: 'MultiversX Web Wallet',
        icon: '🌐',
    },
    {
        id: 'ledger',
        name: 'Ledger',
        description: 'Hardware Wallet',
        icon: '🔐',
    },
];

export function ConnectModal({ isOpen, onClose, isConnected }: ConnectModalProps) {
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

    const handleWalletClick = useCallback((walletId: string) => {
        console.log('Connecting with:', walletId);
        // TODO: Implement actual wallet connection
        onClose();
    }, [onClose]);

    const handleLogout = useCallback(() => {
        console.log('Logging out...');
        onClose();
    }, [onClose]);

    const copyAddress = useCallback(() => {
        navigator.clipboard.writeText(MOCK_ADDRESS);
        // TODO: Show toast notification
    }, []);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Close Button */}
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {isConnected ? (
                    /* Connected State */
                    <div className={styles.connectedContent}>
                        <div className={styles.avatar}>🥓</div>
                        <h2 id="modal-title" className={styles.title}>Welcome, Sizzler!</h2>

                        <div className={styles.addressCard}>
                            <span className={styles.addressLabel}>Your Address</span>
                            <div className={styles.addressRow}>
                                <span className={styles.addressValue}>{formatAddress(MOCK_ADDRESS)}</span>
                                <button className={styles.copyBtn} onClick={copyAddress} aria-label="Copy address">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className={styles.balanceCard}>
                            <span className={styles.balanceLabel}>Balance</span>
                            <span className={styles.balanceValue}>
                                {MOCK_BALANCE} EGLD
                            </span>
                        </div>

                        <div className={styles.actions}>
                            <a
                                href={`https://explorer.multiversx.com/accounts/${MOCK_ADDRESS}`}
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

                            <button className={styles.logoutBtn} onClick={handleLogout}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16,17 21,12 16,7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Disconnect
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Connect State */
                    <div className={styles.connectContent}>
                        <div className={styles.logoWrapper}>
                            <span className={styles.logo}>🥓</span>
                        </div>
                        <h2 id="modal-title" className={styles.title}>Connect Wallet</h2>
                        <p className={styles.subtitle}>Choose your preferred wallet to get started</p>

                        <div className={styles.walletList}>
                            {WALLET_OPTIONS.map((wallet) => (
                                <button
                                    key={wallet.id}
                                    className={styles.walletOption}
                                    onClick={() => handleWalletClick(wallet.id)}
                                >
                                    <div className={styles.walletOptionContent}>
                                        <span className={styles.walletIcon}>{wallet.icon}</span>
                                        <div className={styles.walletInfo}>
                                            <span className={styles.walletName}>{wallet.name}</span>
                                            <span className={styles.walletDesc}>{wallet.description}</span>
                                        </div>
                                        <svg
                                            className={styles.walletArrow}
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <p className={styles.disclaimer}>
                            By connecting, you agree to our Terms of Service
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
