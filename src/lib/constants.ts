/* =====================================================
   🥓 BACON WALLET - Configuration Constants
   ===================================================== */

import { NetworkConfig, NetworkType } from '@/types';

// ---- Network Configurations ----
export const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
    mainnet: {
        name: 'MultiversX Mainnet',
        apiUrl: 'https://api.multiversx.com',
        explorerUrl: 'https://explorer.multiversx.com',
        walletAddress: 'https://wallet.multiversx.com',
        chainId: '1',
        egldLabel: 'EGLD',
    },
    devnet: {
        name: 'MultiversX Devnet',
        apiUrl: 'https://devnet-api.multiversx.com',
        explorerUrl: 'https://devnet-explorer.multiversx.com',
        walletAddress: 'https://devnet-wallet.multiversx.com',
        chainId: 'D',
        egldLabel: 'xEGLD',
    },
    testnet: {
        name: 'MultiversX Testnet',
        apiUrl: 'https://testnet-api.multiversx.com',
        explorerUrl: 'https://testnet-explorer.multiversx.com',
        walletAddress: 'https://testnet-wallet.multiversx.com',
        chainId: 'T',
        egldLabel: 'xEGLD',
    },
};

// ---- Current Network ----
export const CURRENT_NETWORK: NetworkType = (process.env.NEXT_PUBLIC_NETWORK as NetworkType) || 'mainnet';
export const NETWORK_CONFIG = NETWORK_CONFIGS[CURRENT_NETWORK];

// ---- API Endpoints ----
export const API_ENDPOINTS = {
    // MultiversX API
    accounts: (address: string) => `${NETWORK_CONFIG.apiUrl}/accounts/${address}`,
    accountNfts: (address: string) => `${NETWORK_CONFIG.apiUrl}/accounts/${address}/nfts`,
    accountTokens: (address: string) => `${NETWORK_CONFIG.apiUrl}/accounts/${address}/tokens`,
    collections: (collection: string) => `${NETWORK_CONFIG.apiUrl}/collections/${collection}`,
    nft: (identifier: string) => `${NETWORK_CONFIG.apiUrl}/nfts/${identifier}`,

    // OOX API (Marketplace)
    ooxApi: 'https://api.oox.art',
    ooxListings: 'https://api.oox.art/listings',
    ooxCollection: (collection: string) => `https://api.oox.art/collections/${collection}`,
};

// ---- Smart Contract Addresses ----
export const CONTRACT_ADDRESSES = {
    subscription: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT || '',
    baconPass: process.env.NEXT_PUBLIC_BACON_PASS_COLLECTION || 'BACONPASS-xxxx',
};

// ---- App Constants ----
export const APP_CONFIG = {
    name: 'Bacon Wallet',
    tagline: 'Your portfolio is looking crispy today',
    version: '0.1.0',

    // Free tier limits
    freeTierMaxFolders: 3,

    // Subscription prices (in EGLD)
    subscriptionPrices: {
        monthly: '0.5',
        annual: '5',
    },

    // Pagination
    nftsPerPage: 50,

    // Cache TTL (in milliseconds)
    cacheTTL: {
        nfts: 5 * 60 * 1000,        // 5 minutes
        balance: 30 * 1000,          // 30 seconds
        collections: 10 * 60 * 1000, // 10 minutes
    },
};

// ---- Local Storage Keys ----
export const STORAGE_KEYS = {
    folders: 'bacon_folders',
    settings: 'bacon_settings',
    recentAddresses: 'bacon_recent_addresses',
    lastConnectedWallet: 'bacon_last_wallet',
};

// ---- Wallet Provider IDs ----
export const WALLET_PROVIDERS = {
    xPortal: 'xportal',
    defiWallet: 'defi',
    webWallet: 'web',
    ledger: 'ledger',
    extension: 'extension',
} as const;

// ---- Default Theme Colors (for programmatic access) ----
export const THEME_COLORS = {
    bgPrimary: '#0D0B0A',
    bgSecondary: '#1A1614',
    bgTertiary: '#252120',
    red: '#9B2226',
    orange: '#D9480F',
    gold: '#E9C46A',
    brown: '#BC6C25',
    textPrimary: '#F5F5F5',
    textSecondary: '#A8A29E',
};

// ---- Animation Durations ----
export const ANIMATION = {
    fast: 150,
    base: 250,
    slow: 400,
};

// ---- Breakpoints (match CSS) ----
export const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
};
