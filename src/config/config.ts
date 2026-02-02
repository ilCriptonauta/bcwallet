/* =====================================================
   🥓 BACON WALLET - Configuration
   Network and DApp settings
   ===================================================== */

// Read from environment, default to mainnet
export const NETWORK_ENV = process.env.NEXT_PUBLIC_NETWORK || 'mainnet';

export const DEMO_ADDRESS = 'erd1knr6ha4xat3juryp47x3duj4lykjhlxqhdu67vtj4ey9apy6aa5sg0hlem';

// Network-specific configurations
const NETWORK_SETTINGS = {
    mainnet: {
        id: '1',
        name: 'Mainnet',
        egldLabel: 'EGLD',
        walletAddress: 'https://wallet.multiversx.com',
        apiAddress: 'https://api.multiversx.com',
        gatewayAddress: 'https://gateway.multiversx.com',
        explorerAddress: 'https://explorer.multiversx.com',
    },
    devnet: {
        id: 'D',
        name: 'Devnet',
        egldLabel: 'xEGLD',
        walletAddress: 'https://devnet-wallet.multiversx.com',
        apiAddress: 'https://devnet-api.multiversx.com',
        gatewayAddress: 'https://devnet-gateway.multiversx.com',
        explorerAddress: 'https://devnet-explorer.multiversx.com',
    },
    testnet: {
        id: 'T',
        name: 'Testnet',
        egldLabel: 'xEGLD',
        walletAddress: 'https://testnet-wallet.multiversx.com',
        apiAddress: 'https://testnet-api.multiversx.com',
        gatewayAddress: 'https://testnet-gateway.multiversx.com',
        explorerAddress: 'https://testnet-explorer.multiversx.com',
    },
};

const networkConfig = NETWORK_SETTINGS[NETWORK_ENV as keyof typeof NETWORK_SETTINGS] || NETWORK_SETTINGS.mainnet;

export const CONFIG = {
    chainType: NETWORK_ENV,
    project: {
        name: 'Bacon Wallet',
        id: 'bacon-wallet',
    },
    network: networkConfig,
    walletConnect: {
        projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || '9b1a9564f91cb659ffe21b73d5c4e2d8',
        relayUrl: 'wss://relay.walletconnect.com',
    },
};
