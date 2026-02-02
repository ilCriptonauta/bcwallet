'use client';

/* =====================================================
   🥓 BACON WALLET - Wallet Button Component
   Using UnlockPanelManager for reliable wallet connection
   ===================================================== */

import { useState, useEffect } from 'react';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/out/react/loginInfo/useGetLoginInfo';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { getAccountProvider } from '@multiversx/sdk-dapp/out/providers/helpers/accountProvider';
import { UnlockPanelManager } from '@multiversx/sdk-dapp/out/managers/UnlockPanelManager';
import { WalletIcon, BaconIcon, ExternalLinkIcon, LogOutIcon } from '@/components/ui/Icons';
import * as api from '@/services/mx-api';
import styles from './WalletButton.module.css';
import { NETWORK_CONFIG } from '@/lib/constants';

export function WalletButton() {
    const { isLoggedIn } = useGetLoginInfo();
    const { address, balance } = useGetAccount();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Format address for display
    const formatAddress = (addr: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Format balance for display
    const formatBalance = (bal: string) => {
        return api.formatEGLD(bal);
    };

    const handleLogout = async () => {
        try {
            const provider = getAccountProvider();
            await provider.logout();
            setIsDropdownOpen(false);
            // Force page reload to clear state
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleConnect = () => {
        // Use UnlockPanelManager - the official SDK way
        const unlockPanelManager = UnlockPanelManager.init({
            loginHandler: () => {
                // Called after successful login
                console.log('Login successful');
                // Refresh to update state
                window.location.reload();
            },
            onClose: async () => {
                console.log('UnlockPanel closed');
            }
        });

        unlockPanelManager.openUnlockPanel();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(`.${styles.wrapper}`)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => document.removeEventListener('click', handleClickOutside);
    }, [isDropdownOpen]);

    // Connected state - show address and dropdown
    if (isLoggedIn && address) {
        return (
            <div className={styles.wrapper}>
                <button
                    className={styles.connectedBtn}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <span className={styles.avatar}><BaconIcon size={18} /></span>
                    <span className={styles.address}>{formatAddress(address)}</span>
                    <svg
                        className={styles.chevron}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>

                {isDropdownOpen && (
                    <div className={styles.dropdown}>
                        <div className={styles.dropdownHeader}>
                            <span className={styles.dropdownBalance}>
                                {formatBalance(balance)} {NETWORK_CONFIG.egldLabel}
                            </span>
                        </div>
                        <a
                            href={`${NETWORK_CONFIG.explorerUrl}/accounts/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.dropdownItem}
                        >
                            <ExternalLinkIcon size={16} />
                            View on Explorer
                        </a>
                        <button className={styles.dropdownItem} onClick={handleLogout}>
                            <LogOutIcon size={16} />
                            Disconnect
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Not connected - show connect button
    return (
        <div className={styles.wrapper}>
            <button
                className={styles.connectBtn}
                onClick={handleConnect}
            >
                <span className={styles.connectIcon}><WalletIcon size={18} /></span>
                <span>Connect</span>
            </button>
        </div>
    );
}
