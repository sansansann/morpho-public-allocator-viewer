export interface Asset {
  address: string;
  symbol: string;
  decimals: number;
}

export interface MarketState {
  supplyAssets: string;
  supplyAssetsUsd: number | null;
  borrowAssets: string;
  borrowAssetsUsd: number | null;
  liquidityAssets: string;
  liquidityAssetsUsd: number | null;
}

export interface Market {
  uniqueKey: string;
  loanAsset: Asset;
  collateralAsset: Asset | null;
  lltv: string;
  oracleAddress?: string;
  irmAddress?: string;
  state?: MarketState;
}

export interface Allocation {
  market: Market;
  supplyAssets: string;
  supplyAssetsUsd: number | null;
  supplyCap: string;
}

export interface FlowCap {
  market: Market;
  maxIn: string;
  maxOut: string;
}

export interface PublicAllocatorConfig {
  fee: string;
  flowCaps: FlowCap[];
}

export interface VaultState {
  totalAssets: string;
  totalAssetsUsd: number | null;
  allocation: Allocation[];
}

export interface VaultData {
  address: string;
  name: string;
  symbol: string;
  asset: Asset;
  state: VaultState;
  publicAllocatorConfig: PublicAllocatorConfig | null;
}

export interface ReallocationItem {
  timestamp: number;
  assets: string;
  type: string;
  vault: { address: string };
  market: {
    uniqueKey: string;
    loanAsset: { symbol: string };
    collateralAsset: { symbol: string } | null;
  };
}

export interface ChainConfig {
  id: number;
  name: string;
  explorerUrl: string;
  publicAllocatorAddress: string;
}

export type SortField = 'maxIn' | 'maxOut' | 'liquidity';
export type SortDirection = 'asc' | 'desc';
