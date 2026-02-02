'use client';

/* =====================================================
   🥓 BACON WALLET - SendModal Component
   Modal for sending EGLD, Tokens, or NFTs
   ===================================================== */

import { useState, useEffect } from 'react';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { NFT } from '@/types';
import { Token, resolveHerotag } from '@/services/mx-api';
import { NETWORK_CONFIG } from '@/lib/constants';
import { Transaction, Address } from '@multiversx/sdk-core';
import { getAccountProvider } from '@multiversx/sdk-dapp/out/providers/helpers/accountProvider';
import { refreshAccount } from '@multiversx/sdk-dapp/out/utils/account/refreshAccount';
import { TransactionManager } from '@multiversx/sdk-dapp/out/managers/TransactionManager/TransactionManager';
import { useGetNetworkConfig } from '@multiversx/sdk-dapp/out/react/network/useGetNetworkConfig';
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
    const { address, balance, nonce } = useGetAccount();
    const { network } = useGetNetworkConfig();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setRecipient('');
            setAmount('');
            setError(null);
            setIsLoading(false);
            setIsResolving(false);
            setResolvedAddress(null);
        }
    }, [isOpen, initialNFT, initialToken]);

    // Debounced herotag resolution
    useEffect(() => {
        const timer = setTimeout(async () => {
            const trimmed = recipient.trim();
            if (!trimmed || trimmed.startsWith('erd1') || trimmed.length < 3) {
                setResolvedAddress(null);
                return;
            }

            const isHerotag = trimmed.includes('.elrond') || trimmed.startsWith('@') || (!trimmed.startsWith('erd1') && !trimmed.includes(' '));

            if (isHerotag) {
                setIsResolving(true);
                try {
                    const resolved = await resolveHerotag(trimmed);
                    setResolvedAddress(resolved);
                } catch (err) {
                    setResolvedAddress(null);
                } finally {
                    setIsResolving(false);
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [recipient]);

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

            let finalRecipient = recipient.trim();
            const isHerotag = !finalRecipient.startsWith('erd1') || finalRecipient.includes('.elrond') || finalRecipient.startsWith('@');

            if (isHerotag) {
                setIsResolving(true);
                const resolved = await resolveHerotag(finalRecipient);
                setIsResolving(false);

                if (!resolved) {
                    throw new Error(`Could not resolve herotag: ${finalRecipient}`);
                }
                finalRecipient = resolved;
                setResolvedAddress(resolved);
            }

            // Validate recipient address
            if (!isValidAddress(finalRecipient)) {
                throw new Error('Invalid recipient address. Must be a valid erd1... address or herotag.');
            }

            if (finalRecipient === address) {
                throw new Error('Cannot send to yourself');
            }

            if (!isNFT && (!amount || parseFloat(amount) <= 0)) {
                throw new Error('Please enter a valid amount');
            }

            // --- BUILD TRANSACTION ---
            await refreshAccount(); // Get latest nonce

            let txPayload = '';
            let txValue = '0';
            let txReceiver = finalRecipient;
            let txGasLimit = 60000;

            if (isNFT && initialNFT) {
                // ESDTNFTTransfer
                const collectionHex = Buffer.from(initialNFT.collection).toString('hex');
                let nonceHex = initialNFT.nonce.toString(16);
                if (nonceHex.length % 2 !== 0) nonceHex = '0' + nonceHex;
                const quantityHex = '01';
                const destHex = addressToHex(finalRecipient);

                txPayload = `ESDTNFTTransfer@${collectionHex}@${nonceHex}@${quantityHex}@${destHex}`;
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

                txPayload = `ESDTTransfer@${tokenHex}@${amountHex}`;
                txGasLimit = 500000;
            }

            const transaction = new Transaction({
                value: BigInt(txValue),
                data: Buffer.from(txPayload),
                receiver: Address.newFromBech32(txReceiver),
                sender: Address.newFromBech32(address),
                gasLimit: BigInt(txGasLimit),
                chainID: network.chainId,
                nonce: BigInt(nonce)
            });

            // --- SIGN & SEND ---
            const provider = getAccountProvider();

            // This will open the wallet (Extension, xPortal, etc.)
            const signedTransactions = await provider.signTransactions([transaction]);

            const txManager = TransactionManager.getInstance();
            const sentTransactions = await txManager.send(signedTransactions);

            // Track for status toasts
            await txManager.track(sentTransactions, {
                transactionsDisplayInfo: {
                    processingMessage: 'Processing transaction...',
                    successMessage: 'Transaction successful! 🥓',
                    errorMessage: 'Transaction failed'
                }
            });

            onClose();

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
                        <label className={styles.sectionLabel}>Recipient Address / Herotag</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="erd1... or @herotag"
                            value={recipient}
                            onChange={(e) => {
                                setRecipient(e.target.value);
                                setResolvedAddress(null);
                                setError(null);
                            }}
                        />
                        {isResolving && <div className={styles.resolvingInfo}>🔍 Resolving herotag...</div>}
                        {resolvedAddress && !isResolving && (
                            <div className={styles.resolvedInfo}>
                                ✅ Resolved to: <code>{resolvedAddress.slice(0, 8)}...{resolvedAddress.slice(-8)}</code>
                            </div>
                        )}
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
