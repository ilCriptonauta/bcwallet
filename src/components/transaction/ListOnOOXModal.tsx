'use client';

/* =====================================================
   🥓 BACON WALLET - ListOnOOXModal Component
   Modal for listing NFTs on the OOX Marketplace
   ===================================================== */

import { useState, useEffect, useMemo } from 'react';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { getAccountProvider } from '@multiversx/sdk-dapp/out/providers/helpers/accountProvider';
import { refreshAccount } from '@multiversx/sdk-dapp/out/utils/account/refreshAccount';
import { Address, Transaction, ApiNetworkProvider } from '@multiversx/sdk-core';
import { NFT } from '@/types';
import { NETWORK_CONFIG } from '@/lib/constants';
import styles from './ListOnOOXModal.module.css';

// ---- Bech32 utilities (no external deps) ----
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Decode(address: string): Uint8Array | null {
    if (!address.startsWith('erd1') || address.length !== 62) return null;

    const data = address.slice(4);
    const values: number[] = [];

    for (const char of data) {
        const idx = CHARSET.indexOf(char);
        if (idx === -1) return null;
        values.push(idx);
    }

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

    return new Uint8Array(result.slice(0, 32));
}

function addressToHex(address: string): string {
    const bytes = bech32Decode(address);
    if (!bytes) return '';
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// OOX Marketplace Contract Address (Mainnet)
const OOX_CONTRACT_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwp73w2a9eyzs64eltupuz3y3hv798vlv899qrjnflg';

// Marketplace fee percentage (2.5% typical)
const MARKETPLACE_FEE_PERCENT = 2.5;

// Duration options in days
const DURATION_OPTIONS = [
    { label: '1 Day', days: 1 },
    { label: '3 Days', days: 3 },
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
];

interface ListOnOOXModalProps {
    isOpen: boolean;
    onClose: () => void;
    nft: NFT | null;
}

export function ListOnOOXModal({ isOpen, onClose, nft }: ListOnOOXModalProps) {
    const { address } = useGetAccount();
    const [listingType, setListingType] = useState<'fixed' | 'auction'>('fixed');
    const [price, setPrice] = useState('');
    const [minBid, setMinBid] = useState('');
    const [durationDays, setDurationDays] = useState(7);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setPrice('');
            setMinBid('');
            setDurationDays(7);
            setListingType('fixed');
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen, nft]);

    // Calculate fees
    const feeCalculation = useMemo(() => {
        const priceValue = parseFloat(listingType === 'fixed' ? price : minBid) || 0;
        const marketplaceFee = priceValue * (MARKETPLACE_FEE_PERCENT / 100);
        const royalties = nft?.royalties ? priceValue * (nft.royalties / 10000) : 0;
        const youReceive = priceValue - marketplaceFee - royalties;

        return {
            price: priceValue,
            marketplaceFee,
            royalties,
            royaltyPercent: nft?.royalties ? nft.royalties / 100 : 0,
            youReceive: Math.max(0, youReceive),
        };
    }, [price, minBid, listingType, nft?.royalties]);

    if (!isOpen || !nft) return null;

    const handleList = async () => {
        try {
            setError(null);
            setIsLoading(true);

            const priceValue = listingType === 'fixed' ? price : minBid;

            if (!priceValue || parseFloat(priceValue) <= 0) {
                throw new Error('Please enter a valid price');
            }

            // Calculate deadline timestamp
            const durationInSeconds = listingType === 'fixed'
                ? (365 * 24 * 60 * 60)
                : (durationDays * 24 * 60 * 60);
            const deadline = Math.floor(Date.now() / 1000) + durationInSeconds;

            // Convert price to wei
            const priceInWei = BigInt(Math.floor(parseFloat(priceValue) * 1e18));

            // Auction parameters
            const minBidWei = priceInWei;
            const maxBidWei = listingType === 'fixed' ? priceInWei : BigInt(0);

            // 1. Prepare Arguments for "auctionToken" function
            // min_bid (BigUint), max_bid (BigUint), deadline (u64), accepted_payment_token (Identifier)

            // Helper for even-length hex
            const toHex = (val: bigint | number) => {
                let hex = val.toString(16);
                if (hex.length % 2 !== 0) hex = '0' + hex;
                return hex;
            };

            const minBidHex = toHex(minBidWei);
            const maxBidHexSafe = maxBidWei === BigInt(0) ? '' : toHex(maxBidWei);

            // Deadline u64 -> hex
            const deadlineHex = toHex(deadline);

            // Token Identifier "EGLD"
            const tokenHex = Buffer.from('EGLD').toString('hex');

            // 2. Prepare ESDTNFTTransfer Arguments
            // Collection, Nonce, Quantity, Receiver (OOX Contract), Function (auctionToken), Args...
            const collectionHex = Buffer.from(nft.collection).toString('hex');
            const nonceHex = toHex(nft.nonce);
            const quantityHex = '01'; // 1
            const receiverHex = new Address(OOX_CONTRACT_ADDRESS).toHex();
            const functionHex = Buffer.from('auctionToken').toString('hex');

            // Construct Data Field
            // ESDTNFTTransfer @ <collection> @ <nonce> @ <qty> @ <receiver> @ <func> @ <min_bid> @ <max_bid> @ <deadline> @ <token>
            const dataParts = [
                'ESDTNFTTransfer',
                collectionHex,
                nonceHex,
                quantityHex,
                receiverHex,
                functionHex,
                minBidHex,
                maxBidHexSafe,
                deadlineHex,
                tokenHex
            ];

            const txData = dataParts.join('@');

            // 3. Send Transaction
            await refreshAccount();
            const provider = getAccountProvider();

            // Construct message/transaction
            const tx = new Transaction({
                value: BigInt(0),
                data: Buffer.from(txData),
                receiver: new Address(address),
                gasLimit: BigInt(15000000),
                sender: new Address(address),
                chainID: '1',
                version: 1
            });

            // Sign (returns signed transactions, but modifies in place too usually)
            // Note: Web Wallet will redirect here and flow stops.
            await provider.signTransactions([tx]);

            // Broadcast using API Provider (only reaches here if provider supports inline signing, e.g. Extension)
            const apiProvider = new ApiNetworkProvider(NETWORK_CONFIG.apiUrl);
            await apiProvider.sendTransaction(tx);

            onClose();

        } catch (err: any) {
            console.error('Listing error:', err);
            setError(err.message || 'Failed to create listing');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <span className={styles.titleIcon}>🏷️</span>
                        List on OOX
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* NFT Preview */}
                <div className={styles.preview}>
                    <img
                        src={nft.url || nft.media?.[0]?.url || '/placeholder.png'}
                        alt={nft.name}
                        className={styles.previewImage}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIi8+PC9zdmc+';
                        }}
                    />
                    <div className={styles.previewDetails}>
                        <div className={styles.previewName}>{nft.name}</div>
                        <div className={styles.previewCollection}>{nft.collection}</div>
                    </div>
                </div>

                {/* Listing Type Tabs */}
                <div className={styles.section}>
                    <span className={styles.sectionLabel}>Listing Type</span>
                    <div className={styles.listingTypeTabs}>
                        <button
                            className={`${styles.listingTypeTab} ${listingType === 'fixed' ? styles.active : ''}`}
                            onClick={() => setListingType('fixed')}
                        >
                            💰 Fixed Price
                        </button>
                        <button
                            className={`${styles.listingTypeTab} ${listingType === 'auction' ? styles.active : ''}`}
                            onClick={() => setListingType('auction')}
                        >
                            🔨 Auction
                        </button>
                    </div>
                </div>

                {/* Price Input */}
                <div className={styles.section}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            {listingType === 'fixed' ? 'Price' : 'Starting Bid'}
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="number"
                                className={styles.input}
                                placeholder="0.00"
                                value={listingType === 'fixed' ? price : minBid}
                                onChange={(e) => listingType === 'fixed'
                                    ? setPrice(e.target.value)
                                    : setMinBid(e.target.value)
                                }
                                step="any"
                                min="0"
                            />
                            <span className={styles.inputSuffix}>EGLD</span>
                        </div>
                    </div>
                </div>

                {/* Duration - Only for Auctions */}
                {listingType === 'auction' && (
                    <div className={styles.section}>
                        <span className={styles.sectionLabel}>Duration</span>
                        <div className={styles.durationSelect}>
                            {DURATION_OPTIONS.map((option) => (
                                <button
                                    key={option.days}
                                    className={`${styles.durationOption} ${durationDays === option.days ? styles.selected : ''}`}
                                    onClick={() => setDurationDays(option.days)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fee Summary */}
                {feeCalculation.price > 0 && (
                    <div className={styles.feeSummary}>
                        <div className={styles.feeRow}>
                            <span className={styles.feeLabel}>
                                {listingType === 'fixed' ? 'Listing Price' : 'Starting Bid'}
                            </span>
                            <span className={styles.feeValue}>{feeCalculation.price.toFixed(4)} EGLD</span>
                        </div>
                        <div className={styles.feeRow}>
                            <span className={styles.feeLabel}>Marketplace Fee ({MARKETPLACE_FEE_PERCENT}%)</span>
                            <span className={styles.feeValue}>-{feeCalculation.marketplaceFee.toFixed(4)} EGLD</span>
                        </div>
                        {feeCalculation.royalties > 0 && (
                            <div className={styles.feeRow}>
                                <span className={styles.feeLabel}>Creator Royalties ({feeCalculation.royaltyPercent}%)</span>
                                <span className={styles.feeValue}>-{feeCalculation.royalties.toFixed(4)} EGLD</span>
                            </div>
                        )}
                        <div className={`${styles.feeRow} ${styles.feeTotal}`}>
                            <span className={styles.feeLabel}>You Receive</span>
                            <span className={styles.feeValue}>{feeCalculation.youReceive.toFixed(4)} EGLD</span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && <div className={styles.errorText}>{error}</div>}

                {/* List Button */}
                <button
                    className={styles.listBtn}
                    onClick={handleList}
                    disabled={isLoading || (listingType === 'fixed' ? !price : !minBid)}
                >
                    {isLoading ? (
                        'Preparing...'
                    ) : (
                        <>
                            {listingType === 'fixed' ? 'List for Sale' : 'Start Auction'}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                <line x1="7" y1="7" x2="7.01" y2="7" />
                            </svg>
                        </>
                    )}
                </button>

                {/* OOX Branding */}
                <div className={styles.ooxBranding}>
                    <span>Powered by</span>
                    <strong style={{ color: 'var(--bacon-text-secondary)' }}>OOX Marketplace</strong>
                </div>
            </div>
        </div>
    );
}
