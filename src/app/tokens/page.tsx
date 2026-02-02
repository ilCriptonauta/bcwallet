'use client';

import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { useTokens } from '@/hooks';
import * as api from '@/services/mx-api';
import { useState } from 'react';
import { SendModal } from '@/components/transaction/SendModal';
import styles from './page.module.css';

export default function TokensPage() {
    const { address: walletAddress } = useGetAccount();
    const address = walletAddress;
    const { data: tokens, isLoading } = useTokens(address);
    const [sendToken, setSendToken] = useState<api.Token | null>(null);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>My Tokens</h1>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                    Loading tokens...
                </div>
            </div>
        );
    }

    if (!address) {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>My Tokens</h1>
                <div style={{
                    padding: '48px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    marginTop: '24px'
                }}>
                    <p>Connect your wallet to view tokens</p>
                </div>
            </div>
        );
    }

    if (!tokens || tokens.length === 0) {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>My Tokens</h1>
                <div style={{
                    padding: '48px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    marginTop: '24px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>🪙</div>
                    <p style={{ color: 'var(--text-secondary)' }}>No ESDT tokens found in this wallet</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Tokens ({tokens.length})</h1>
            </div>

            <div className={styles.grid}>
                {tokens.map(token => (
                    <div key={token.identifier} className={styles.tokenCard}>
                        <div className={styles.tokenIcon}>
                            {token.assets?.svgUrl || token.assets?.pngUrl ? (
                                <img src={token.assets.svgUrl || token.assets.pngUrl} alt={token.ticker} />
                            ) : (
                                <span>💰</span>
                            )}
                        </div>
                        <div className={styles.tokenInfo}>
                            <div className={styles.tokenName}>{token.name}</div>
                            <div className={styles.tokenTicker}>{token.ticker}</div>
                        </div>
                        <div className={styles.tokenBalance}>
                            <div className={styles.balanceValue}>
                                {api.formatTokenBalance(token.balance, token.decimals)}
                            </div>
                            {/* <div className={styles.balanceUsd}>$0.00</div> */}
                        </div>
                        <button
                            className={styles.sendTokenBtn}
                            onClick={() => setSendToken(token)}
                            title={`Send ${token.ticker}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <SendModal
                isOpen={sendToken !== null}
                onClose={() => setSendToken(null)}
                initialToken={sendToken}
            />
        </div>
    );
}
