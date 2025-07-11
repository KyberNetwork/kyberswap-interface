import { ChainId, EarnDex, Pool, PoolType, Theme, Token, ZapRouteDetail } from '@kyber/schema';

export interface WidgetProps {
  theme?: Theme;
  poolAddress: string;
  positionId?: string;
  poolType: PoolType;
  chainId: ChainId;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  initDepositTokens?: string;
  initAmounts?: string;
  source: string;
  aggregatorOptions?: {
    includedSources?: string[];
    excludedSources?: string[];
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };
  referral?: string;
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onOpenZapMigration?: (
    position: {
      exchange: string;
      poolId: string;
      positionId: string | number;
    },
    initialTick?: { tickLower: number; tickUpper: number },
  ) => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
}

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

export enum PriceType {
  PriceLower = 'PriceLower',
  PriceUpper = 'PriceUpper',
}

export interface ZapState {
  pool: Pool;
  zapInfo: ZapRouteDetail;
  tokensIn: Token[];
  amountsIn: string;
  deadline: number;
  isFullRange: boolean;
  slippage: number;
  tickLower: number;
  tickUpper: number;
}
