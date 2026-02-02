'use client';

import { useState } from 'react';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/out/react/loginInfo/useGetLoginInfo';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { getAccountProvider, setAccountProvider } from '@multiversx/sdk-dapp/out/providers/helpers/accountProvider';
import { ProviderFactory } from '@multiversx/sdk-dapp/out/providers/ProviderFactory';
import { ProviderTypeEnum, ProviderType } from '@multiversx/sdk-dapp/out/providers/types/providerFactory.types';
import { WalletConnectV2Provider } from '@multiversx/sdk-wallet-connect-provider/out/walletConnectV2Provider';
import { QRCodeSVG } from 'qrcode.react';
import styles from './WalletConnect.module.css';
import { CONFIG } from '../../config/config';

export function WalletConnect({ minimized = false }: { minimized?: boolean }) {
    const { isLoggedIn } = useGetLoginInfo();
    const { address } = useGetAccount();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [wcUri, setWcUri] = useState<string>('');

    const handleLogout = async () => {
        try {
            const provider = getAccountProvider();
            await provider.logout();
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
                setIsLoading(false); // Stop generic loading to show QR
            }

            // Wait for user approval
            await approval();

            // Finalize login
            await provider.login();

            // Monkey-patch to satisfy DappProvider interface for sdk-dapp
            (provider as any).getType = () => ProviderTypeEnum.walletConnect;
            (provider as any).getProvider = () => provider;
            (provider as any).isInitialized = () => true;

            // Set global provider for sdk-dapp to pick up
            setAccountProvider(provider as any);

            // Close modal (redundant with onClientLogin but safe)
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
            const provider = await ProviderFactory.create({
                type,
                // callbackUrl: window.location.href // for web wallet
            });
            await provider.login();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatAddress = (addr: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (minimized) {
        return (
            <>
                <button
                    className={`${styles.miniBtn} ${isLoggedIn ? styles.miniConnected : ''}`}
                    onClick={isLoggedIn ? handleLogout : () => setIsModalOpen(true)}
                    title={isLoggedIn ? "Disconnect" : "Connect Wallet"}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                </button>
                {/* Modal logic */}
                {isModalOpen && !isLoggedIn && (
                    <div className={styles.backdrop} onClick={() => { setIsModalOpen(false); setWcUri(''); }}>
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <div className={styles.header}>
                                <h2 className={styles.title}>Connect Wallet</h2>
                                <button className={styles.closeBtn} onClick={() => { setIsModalOpen(false); setWcUri(''); }}>
                                    ✕
                                </button>
                            </div>
                            {isLoading ? (
                                <div className={styles.loading}>
                                    <div className={styles.spinner} />
                                    <p>Connecting...</p>
                                </div>
                            ) : wcUri ? (
                                <div className={styles.qrContainer}>
                                    <QRCodeSVG value={wcUri} size={200} />
                                    <p>Scan with xPortal App</p>
                                </div>
                            ) : (
                                <div className={styles.providersList}>
                                    <button
                                        className={styles.providerBtn}
                                        onClick={handleXPortalLogin}
                                    >
                                        <span>xPortal App</span>
                                    </button>
                                    <button
                                        className={styles.providerBtn}
                                        onClick={() => handleLogin(ProviderTypeEnum.extension)}
                                    >
                                        <span>DeFi Wallet (Extension)</span>
                                    </button>
                                    <button
                                        className={styles.providerBtn}
                                        onClick={() => handleLogin(ProviderTypeEnum.crossWindow)}
                                    >
                                        <span>Web Wallet</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </>
        );
    }

    if (isLoggedIn) {
        return (
            <div className={styles.connectedContainer}>
                <div className={styles.addressDisplay} title={address}>
                    <span className={styles.indicator}>●</span>
                    {formatAddress(address)}
                </div>
                <button className={styles.disconnectBtn} onClick={handleLogout} title="Disconnect">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <>
            <button
                className={styles.connectBtn}
                onClick={() => setIsModalOpen(true)}
            >
                Connect Wallet
            </button>

            {isModalOpen && (
                <div className={styles.backdrop} onClick={() => { setIsModalOpen(false); setWcUri(''); }}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h2 className={styles.title}>Connect Wallet</h2>
                            <button className={styles.closeBtn} onClick={() => { setIsModalOpen(false); setWcUri(''); }}>
                                ✕
                            </button>
                        </div>

                        {isLoading ? (
                            <div className={styles.loading}>
                                <div className={styles.spinner} />
                                <p>Connecting...</p>
                            </div>
                        ) : wcUri ? (
                            <div className={styles.qrContainer}>
                                <QRCodeSVG value={wcUri} size={200} />
                                <p>Scan with xPortal App</p>
                            </div>
                        ) : (
                            <div className={styles.providersList}>
                                <button
                                    className={styles.providerBtn}
                                    onClick={handleXPortalLogin}
                                >
                                    <span>xPortal App</span>
                                </button>
                                <button
                                    className={styles.providerBtn}
                                    onClick={() => handleLogin(ProviderTypeEnum.extension)}
                                >
                                    <span>DeFi Wallet (Extension)</span>
                                </button>
                                <button
                                    className={styles.providerBtn}
                                    onClick={() => handleLogin(ProviderTypeEnum.crossWindow)}
                                >
                                    <span>Web Wallet</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}



