import { ChainId } from '@kyberswap/ks-sdk-core'

/** Order status as reported by the conditional-order service. */
export enum StopLossOrderStatus {
  OPEN = 'OrderStatusOpen',
  DONE = 'OrderStatusDone',
  CANCELLED = 'OrderStatusCancelled',
  EXPIRED = 'OrderStatusExpired',
}

/** Status of one settlement attempt. An order accumulates one entry per attempt. */
export enum StopLossExecutionStatus {
  CREATED = 'OrderExecutionStatusCreated',
  PENDING = 'OrderExecutionStatusPending',
  SUCCESS = 'OrderExecutionStatusSuccess',
  FAILED = 'OrderExecutionStatusFailed',
  NOT_MINED = 'OrderExecutionStatusNotMined',
}

/**
 * What an order row displays. The service reports only the four order statuses, so the two states a
 * user cares about mid-flight — the trigger fired, and the swap could not complete — are derived from
 * the latest execution instead. See `getStopLossDisplayStatus`.
 */
export enum StopLossDisplayStatus {
  ACTIVE = 'active',
  TRIGGERED = 'triggered',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export type StopLossCondition = {
  field: {
    type: 'oracle_price'
    value: {
      /** Trigger price as a human decimal string, tokenOut per tokenIn. Fires when the oracle is at or below it. */
      lte: string
      /** Optional lower bound, making the trigger a band. Unused by a plain stop-loss. */
      gte?: string
      /** How stale the oracle reading may be, in seconds. 0 falls back to the chain default. */
      maxStaleness?: number
    }
  }
}

export type StopLossExecutionAmount = {
  amountWei?: number
  amount?: string
  amountUsd?: string
}

export type StopLossExecution = {
  /** Settlement transaction hash. This is the one to link on a block explorer. */
  hash: string
  executionNum: number
  operatorWallet: string
  status: StopLossExecutionStatus
  extraData?: {
    amountIn?: StopLossExecutionAmount
    amountOut?: StopLossExecutionAmount
    /** tokenIn priced in tokenOut at the moment of execution. */
    oraclePrice?: string
    tokensInfo?: Array<{ address: string; priceUsd: string; decimal: number }>
  }
}

export type StopLossOrder = {
  id: number
  chainId: ChainId
  status: StopLossOrderStatus
  userWallet: string
  receiver: string
  tokenIn: string
  tokenOut: string
  /** Raw integer amount in tokenIn's own decimals. */
  amountIn: string
  /** Max slippage in basis points, 1..10000. */
  slippage: number
  condition: StopLossCondition
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
  executions?: StopLossExecution[]
}

/** The payload shared by estimate-fee, sign-message and create. Build it once and reuse it. */
export type StopLossCorePayload = {
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
  condition: StopLossCondition
}

export type StopLossFee = {
  protocol: { percentage: number; category: string }
  gas: { percentage: number; usd: number; wei: string | number }
}

export type StopLossSupportedToken = {
  address: string
  decimals: number
  source: string
  pythPriceId?: string
}

export type StopLossOraclePrice = {
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

/** Contract the user approves tokenIn to, and the EIP-712 verifying contract. */
export type StopLossConfig = {
  smartIntentAddress: string
}

export type StopLossTypedData = {
  domain: Record<string, unknown>
  types: Record<string, unknown>
  message: Record<string, unknown>
  primaryType: string
}
