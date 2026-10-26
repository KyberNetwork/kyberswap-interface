import { ChainId } from '@kyberswap/ks-sdk-core'

/** Order status as reported by the conditional-order service. */
export enum StopMarketStatus {
  OPEN = 'OrderStatusOpen',
  DONE = 'OrderStatusDone',
  CANCELLED = 'OrderStatusCancelled',
  EXPIRED = 'OrderStatusExpired',
}

/** Status of one settlement attempt. An order accumulates one entry per attempt. */
export enum StopMarketExecutionStatus {
  CREATED = 'OrderExecutionStatusCreated',
  PENDING = 'OrderExecutionStatusPending',
  SUCCESS = 'OrderExecutionStatusSuccess',
  FAILED = 'OrderExecutionStatusFailed',
  NOT_MINED = 'OrderExecutionStatusNotMined',
}

/**
 * What an order row displays. The service reports only the four order statuses, so the state a user
 * cares about mid-flight — the trigger fired and the swap is on its way — is derived from the latest
 * execution instead. See `getStopMarketDisplayStatus`.
 */
export enum StopMarketDisplayStatus {
  ACTIVE = 'active',
  TRIGGERED = 'triggered',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export type StopMarketCondition = {
  field: {
    type: 'oracle_price'
    value: {
      /** Trigger price as a human decimal string, tokenOut per tokenIn. Fires when the oracle is at or below it. */
      lte: string
      /** Optional lower bound, making the trigger a band. Unused by a plain stop market order. */
      gte?: string
      /** How stale the oracle reading may be, in seconds. 0 falls back to the chain default. */
      maxStaleness?: number
    }
  }
}

/**
 * One side of a settlement. `amount` is in the token's human units; `amountWei` is the same figure as a
 * JSON number, which cannot hold an 18-decimal amount exactly, so it is never read.
 */
export type StopMarketExecutionAmount = {
  amountWei?: number
  amount?: string
  amountUsd?: string
}

/**
 * Something the service wants the user to know about an order it still holds, such as a price feed it
 * can no longer evaluate the trigger against. `message` is written for the user as is.
 */
export type StopMarketWarning = {
  orderId: number
  tokenIn: string
  tokenOut: string
  code: string
  message: string
  canCancel: boolean
}

/** A token's identity as the order carries it, enough to format its amounts without a lookup. */
export type StopMarketTokenInfo = {
  address: string
  symbol: string
  decimals: number
  logoURL?: string | null
}

/**
 * The oracle's reading of an open order at the time the list was served: both legs in USD, what the
 * sell amount is worth and what it would receive at that price. Absent once the order is closed.
 */
export type StopMarketOracleEstimate = {
  source: string
  /** Unix seconds. */
  updatedAt: number
  tokenInPriceUsd: string
  tokenOutPriceUsd: string
  amountInUsd: string
  /** Raw integer in tokenOut's own decimals. */
  expectedAmountOut: string
  expectedAmountOutHuman: string
  expectedAmountOutUsd: string
}

/**
 * One entry of an order's history as the service records it: an attempt it declined or that reverted,
 * or a status change. `detail` depends on `type`; a type this app does not know arrives with no detail.
 */
export type StopMarketLog = {
  id: number
  type: string
  /** Unix seconds. */
  createdAt: number
  detail?: { error?: string; reason?: string; message?: string } | null
}

export type StopMarketExecution = {
  /** Settlement transaction hash. This is the one to link on a block explorer. */
  hash: string
  executionNum: number
  operatorWallet: string
  status: StopMarketExecutionStatus
  /** Unix seconds: when the transaction was submitted. */
  createdAt?: number
  extraData?: {
    /** The decoded revert reason of a failed attempt, when the chain gave one. */
    error?: string
    amountIn?: StopMarketExecutionAmount
    amountOut?: StopMarketExecutionAmount
    /** The service's fee, taken out of `amountOut`. */
    fee?: StopMarketExecutionAmount
    /** `amountOut` less `fee`: what the receiver actually got. */
    received?: StopMarketExecutionAmount
    /** tokenIn priced in tokenOut at the moment of execution. */
    oraclePrice?: string
    tokensInfo?: Array<{ address: string; priceUsd: string; decimal: number }>
  }
}

export type StopMarket = {
  id: number
  chainId: ChainId
  status: StopMarketStatus
  userWallet: string
  receiver: string
  tokenIn: string
  tokenOut: string
  /** Raw integer amount in tokenIn's own decimals. */
  amountIn: string
  /** `amountIn` in tokenIn's human units. */
  amountInHuman?: string
  tokenInInfo: StopMarketTokenInfo
  tokenOutInfo: StopMarketTokenInfo
  /** Max slippage in basis points, 1..10000. */
  slippage: number
  condition: StopMarketCondition
  /** Unix seconds. */
  deadline: number
  /** Intent hash — the order's identity, not a transaction hash. */
  hash: string
  signature: string
  protocolFeePercentage: number
  category: string
  maxFeesPercentage: number[]
  maxGasPercentage: number
  source: string
  /** Unix seconds. */
  createdAt: number
  executions?: StopMarketExecution[]
  /** What happened to the order between executions, newest first. */
  logs?: StopMarketLog[]
  oracleEstimate?: StopMarketOracleEstimate | null
  warnings?: StopMarketWarning[]
}

/** The payload shared by estimate-fee, sign-message and create. Build it once and reuse it. */
export type StopMarketCorePayload = {
  chainId: number
  userWallet: string
  receiver?: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  slippage: number
  deadline: number
  /** The BE doc requires each entry to be at least the protocol percentage returned by estimate-fee. */
  maxFeesPercentage: number[]
  maxGasPercentage: number
  permitData?: string
  feeAddress?: string
  source?: string
  condition: StopMarketCondition
}

export type StopMarketFee = {
  /**
   * `percentage` is the share of the order the protocol fee takes at this size, the minimum fee included;
   * `tierPercentage` is the pair's published rate, which it exceeds once the minimum applies.
   */
  protocol: { percentage: number; category: string; tierPercentage?: number }
  gas: { percentage: number; usd: number; wei: string | number }
  protocolFeeUsd?: number
  /** The fee is the flat minimum rather than the percentage, so its share grows as the order shrinks. */
  minProtocolFeeApplied?: boolean
  /** The flat minimum as a raw integer in the chain's native coin. */
  minProtocolFeeNative?: string
  minProtocolFeeUsd?: number
}

export type StopMarketOraclePrice = {
  chainId: ChainId
  base: string
  quote: string
  /**
   * Quote per base at human scale, as a decimal string carrying far more precision than a double can
   * hold — keep it a string for anything that feeds an amount.
   */
  price: string
  /** The oracle's own publish time in unix seconds, not when the request was served. */
  updatedAt: number
  source: string
}

/** The oracle a chain evaluates triggers against, which differs from chain to chain. */
export type StopMarketOracleConfig = {
  chainId: ChainId
  /** e.g. `CHAINLINK`, `PYTH`. */
  oracle: string
  /** The token-list query param that keeps only tokens this oracle prices, e.g. `hasPythOracle`. */
  tokenFilter: string
}

/** The tokens a chain's oracle prices, lowercased, with the token-list filter that found them. */
export type StopMarketOracleTokens = {
  /** e.g. `hasChainlinkOracle`, `hasPythOracle` — the param a server-side token search narrows by. */
  tokenFilter: string
  addresses: string[]
}

/** Contract the user approves tokenIn to, and the EIP-712 verifying contract. */
export type StopMarketConfig = {
  smartIntentAddress: string
}

export type StopMarketTypedData = {
  domain: Record<string, unknown>
  types: Record<string, unknown>
  message: Record<string, unknown>
  primaryType: string
}
