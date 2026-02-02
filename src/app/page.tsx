'use client';

/* =====================================================
   🥓 BACON WALLET - Home Page (Dashboard)
   Simplified version for initial UI development
   ===================================================== */

import Link from 'next/link';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/out/react/loginInfo/useGetLoginInfo';
import { useAccount, useNFTs, useNFTCountByCollection, useTransactions } from '@/hooks';
import { useFolders } from '@/hooks/useFolders';
import * as api from '@/services/mx-api';
import styles from './page.module.css';

// Helpers
const formatCompact = (val: number) => {
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val);
};

export default function HomePage() {
  const { isLoggedIn } = useGetLoginInfo();
  const { address } = useGetAccount();

  // Data fetching
  const { data: account } = useAccount(address);
  // Fetch just 1 NFT to get total count efficiently
  const { totalCount: nftCount } = useNFTs(address, { pageSize: 1 });
  const { data: collections } = useNFTCountByCollection(address);
  const { customFolders, folderLimit } = useFolders({ address, isPremium: false });
  const { data: transactions } = useTransactions(address, 5);

  const collectionCount = collections ? Object.keys(collections).length : 0;
  const username = account?.herotag || (address ? api.shortenAddress(address) : 'Sizzler');
  const balance = account?.balanceFormatted || '0';

  // Calculate approx portfolio (just EGLD for now + dummy NFT value if possible, else just EGLD)
  // Mocking NFT value estimation: 0.5 EGLD per NFT? No, misleading. Just show EGLD balance.
  const portfolioValue = balance;


  if (!isLoggedIn) {
    return (
      <div className={styles.welcomeContainer}>
        <div className={styles.heroSection}>
          <div className={styles.heroIcon}>🥓</div>
          <h1 className={styles.heroTitle}>
            Welcome to <span className={styles.highlight}>Bacon</span>
          </h1>
          <p className={styles.heroSubtitle}>
            The crispy way to manage your MultiversX NFT portfolio
          </p>

          <div className={styles.features}>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>📁</span>
              <h3 className={styles.featureTitle}>Smart Folders</h3>
              <p className={styles.featureDesc}>
                Organize NFTs with Classic, Manual, and Smart folders
              </p>
            </div>

            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🔥</span>
              <h3 className={styles.featureTitle}>Spam Detection</h3>
              <p className={styles.featureDesc}>
                Auto-detect and batch burn suspicious NFTs
              </p>
            </div>

            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>💰</span>
              <h3 className={styles.featureTitle}>OOX Integration</h3>
              <p className={styles.featureDesc}>
                List directly on OOX marketplace without leaving
              </p>
            </div>
          </div>

          <p className={styles.ctaText}>
            Connect your wallet to start organizing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <h1 className={styles.greetingTitle}>
          Good Morning, <span className={styles.highlight}>{username}</span>! 🥓
        </h1>
        <p className={styles.greetingSubtitle}>
          Your portfolio is looking crispy today
        </p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statBalance}`}>
          <span className={styles.statLabel}>Balance</span>
          <span className={styles.statValue}>
            {balance} <small>EGLD</small>
          </span>
          {/* <span className={styles.statChange}>+2.4%</span> */}
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total NFTs</span>
          <span className={styles.statValue}>{nftCount}</span>
          <span className={styles.statSubtext}>across {collectionCount} collections</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Portfolio Value</span>
          <span className={styles.statValue}>~{portfolioValue} EGLD</span>
          <span className={`${styles.statChange} ${styles.positive}`}>Live</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Folders</span>
          <span className={styles.statValue}>{customFolders.length} / {folderLimit}</span>
          <span className={styles.statSubtext}>
            {customFolders.length >= folderLimit ? 'Limit reached' : 'Available'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <button className={styles.actionBtn}>
            <span className={styles.actionIcon}>📤</span>
            <span>Send NFT</span>
          </button>
          <button className={styles.actionBtn}>
            <span className={styles.actionIcon}>🏷️</span>
            <span>List on OOX</span>
          </button>
          <button className={styles.actionBtn}>
            <span className={styles.actionIcon}>📁</span>
            <span>New Folder</span>
          </button>
          <button className={styles.actionBtn}>
            <span className={styles.actionIcon}>🔥</span>
            <span>Burn Spam</span>
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      {/* Recent Activity */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        {transactions && transactions.length > 0 ? (
          <div className={styles.activityList}>
            {transactions.map(tx => (
              <div key={tx.txHash} className={styles.activityItem} style={{
                padding: '12px',
                marginBottom: '8px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>
                    {tx.sender === address ? '↗️' : 'sw'}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {tx.action?.name || (tx.sender === address ? 'Sent' : 'Received')}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(tx.timestamp * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  {api.formatEGLD(tx.value)} EGLD
                </div>
              </div>
            ))}
            <Link href="/activity" style={{ color: 'var(--bacon-gold)', fontSize: '14px', marginTop: '8px', display: 'block' }}>
              View all activity →
            </Link>
          </div>
        ) : (
          <div className={styles.activityPlaceholder}>
            <span className={styles.activityIcon}>📊</span>
            <p>Your recent transactions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
