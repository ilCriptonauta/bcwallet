/* =====================================================
   🥓 BACON WALLET - Type Definitions
   ===================================================== */

// Re-export folder types
export * from './folders';


// ---- Wallet Types ----
export interface WalletInfo {
  address: string;
  herotag?: string;
  balance: string;
  shard: number;
  isPremium: boolean;
  premiumExpiry?: number;
  hasBaconPass?: boolean;
}

// ---- NFT Types ----
export interface NFT {
  identifier: string;
  collection: string;
  name: string;
  nonce: number;
  type: 'NonFungibleESDT' | 'SemiFungibleESDT' | 'MetaESDT';
  creator: string;
  royalties: number;
  url: string;
  thumbnailUrl: string;
  media?: NFTMedia[];
  metadata?: NFTMetadata;
  attributes?: string;
  tags?: string[];
  isWhitelisted?: boolean;
  rank?: number;
  rarityScore?: number;
  price?: string;
  ticker: string;
}

export interface NFTMedia {
  url: string;
  originalUrl: string;
  thumbnailUrl: string;
  fileType: string;
  fileSize: number;
}

export interface NFTMetadata {
  description?: string;
  attributes?: NFTAttribute[];
  rarity?: {
    rank: number;
    score: number;
  };
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  rarity?: number;
}

// ---- Collection Types ----
export interface NFTCollection {
  collection: string;
  name: string;
  description?: string;
  owner: string;
  ticker: string;
  timestamp: number;
  canFreeze: boolean;
  canWipe: boolean;
  canPause: boolean;
  canTransferNFTCreateRole: boolean;
  type: 'NonFungibleESDT' | 'SemiFungibleESDT' | 'MetaESDT';
  assets?: {
    website?: string;
    description?: string;
    social?: {
      twitter?: string;
      telegram?: string;
      discord?: string;
    };
    pngUrl?: string;
    svgUrl?: string;
  };
}

// ---- Folder Types (The "Trays") ----
export type FolderType = 'classic' | 'manual' | 'smart' | 'burn';

export interface Folder {
  id: string;
  name: string;
  type: FolderType;
  icon?: string;
  color?: string;
  nftIds: string[];
  createdAt: number;
  updatedAt: number;
  rules?: SmartFolderRule[];
  isExpanded?: boolean;
}

export interface SmartFolderRule {
  id: string;
  field: 'rarity' | 'price' | 'trait' | 'collection' | 'rank';
  operator: 'gt' | 'lt' | 'eq' | 'contains';
  value: string | number;
}

// ---- Subscription Types ----
export interface Subscription {
  isActive: boolean;
  type: 'free' | 'monthly' | 'annual' | 'pass';
  expiresAt?: number;
  passTokenId?: string;
}

export type SubscriptionPeriod = 'monthly' | 'annual';

// ---- OOX Integration Types ----
export interface OOXListing {
  nftIdentifier: string;
  price: string;
  paymentToken: string;
  seller: string;
  createdAt: number;
  expiresAt?: number;
  auctionType?: 'fixed' | 'auction';
  highestBid?: string;
}

export interface ListOnOOXParams {
  nftIdentifier: string;
  price: string;
  paymentToken?: string;
  auctionType?: 'fixed' | 'auction';
  duration?: number;
}

// ---- Transaction Types ----
export interface TransactionStatus {
  txHash: string;
  status: 'pending' | 'success' | 'fail';
  timestamp?: number;
}

// ---- API Response Types ----
export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  hasMore: boolean;
}

// ---- UI State Types ----
export interface ModalState {
  isOpen: boolean;
  type?: 'send' | 'list' | 'folder' | 'subscription' | 'nft-detail';
  data?: unknown;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// ---- Filter & Sort Types ----
export interface NFTFilters {
  collection?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  traits?: Record<string, string[]>;
  sortBy?: 'name' | 'rank' | 'price' | 'recent';
  sortOrder?: 'asc' | 'desc';
}

// ---- Settings Types ----
export interface UserSettings {
  theme: 'dark'; // Bacon is always crispy dark
  currency: 'EGLD' | 'USD' | 'EUR';
  hideSmallBalances: boolean;
  enableNotifications: boolean;
  autoDetectSpam: boolean;
}

// ---- MultiversX Network Types ----
export type NetworkType = 'mainnet' | 'devnet' | 'testnet';

export interface NetworkConfig {
  name: string;
  apiUrl: string;
  explorerUrl: string;
  walletAddress: string;
  chainId: string;
  egldLabel: string;
}
