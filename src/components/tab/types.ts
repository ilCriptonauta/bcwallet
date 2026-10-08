export type ViewMode = 'Collectibles' | 'Management';
export type TabId = 'Overview' | 'SFTs' | 'Collections' | string;

export const OOX_CONTRACT_ADDRESS = "erd1qqqqqqqqqqqqqpgqwp73w2a9eyzs64eltupuz3y3hv798vlv899qrjnflg";

export const OOX_PAYMENT_TOKENS = [
  { identifier: 'EGLD', ticker: 'EGLD', decimals: 18 },
  { identifier: 'USDC-c76f1f', ticker: 'USDC', decimals: 6 },
  { identifier: 'ONX-3e51c8', ticker: 'ONX', decimals: 18 },
];

export interface SelectedItem {
  id: number;
  tab: string;
  imageUrl: string;
  originalImageUrl?: string | null;
  thumbnailUrl?: string | null;
  mimeType?: string;
  identifier?: string;
  collection?: string;
  name?: string;
  attributes?: { trait_type: string; value: string }[];
  description?: string;
  tags?: string[];
  floorPrice?: string;
  type?: 'NFT' | 'SFT' | 'MetaESDT';
  balance?: string;
}

export interface UserFolder {
  id: number | string;
  name: string;
  description?: string;
  itemCount: number;
  previewImages: string[];
}

export interface TabSystemProps {
  isFullVersion: boolean;
}
