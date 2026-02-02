'use client';

/* =====================================================
   🥓 BACON WALLET - SendModal Component
   Modal for sending EGLD, Tokens, or NFTs
   ===================================================== */

import { useState, useEffect } from 'react';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { NFT } from '@/types';
import { Token } from '@/services/mx-api';
import { NETWORK_CONFIG } from '@/lib/constants';
import styles from './SendModal.module.css';

// ---- Bech32 utilities (no external deps) ----
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Decode(address: string): Uint8Array | null {
    if (!address.startsWith('erd1') || address.length !== 62) return null;

    const data = address.slice(4); // Remove 'erd1'
    const values: number[] = [];

    for (const char of data) {
        const idx = CHARSET.indexOf(char);
        if (idx === -1) return null;
        values.push(idx);
    }

    // Convert from 5-bit groups to 8-bit bytes
    let acc = 0;
    let bits = 0;
    const result: number[] = [];

    for (const value of values) {
        acc = (acc << 5) | value;
        bits += 5;
        while (bits >= 8) {
            bits -= 8;
            result.push((acc >> bits) & 0xff);
        }
    }

    // Return first 32 bytes (public key, ignore checksum)
    return new Uint8Array(result.slice(0, 32));
}

function isValidAddress(address: string): boolean {
    return bech32Decode(address) !== null;
}

function addressToHex(address: string): string {
    const bytes = bech32Decode(address);
    if (!bytes) return '';
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- Component ----
interface SendModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialNFT?: NFT | null;
    initialToken?: Token | null;
}

