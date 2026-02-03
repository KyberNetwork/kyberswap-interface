import { ChainId, Exchange, Token } from "@kyber/schema";

// Token selection modes
export enum TOKEN_SELECT_MODE {
  SELECT = "SELECT", // Single token replacement
  ADD = "ADD", // Multi-token selection (up to MAX_TOKENS)
}

// Maximum number of tokens that can be selected in ADD mode
export const MAX_TOKENS = 5;

// Position-related types for UserPositions feature
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
    reward: unknown | null;
  };
}

export interface TimeIntervalValues {
  "24h": number;
  "7d": number;
  "30d": number;
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
  IN_RANGE = "PositionStatusInRange",
  OUT_RANGE = "PositionStatusOutRange",
  CLOSED = "PositionStatusClosed",
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
  merklOpportunity?: unknown;
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

// Liquidity source selection callback type (for selecting an existing position as liquidity source)
export type OnSelectLiquiditySource = (
  position: { exchange: string; poolId: string; positionId: string | number },
  initialSlippage?: number,
) => void;

// Main TokenSelectorModal props
export interface TokenSelectorModalProps {
  // Required props
  chainId: ChainId;
  onClose: () => void;

  // Token selection (for multi-token mode)
  tokensIn?: Token[];
  amountsIn?: string;
  setTokensIn?: (tokens: Token[]) => void;
  setAmountsIn?: (amounts: string) => void;

  // Single token selection callback (for simple mode)
  onTokenSelect?: (token: Token) => void;

  // Selection mode configuration
  mode?: TOKEN_SELECT_MODE;
  selectedTokenAddress?: string;

  // Pool context (for highlighting pool tokens)
  token0Address?: string;
  token1Address?: string;

  // User position features (optional)
  showUserPositions?: boolean;
  positionId?: string;
  poolAddress?: string;
  initialSlippage?: number;
  onSelectLiquiditySource?: OnSelectLiquiditySource;

  // Wallet connection
  account?: string;
  onConnectWallet?: () => void;

  // Customization
  title?: string;

  // Token balances (optional - if not provided, will fetch internally)
  tokenBalances?: { [key: string]: bigint };
}

// Internal token with additional UI state
export interface CustomizeToken extends Token {
  balance: string;
  selected: number;
  inPair: number;
  disabled: boolean;
}
