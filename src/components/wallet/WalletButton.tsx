'use client';

/* =====================================================
   🥓 BACON WALLET - Wallet Button Component
   Navbar wallet connection button with real SDK integration
   ===================================================== */

import { useState } from 'react';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/out/react/loginInfo/useGetLoginInfo';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { getAccountProvider, setAccountProvider } from '@multiversx/sdk-dapp/out/providers/helpers/accountProvider';
import { ProviderFactory } from '@multiversx/sdk-dapp/out/providers/ProviderFactory';
import { ProviderTypeEnum, ProviderType } from '@multiversx/sdk-dapp/out/providers/types/providerFactory.types';
import { WalletConnectV2Provider } from '@multiversx/sdk-wallet-connect-provider/out/walletConnectV2Provider';
import { QRCodeSVG } from 'qrcode.react';
import { WalletIcon, QrCodeIcon, ExternalLinkIcon, BaconIcon, ChevronDownIcon } from '@/components/ui/Icons';
import styles from './WalletButton.module.css';
import { CONFIG } from '../../config/config';

export function WalletButton() {
    const { isLoggedIn } = useGetLoginInfo();
    const { address, balance } = useGetAccount();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [wcUri, setWcUri] = useState<string>('');

    // Format address for display
    const formatAddress = (addr: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Format balance for display
    const formatBalance = (bal: string) => {
        if (!bal) return '0';
        return (parseFloat(bal) / 1e18).toFixed(4);
    };

    const handleLogout = async () => {
        try {
            const provider = getAccountProvider();
            await provider.logout();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleXPortalLogin = async () => {
        setIsLoading(true);
        setWcUri('');

        try {
            const callbacks = {
                onClientLogin: () => {
                    setIsModalOpen(false);
                    setIsLoading(false);
                },
                onClientLogout: () => {
                    console.log('Logged out from xPortal');
                },
                onClientEvent: (event: any) => {
                    console.log('xPortal event', event);
                }
            };

            const provider = new WalletConnectV2Provider(
                callbacks,
                CONFIG.network.id,
                CONFIG.walletConnect.relayUrl,
                CONFIG.walletConnect.projectId
            );

            await provider.init();

            const { uri, approval } = await provider.connect();

            if (uri) {
                setWcUri(uri);
                setIsLoading(false);
            }

            await approval();
            await provider.login();

            // Monkey-patch for sdk-dapp compatibility
            (provider as any).getType = () => ProviderTypeEnum.walletConnect;
            (provider as any).getProvider = () => provider;
            (provider as any).isInitialized = () => true;

            setAccountProvider(provider as any);
            setIsModalOpen(false);

        } catch (error) {
            console.error('XPortal login failed:', error);
            setIsLoading(false);
            setWcUri('');
        }
    };

    const handleLogin = async (type: ProviderType) => {
        setIsLoading(true);
        try {
            const provider = await ProviderFactory.create({ type });
            await provider.login();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setWcUri('');
        setIsLoading(false);
    };

    // Connected state - show address and dropdown
    if (isLoggedIn && address) {
        return (
            <div className={styles.wrapper}>
                <button
                    className={styles.connectedBtn}
                    onClick={() => setIsModalOpen(!isModalOpen)}
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
                        style={{ transform: isModalOpen ? 'rotate(180deg)' : 'none' }}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>

                {isModalOpen && (
                    <div className={styles.dropdown}>
                        <div className={styles.dropdownHeader}>
                            <span className={styles.dropdownBalance}>
                                {formatBalance(balance)} EGLD
                            </span>
                        </div>
                        <a
                            href={`https://explorer.multiversx.com/accounts/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.dropdownItem}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15,3 21,3 21,9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            View on Explorer
                        </a>
                        <button className={styles.dropdownItem} onClick={handleLogout}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
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
                onClick={() => setIsModalOpen(true)}
            >
                <span className={styles.connectIcon}><WalletIcon size={18} /></span>
                <span>Connect</span>
            </button>

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Connect Wallet</h2>
                            <button className={styles.closeBtn} onClick={closeModal}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalContent}>
                            {isLoading && !wcUri ? (
                                <div className={styles.loading}>
                                    <div className={styles.spinner} />
                                    <p>Connecting...</p>
                                </div>
                            ) : wcUri ? (
                                <div className={styles.qrContainer}>
                                    <QRCodeSVG value={wcUri} size={200} />
                                    <p className={styles.qrText}>Scan with xPortal App</p>
                                </div>
                            ) : (
                                <div className={styles.providerList}>
                                    <button
                                        className={styles.providerBtn}
                                        onClick={handleXPortalLogin}
                                    >
                                        <span className={styles.providerIcon}><QrCodeIcon size={22} /></span>
                                        <div className={styles.providerInfo}>
                                            <span className={styles.providerName}>xPortal App</span>
                                            <span className={styles.providerDesc}>Scan QR Code</span>
                                        </div>
                                        <svg className={styles.providerArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </button>

                                    <button
                                        className={styles.providerBtn}
                                        onClick={() => handleLogin(ProviderTypeEnum.extension)}
                                    >
                                        <span className={styles.providerIcon}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                                            </svg>
                                        </span>
                                        <div className={styles.providerInfo}>
                                            <span className={styles.providerName}>DeFi Wallet</span>
                                            <span className={styles.providerDesc}>Browser Extension</span>
                                        </div>
                                        <svg className={styles.providerArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </button>

                                    <button
                                        className={styles.providerBtn}
                                        onClick={() => handleLogin(ProviderTypeEnum.crossWindow)}
                                    >
                                        <span className={styles.providerIcon}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="2" y1="12" x2="22" y2="12" />
                                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                            </svg>
                                        </span>
                                        <div className={styles.providerInfo}>
                                            <span className={styles.providerName}>Web Wallet</span>
                                            <span className={styles.providerDesc}>MultiversX Web Wallet</span>
                                        </div>
                                        <svg className={styles.providerArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
