import { Exchange } from '@kyber/schema';

export interface EarnPosition {
  chain: {
    name: string;
    logo: string;
    id: number;
  };
  tokenId: number;
  tokenAddress: string;
  positionId: string;
  wallet: string;
  liquidity: string;
  status: PositionStatus;
  stats: PositionStats;
  currentAmounts: TokenAmount[];
  providedAmounts: TokenAmount[];
  pool: PositionPool;
  suggestionPool: SuggestedPool | null;
  valueInUSD: number;
  createdAtTime: number;
  lastUpdatedAt: number;
  createdAtBlock: number;
  latestBlock: number;
  extra: {
    priceRange: {
      min: number;
      maxPrice: number;
    };
  };
  id: number;
}

export interface PositionStats {
  apr: {
    all: TimeIntervalValues;
    reward: {
      lm: TimeIntervalValues;
      eg: TimeIntervalValues;
    };
    lp: TimeIntervalValues;
  };
  earning: {
    totalUsd: TimeIntervalValues;
    fee: {
      unclaimed: TokenAmount[];
      claimed: TokenAmount[];
    };
    reward: any | null;
  };
}

export interface TimeIntervalValues {
  '24h': number;
  '7d': number;
  '30d': number;
}

export interface TokenAmount {
  amount: {
    usdValue: number;
    priceUsd: number;
    amount: string;
  };
  token: {
    logo: string;
    symbol: string;
    name: string;
    decimals: number;
    address: string;
  };
}

export enum PositionStatus {
  IN_RANGE = 'PositionStatusInRange',
  OUT_RANGE = 'PositionStatusOutRange',
  CLOSED = 'PositionStatusClosed',
}

interface PositionPool {
  id: string;
  address: string;
  price: number;
  tokenAmounts: TokenAmount[];
  fees: number[];
  programs: string[];
  tickSpacing: number;
  protocol: {
    type: Exchange;
    logo: string;
    name: string;
  };
  category: string;
  hooks: string;
  merklOpportunity?: any;
}

interface SuggestedPool {
  address: string;
  feeTier: number;
  exchange: Exchange;
  token0: {
    address: string;
    decimals: number;
  };
  token1: {
    address: string;
    decimals: number;
  };
}
