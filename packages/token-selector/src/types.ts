import { ChainId, Exchange, Token } from "@kyber/schema";

// Token selector variants for different use cases
export type TokenSelectorVariant = "default" | "smart-exit";

// Token selection modes
export enum TOKEN_SELECT_MODE {
  SELECT = "SELECT", // Single token replacement
  ADD = "ADD", // Multi-token selection (up to MAX_TOKENS)
}

// Maximum number of tokens that can be selected in ADD mode
export const MAX_TOKENS = 5;

// ============================================================================
// Grouped Props Interfaces
// ============================================================================

/**
 * Wallet-related options for the token selector
 */
export interface WalletOptions {
  /** User's wallet address */
  account?: string;
  /** Callback to open wallet connection modal */
  onConnectWallet?: () => void;
}

/**
 * Token selection options (for token tab functionality)
 */
export interface TokenOptions {
  /** Currently selected tokens (for multi-token mode) */
  tokensIn?: Token[];
  /** Comma-separated amounts corresponding to tokensIn */
  amountsIn?: string;
  /** Callback to update selected tokens */
  setTokensIn?: (tokens: Token[]) => void;
  /** Callback to update amounts */
  setAmountsIn?: (amounts: string) => void;
  /** Callback when a single token is selected (simple mode) */
  onTokenSelect?: (token: Token) => void;
  /** Selection mode - SELECT for single token, ADD for multi-token */
  mode?: TOKEN_SELECT_MODE;
  /** Address of currently selected token (for highlighting) */
  selectedTokenAddress?: string;
  /** Pool token 0 address (for highlighting pool tokens) */
  token0Address?: string;
  /** Pool token 1 address (for highlighting pool tokens) */
  token1Address?: string;
  /** External token balances (optional - if not provided, will fetch internally) */
  tokenBalances?: { [key: string]: bigint };
}

/**
 * Position/liquidity source options (for positions tab functionality)
 */
export interface PositionOptions {
  /** Show the positions tab */
  showUserPositions?: boolean;
  /** Only show positions tab (hide tokens tab) */
  positionsOnly?: boolean;
  /** Position IDs to exclude from the list */
  excludePositionIds?: string[];
  /** Only show positions from these exchanges */
  filterExchanges?: Exchange[];
  /** Only show positions from these chains */
  filterChains?: number[];
  /** Current position ID (for excluding from list) */
  positionId?: string;
  /** Current pool address */
  poolAddress?: string;
  /** Initial slippage value passed to position selection callback */
  initialSlippage?: number;
  /** Callback when a position is selected as liquidity source */
  onSelectLiquiditySource?: OnSelectLiquiditySource;
  /** Variant affecting UI text and sorting behavior */
  variant?: TokenSelectorVariant;
}

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
  earnPosition?: EarnPosition,
) => void;

// ============================================================================
// Main TokenSelectorModal Props
// ============================================================================

/**
 * Main TokenSelectorModal props
 * Props are organized into logical groups for better readability
 *
 * @example
 * ```tsx
 * <TokenSelectorModal
 *   onClose={handleClose}
 *   chainId={1}
 *   wallet={{ account, onConnectWallet }}
 *   tokenOptions={{ tokensIn, amountsIn, setTokensIn, setAmountsIn }}
 *   positionOptions={{ showUserPositions: true, filterExchanges, filterChains }}
 * />
 * ```
 */
export interface TokenSelectorModalProps {
  /** Required: callback to close the modal */
  onClose: () => void;
  /** Chain ID (optional - when not provided, shows positions from all supported chains) */
  chainId?: ChainId;
  /** Custom modal title */
  title?: string;
  /** Wallet connection options */
  wallet?: WalletOptions;
  /** Token selection options */
  tokenOptions?: TokenOptions;
  /** Position/liquidity source options */
  positionOptions?: PositionOptions;
}

// Internal token with additional UI state
export interface CustomizeToken extends Token {
  balance: string;
  selected: number;
  inPair: number;
  disabled: boolean;
}