export function SendModal({ isOpen, onClose, initialNFT, initialToken }: SendModalProps) {
    const { address, balance } = useGetAccount();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setRecipient('');
            setAmount('');
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen, initialNFT, initialToken]);

    if (!isOpen) return null;

    const isNFT = !!initialNFT;
    const isToken = !!initialToken;
    const isEGLD = !isNFT && !isToken;

    // Format balance for display
    const formatBalance = (bal: string) => {
        return (parseFloat(bal) / 1e18).toFixed(4);
    };

    const handleSend = async () => {
        try {
            setError(null);
            setIsLoading(true);

            // Validate recipient address
            if (!isValidAddress(recipient)) {
                throw new Error('Invalid recipient address. Must be a valid erd1... address.');
            }

            if (recipient === address) {
                throw new Error('Cannot send to yourself');
            }

            if (!isNFT && (!amount || parseFloat(amount) <= 0)) {
                throw new Error('Please enter a valid amount');
            }

            let txData = '';
            let txValue = '0';
            let txReceiver = recipient;
            let txGasLimit = 60000;

            if (isNFT && initialNFT) {
                // ESDTNFTTransfer
                const collectionHex = Buffer.from(initialNFT.collection).toString('hex');
                let nonceHex = initialNFT.nonce.toString(16);
                if (nonceHex.length % 2 !== 0) nonceHex = '0' + nonceHex;
                const quantityHex = '01';
                const destHex = addressToHex(recipient);

                txData = `ESDTNFTTransfer@${collectionHex}@${nonceHex}@${quantityHex}@${destHex}`;
                txReceiver = address; // NFT transfers are sent to self
                txGasLimit = 1500000;
            } else if (isEGLD) {
                // Simple EGLD transfer
                const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
                txValue = amountInWei.toString();
            } else if (isToken && initialToken) {
                // ESDTTransfer
                const tokenHex = Buffer.from(initialToken.identifier).toString('hex');
                const amountInSmallest = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, initialToken.decimals)));
                let amountHex = amountInSmallest.toString(16);
                if (amountHex.length % 2 !== 0) amountHex = '0' + amountHex;

                txData = `ESDTTransfer@${tokenHex}@${amountHex}`;
                txGasLimit = 500000;
            }

            // Build Web Wallet URL for signing
            const webWalletUrl = NETWORK_CONFIG.walletAddress;
            const callbackUrl = encodeURIComponent(window.location.href);

            const txParams = new URLSearchParams({
                receiver: txReceiver,
                value: txValue,
                gasLimit: txGasLimit.toString(),
                data: txData ? btoa(txData) : '',
                callbackUrl: callbackUrl,
            });

            const signUrl = `${webWalletUrl}/hook/transaction?${txParams.toString()}`;

            // Build transaction preview message
            let previewMsg = '📋 Transaction Preview\n\n';
            previewMsg += `To: ${recipient.slice(0, 10)}...${recipient.slice(-8)}\n`;

            if (isNFT && initialNFT) {
                previewMsg += `Asset: ${initialNFT.name} (NFT)\n`;
                previewMsg += `Collection: ${initialNFT.collection}\n`;
            } else if (isToken && initialToken) {
                previewMsg += `Amount: ${amount} ${initialToken.ticker}\n`;
            } else {
                previewMsg += `Amount: ${amount} EGLD\n`;
            }

            previewMsg += `\nGas Limit: ${txGasLimit.toLocaleString()}\n`;
            previewMsg += '\n⚠️ You will be redirected to MultiversX Web Wallet to sign.';

            // Confirm and redirect
            if (confirm(previewMsg)) {
                window.location.href = signUrl;
            } else {
                setIsLoading(false);
            }

        } catch (err: any) {
            console.error('Send error:', err);
            setError(err.message || 'Transaction failed');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {isNFT ? 'Send NFT' : isToken ? `Send ${initialToken?.ticker}` : 'Send EGLD'}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.section}>
                    {/* NFT Preview */}
                    {isNFT && initialNFT && (
                        <div className={styles.preview}>
                            <img
                                src={initialNFT.url || initialNFT.media?.[0]?.url || '/placeholder.png'}
                                alt={initialNFT.name}
                                className={styles.previewImage}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIi8+PC9zdmc+';
                                }}
                            />
                            <div className={styles.previewDetails}>
                                <div className={styles.previewName}>{initialNFT.name}</div>
                                <div className={styles.previewCollection}>{initialNFT.collection}</div>
                            </div>
                        </div>
                    )}

                    {/* Amount Input for EGLD/Token */}
                    {!isNFT && (
                        <div className={styles.inputGroup}>
                            <label className={styles.sectionLabel}>
                                Amount {isToken ? `(${initialToken?.ticker})` : '(EGLD)'}
                            </label>
                            <div className={styles.amountInputContainer}>
                                <input
                                    type="number"
                                    className={styles.amountInput}
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    step="any"
                                    min="0"
                                />
                                <button
                                    className={styles.maxBtn}
                                    onClick={() => {
                                        if (isEGLD) {
                                            const bal = parseFloat(balance) / 1e18;
                                            const max = bal > 0.01 ? bal - 0.01 : 0;
                                            setAmount(max.toFixed(4));
                                        } else if (initialToken) {
                                            const bal = parseFloat(initialToken.balance) / Math.pow(10, initialToken.decimals);
                                            setAmount(bal.toString());
                                        }
                                    }}
                                >
                                    MAX
                                </button>
                            </div>
                            <div className={styles.balanceInfo}>
                                <span>
                                    Balance: {isEGLD
                                        ? `${formatBalance(balance)} EGLD`
                                        : initialToken
                                            ? `${(parseFloat(initialToken.balance) / Math.pow(10, initialToken.decimals)).toFixed(4)} ${initialToken.ticker}`
                                            : '—'
                                    }
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Recipient Input */}
                    <div className={styles.inputGroup}>
                        <label className={styles.sectionLabel}>Recipient Address</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="erd1..."
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                        />
                    </div>

                    {/* Error Message */}
                    {error && <div className={styles.errorText}>{error}</div>}

                    {/* Send Button */}
                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={isLoading || !recipient || (!isNFT && !amount)}
                    >
                        {isLoading ? (
                            'Preparing...'
                        ) : (
                            <>
                                Send Now
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
