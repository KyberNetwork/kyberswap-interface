import { EarnDex } from '@kyber/schema';

export enum PositionStatus {
  IN_RANGE = 'IN_RANGE',
  OUT_RANGE = 'OUT_RANGE',
}

export interface EarnPosition {
  [x: string]: any;
  chainName: 'eth';
  chainId: number;
  chainLogo: string;
  id: string;
  tokenAddress: string;
  tokenId: string;
  minPrice: number;
  maxPrice: number;
  currentAmounts: Array<PositionAmount>;
  feePending: Array<PositionAmount>;
  feesClaimed: Array<PositionAmount>;
  createdTime: number;
  apr: number;
  aprKem: number;
  currentPositionValue: number;
  earning24h: number;
  earning7d: number;
  status: PositionStatus;
  pool: {
    id: string;
    poolAddress: string;
    price: number;
    tokenAmounts: Array<PositionAmount>;
    fees: Array<number>;
    tickSpacing: number;
    project: EarnDex;
    projectLogo: string;
  };
}

interface PositionAmount {
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logo: string;
    tag: string;
    price: number;
  };
  tokenType: string;
  tokenID: string;
  balance: string;
  quotes: {
    usd: {
      symbol: string;
      marketPrice: number;
      price: number;
      priceChange24hPercentage: number;
      value: number;
      timestamp: number;
    };
  };
}
