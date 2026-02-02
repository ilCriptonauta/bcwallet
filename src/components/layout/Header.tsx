'use client';

/* =====================================================
   🥓 BACON WALLET - Header Component
   ===================================================== */

import { useState } from 'react';
import styles from './Header.module.css';
import { WalletButton } from '@/components/wallet/WalletButton';
import { BaconIcon, SearchIcon } from '@/components/ui/Icons';
import { CURRENT_NETWORK, NETWORK_CONFIG } from '@/lib/constants';

export function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                {/* Logo */}
                <div className={styles.logo}>
                    <span className={styles.logoIcon}><BaconIcon size={28} /></span>
                    <span className={styles.logoText}>Bacon</span>
                </div>
            </div>

            <div className={styles.center}>
                {/* Search Bar */}
                <div className={`${styles.searchContainer} ${isSearchOpen ? styles.searchOpen : ''}`}>
                    <button
                        className={styles.searchToggle}
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        aria-label="Toggle search"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                    </button>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search NFTs, collections..."
                        aria-label="Search"
                    />
                </div>
            </div>

            <div className={styles.right}>
                {/* Network Indicator */}
                <div className={styles.networkBadge}>
                    <span className={styles.networkDot} />
                    <span className={styles.networkName}>Mainnet</span>
                </div>

                {/* Wallet Button */}
                <WalletButton />
            </div>
        </header>
    );
}
