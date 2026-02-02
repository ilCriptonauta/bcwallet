'use client';

import { useState } from 'react';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { useTransactions } from '@/hooks';
import * as api from '@/services/mx-api';
import { CONFIG } from '@/config/config';
import styles from './page.module.css';

export default function ActivityPage() {
    const { address: walletAddress } = useGetAccount();
    const address = walletAddress;
    const { data: transactions, isLoading } = useTransactions(address, 50);
    const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

    if (isLoading) {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>Activity</h1>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                    <div className={styles.loader}>Loading transactions...</div>
                </div>
            </div>
        );
    }

    if (!address) {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>Activity</h1>
                <div style={{
                    padding: '48px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    marginTop: '24px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
                    <h2 style={{ marginBottom: '8px' }}>Wallet Not Connected</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Connect your wallet to view your transaction history</p>
                </div>
            </div>
        );
    }

    const filteredTransactions = transactions?.filter(tx => {
        if (filter === 'all') return true;
        if (filter === 'sent') return tx.sender === address;
        if (filter === 'received') return tx.receiver === address;
        return true;
    }) || [];

    const getTxType = (tx: any) => {
        if (tx.sender === address && tx.receiver === address) return 'self';
        if (tx.sender === address) return 'out';
        return 'in';
    };

    const getExplorerUrl = (txHash: string) => {
        return `${CONFIG.network.explorerAddress}/transactions/${txHash}`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Activity</h1>
                <div className={styles.filters}>
                    <button
                        className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'sent' ? styles.active : ''}`}
                        onClick={() => setFilter('sent')}
                    >
                        Sent
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'received' ? styles.active : ''}`}
                        onClick={() => setFilter('received')}
                    >
                        Received
                    </button>
                </div>
            </div>

            {filteredTransactions.length === 0 ? (
                <div style={{
                    padding: '48px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
                    <p style={{ color: 'var(--text-secondary)' }}>No transactions found</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {filteredTransactions.map(tx => {
                        const type = getTxType(tx);
                        const isOut = type === 'out';
                        const icon = type === 'self' ? '⚡' : (isOut ? '↗️' : '↙️');

                        return (
                            <a
                                key={tx.txHash}
                                href={getExplorerUrl(tx.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.txItem}
                            >
                                <div className={styles.txLeft}>
                                    <div className={`${styles.txIcon} ${styles[type]}`}>
                                        {icon}
                                    </div>
                                    <div className={styles.txDetails}>
                                        <div className={styles.txAction}>
                                            {tx.action?.name || (isOut ? 'Sent' : 'Received')}
                                            {tx.action?.description && <span style={{ fontWeight: 'normal', opacity: 0.7 }}> - {tx.action.description}</span>}
                                        </div>
                                        <div className={styles.txMeta}>
                                            <span>{new Date(tx.timestamp * 1000).toLocaleString()}</span>
                                            <span className={styles.txHash}>{tx.txHash.slice(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.txRight}>
                                    <div className={styles.txValue}>
                                        {api.formatEGLD(tx.value)} EGLD
                                    </div>
                                    <div className={`${styles.txStatus} ${styles[tx.status]}`}>
                                        {tx.status}
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
