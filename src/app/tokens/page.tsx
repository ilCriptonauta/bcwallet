'use client';

import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { useTokens } from '@/hooks';
import * as api from '@/services/mx-api';
import styles from './page.module.css';

export default function TokensPage() {
    const { address: walletAddress } = useGetAccount();
    const address = walletAddress || 'erd1knr6ha4xat3juryp47x3duj4lykjhlxqhdu67vtj4ey9apy6aa5sg0hlem';
    const { data: tokens, isLoading } = useTokens(address);

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
                    </div>
                ))}
            </div>
        </div>
    );
}
