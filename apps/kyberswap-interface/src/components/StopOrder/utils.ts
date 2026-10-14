import { ChainId, Currency } from '@kyberswap/ks-sdk-core'

import {
  StopOrder,
  StopOrderCorePayload,
  StopOrderDisplayStatus,
  StopOrderExecution,
  StopOrderExecutionStatus,
  StopOrderStatus,
  StopOrderTokenInfo,
  StopOrderTypedData,
  StopOrderWarning,
} from 'components/StopOrder/types'
import { isSupportedChainId } from 'constants/networks'
import { tryParseAmount } from 'state/swap/hooks'
import { isAddress } from 'utils/address'
import { formatDisplayNumber } from 'utils/numbers'

/** The service rejects any deadline past 2100-01-01, so an "expires never" choice lands here instead. */
export const MAX_STOP_ORDER_DEADLINE = 4102444800

export const clampStopOrderDeadline = (deadlineInSeconds: number) =>
  Math.min(Math.floor(deadlineInSeconds), MAX_STOP_ORDER_DEADLINE)

/**
 * The service emits `"salt": ""` on the EIP-712 domain, which strict signers reject because they
 * expect bytes32. `salt` is absent from the EIP712Domain type list, so dropping it leaves the digest
 * unchanged.
 */
export const stripEmptyEip712Salt = (typedData: StopOrderTypedData): StopOrderTypedData => {
  const { salt, ...domain } = typedData.domain as { salt?: unknown }
  return salt === '' || salt === undefined ? { ...typedData, domain } : typedData
}

/**
 * The current attempt. Picked by the highest `executionNum` rather than array position, so it does
 * not rest on an ordering the service has never promised.
 */
export const getLatestExecution = (order: StopOrder): StopOrderExecution | undefined =>
  order.executions?.length
    ? order.executions.reduce((latest, e) => (e.executionNum > latest.executionNum ? e : latest))
    : undefined

const IN_FLIGHT_EXECUTION_STATUSES = [StopOrderExecutionStatus.CREATED, StopOrderExecutionStatus.PENDING]

/**
 * Collapses the order status and its latest settlement attempt into the single state a row shows.
 * An order stays `Open` while a settlement is in flight, so that case is only visible through the
 * executions. A failed attempt leaves the order Active: the service keeps trying it while it is `Open`
 * (a wallet short of tokenIn fills once topped up), so it must stay cancellable.
 */
export const getStopOrderDisplayStatus = (order: StopOrder): StopOrderDisplayStatus => {
  switch (order.status) {
    case StopOrderStatus.DONE:
      return StopOrderDisplayStatus.EXECUTED
    case StopOrderStatus.CANCELLED:
      return StopOrderDisplayStatus.CANCELLED
    case StopOrderStatus.EXPIRED:
      return StopOrderDisplayStatus.EXPIRED
    default: {
      const execution = getLatestExecution(order)
      if (!execution) return StopOrderDisplayStatus.ACTIVE
      if (IN_FLIGHT_EXECUTION_STATUSES.includes(execution.status)) return StopOrderDisplayStatus.TRIGGERED
      return StopOrderDisplayStatus.ACTIVE
    }
  }
}

const ACTIVE_DISPLAY_STATUSES = [StopOrderDisplayStatus.ACTIVE, StopOrderDisplayStatus.TRIGGERED]

/** Which table an order belongs in: everything still `Open` to the service, settling or not. */
export const isActiveStopOrderStatus = (status: StopOrderDisplayStatus) => ACTIVE_DISPLAY_STATUSES.includes(status)

export type TriggerProximity = 'far' | 'near' | 'imminent'

/**
 * How close a trigger is to firing, from its signed distance to the market in percent — the colour the
 * order list and the form give that distance. Judged on the distance rounded to one decimal, as it is
 * shown, so a distance that reads "10.0%" is never treated as still under 10. A trigger at or above the
 * market is imminent no matter how far past it has gone.
 */
export const getTriggerProximity = (percent: number): TriggerProximity => {
  if (percent >= 0) return 'imminent'
  const magnitude = Math.round(Math.abs(percent) * 10) / 10
  return magnitude >= 10 ? 'far' : magnitude >= 5 ? 'near' : 'imminent'
}

/**
 * A percent distance between two prices as shown, without its sign — the one notation the stop order
 * UI uses for a trigger's distance to the market (list, form, confirm modal) and a fill's gap to its
 * trigger. Rounded to `fractionDigits` and always printed with them, so the list's column lines up;
 * formatDisplayNumber would drop trailing zeros and truncate rather than round. A distance too small to
 * survive that rounding keeps its first significant digit instead (0.003, 0.0₄9), so a price merely
 * close to another never reads as exactly at it.
 */
export const formatDistanceMagnitude = (percent: number, fractionDigits = 1) => {
  const magnitude = Math.abs(percent)
  const scale = 10 ** fractionDigits
  const rounded = Math.round(magnitude * scale) / scale
  if (rounded === 0 && magnitude > 0) return formatDisplayNumber(magnitude, { fractionDigits: 1 })
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/** Trigger price as a human decimal string, tokenOut per tokenIn. */
export const getStopOrderTriggerPrice = (order: StopOrder) => order.condition?.field?.value?.lte ?? ''

/** The settlement transaction, available once an attempt reached the chain. */
export const getStopOrderExecutionTxHash = (order: StopOrder) => getLatestExecution(order)?.hash

/**
 * The card inputs that reproduce a past order.
 *
 * Expiry is carried as the original *duration*, not the original deadline: the deadline is a fixed
 * point in time, so an expired order would clone to one already past its deadline, and any other
 * closed order to a shorter window than the user originally chose.
 */
export const getStopOrderRecreateDraft = (
  order: StopOrder,
  defaultExpire: number,
): { triggerPrice: string; slippage: number | undefined; expire: number } => {
  const duration = order.deadline - order.createdAt
  return {
    triggerPrice: getStopOrderTriggerPrice(order),
    // Without a usable figure the form falls back to the pair's suggested slippage.
    slippage: Number.isFinite(order.slippage) && order.slippage > 0 ? order.slippage : undefined,
    expire: Number.isFinite(duration) && duration > 0 ? duration : defaultExpire,
  }
}

export type BuildStopOrderPayloadParams = {
  chainId: number
  account: string
  currencyIn: Currency
  currencyOut: Currency
  /** Human amount as typed on the form. */
  inputAmount: string
  /** Trigger price as a human decimal string, tokenOut per tokenIn. */
  triggerPrice: string
  /** Basis points. */
  slippage: number
  /** Milliseconds, as the expiry control produces it. */
  expiredAt: number
  maxFeesPercentage: number[]
  maxGasPercentage: number
  source?: string
}

/** The payload shared by estimate-fee, sign-message and create. */
export const buildStopOrderPayload = ({
  chainId,
  account,
  currencyIn,
  currencyOut,
  inputAmount,
  triggerPrice,
  slippage,
  expiredAt,
  maxFeesPercentage,
  maxGasPercentage,
  source,
}: BuildStopOrderPayloadParams): StopOrderCorePayload => ({
  chainId,
  userWallet: account,
  // Native currency is wrapped before settlement, so the order always sells the wrapped token.
  tokenIn: currencyIn.wrapped.address,
  tokenOut: currencyOut.wrapped.address,
  amountIn: tryParseAmount(inputAmount, currencyIn.wrapped)?.quotient?.toString() ?? '0',
  slippage,
  deadline: clampStopOrderDeadline(expiredAt / 1000),
  maxFeesPercentage,
  maxGasPercentage,
  ...(source ? { source } : {}),
  condition: {
    field: {
      // `maxStaleness` is left out so each feed applies its own default. The value is signed into the
      // intent, so a window a feed cannot meet would be unfixable without cancelling and re-signing;
      // which windows each feed can meet is not something this app knows.
      type: 'oracle_price',
      value: { lte: triggerPrice },
    },
  },
})

/**
 * Reads one side of an execution's settled amount, in the token's human units — the form both sides
 * report `amount` in.
 */
const resolveExecutionAmount = (
  execution: StopOrderExecution | undefined,
  side: 'amountIn' | 'amountOut',
): number | undefined => {
  const value = execution?.extraData?.[side]?.amount
  if (!value || !/^\d+(\.\d+)?$/.test(value)) return undefined
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : undefined
}

/** What one execution received, in tokenOut's human units. */
export const resolveExecutionAmountOut = (execution: StopOrderExecution | undefined) =>
  resolveExecutionAmount(execution, 'amountOut')

/** What one execution sold, in tokenIn's human units. */
export const resolveExecutionAmountIn = (execution: StopOrderExecution | undefined) =>
  resolveExecutionAmount(execution, 'amountIn')

/** One settlement that went through. Amounts are in human units; any the execution does not report are unset. */
export type StopOrderFill = {
  hash: string
  amountIn?: number
  amountOut?: number
  /** tokenIn priced in tokenOut by the oracle when this fill settled. */
  price?: number
}

/**
 * Every settlement of the order that went through, oldest first. A stop order settles in one today, but
 * an order keeps a list of executions, so nothing that shows them assumes there is only one.
 */
export const getStopOrderFills = (order: StopOrder): StopOrderFill[] =>
  (order.executions ?? [])
    .filter(execution => execution.status === StopOrderExecutionStatus.SUCCESS)
    .sort((a, b) => a.executionNum - b.executionNum)
    .map(execution => {
      const price = Number(execution.extraData?.oraclePrice)
      return {
        hash: execution.hash,
        amountIn: resolveExecutionAmountIn(execution),
        amountOut: resolveExecutionAmountOut(execution),
        price: Number.isFinite(price) && price > 0 ? price : undefined,
      }
    })

export type StopOrderFillSummary = { amountIn?: number; amountOut?: number; price?: number }

/** The total, or nothing when any part is unknown — a partial sum would understate the order. */
const sumIfComplete = (values: Array<number | undefined>) => {
  let total = 0
  for (const value of values) {
    if (value === undefined) return undefined
    total += value
  }
  return total
}

/**
 * The fills taken together. `orderAmountIn` is for a caller that knows the whole order went, as it
 * does once executed: the order's own amount is exact, where each execution reports its share in an
 * ambiguous format. The price weighs each fill's price by what it sold, and falls back to a plain mean
 * when the sizes are not all known.
 */
export const summarizeStopOrderFills = (fills: StopOrderFill[], orderAmountIn?: number): StopOrderFillSummary => {
  if (!fills.length) return {}

  const amountIn = orderAmountIn ?? sumIfComplete(fills.map(fill => fill.amountIn))
  const amountOut = sumIfComplete(fills.map(fill => fill.amountOut))

  let price: number | undefined
  if (fills.every(fill => fill.price !== undefined)) {
    const sizes = fills.map(fill => fill.amountIn)
    const totalSize = sumIfComplete(sizes)
    price =
      totalSize && sizes.every(size => size !== undefined && size > 0)
        ? fills.reduce((total, fill) => total + (fill.price ?? 0) * (fill.amountIn ?? 0), 0) / totalSize
        : fills.reduce((total, fill) => total + (fill.price ?? 0), 0) / fills.length
  }

  return { amountIn, amountOut, price }
}

const isRawAmount = (value: unknown): value is string => typeof value === 'string' && /^\d+$/.test(value)

const isTokenInfo = (chainId: ChainId, value: unknown): value is StopOrderTokenInfo => {
  if (!value || typeof value !== 'object') return false
  const info = value as Record<string, unknown>
  return (
    !!isAddress(chainId, info.address) &&
    typeof info.symbol === 'string' &&
    Number.isInteger(info.decimals) &&
    (info.decimals as number) >= 0
  )
}

const toPositiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value)
  return typeof value === 'string' && value !== '' && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export type StopOrderFundingShortfall = 'balance' | 'allowance'

/**
 * Which of the wallet's holdings no longer covers an open order's amount. A stop order locks nothing:
 * the sell token stays in the wallet under an allowance, and either can be spent or revoked after the
 * order is placed, leaving it to fail when it fires. A figure not yet read is not a shortfall.
 */
export const getStopOrderFundingShortfalls = (
  amountIn: string,
  balance?: bigint,
  allowance?: bigint,
): StopOrderFundingShortfall[] => {
  const amount = BigInt(amountIn)
  const shortfalls: StopOrderFundingShortfall[] = []
  if (balance !== undefined && balance < amount) shortfalls.push('balance')
  if (allowance !== undefined && allowance < amount) shortfalls.push('allowance')
  return shortfalls
}

/** A raw amount as the service writes it, as an integer; one that fails to parse counts as nothing. */
export const parseRawAmount = (raw?: string): bigint => {
  if (!raw) return 0n
  try {
    return BigInt(raw)
  } catch {
    return 0n
  }
}

/**
 * Whether what the wallet would have left falls short of what its open orders on that token already
 * lay claim to. Orders lock nothing, so they all draw on the one balance, and whichever fires last
 * finds it gone.
 */
export const hasReservedBalanceShortfall = (remainingBalance: bigint, reserved: bigint): boolean =>
  reserved > 0n && remainingBalance < reserved

/** The warnings the service attached that carry something to show; the rest are nothing to read out. */
export const getStopOrderWarnings = (order: StopOrder): StopOrderWarning[] =>
  Array.isArray(order.warnings)
    ? order.warnings.filter(warning => typeof warning?.message === 'string' && warning.message.trim() !== '')
    : []

/**
 * tokenOut per tokenIn by the oracle, the unit the trigger is set in, from the estimate the service
 * attaches to an open order. Nothing once the order is closed, or while the service has no feed for it.
 */
export const getStopOrderCurrentPrice = (order: StopOrder): number | undefined => {
  const tokenInUsd = toPositiveNumber(order.oracleEstimate?.tokenInPriceUsd)
  const tokenOutUsd = toPositiveNumber(order.oracleEstimate?.tokenOutPriceUsd)
  return tokenInUsd && tokenOutUsd ? tokenInUsd / tokenOutUsd : undefined
}

/**
 * What the sell amount is worth in USD by the order's own figures: the oracle's while it is open, the
 * settlements' once it executed. A cancelled or expired order carries none.
 */
export const getStopOrderSellAmountUsd = (order: StopOrder): number | undefined => {
  const estimate = toPositiveNumber(order.oracleEstimate?.amountInUsd)
  if (estimate !== undefined) return estimate

  const settled = (order.executions ?? [])
    .filter(execution => execution.status === StopOrderExecutionStatus.SUCCESS)
    .map(execution => toPositiveNumber(execution.extraData?.amountIn?.amountUsd))
  if (!settled.length || settled.some(value => value === undefined)) return undefined
  return settled.reduce<number>((total, value) => total + (value ?? 0), 0)
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0

const ORDER_STATUSES = Object.values(StopOrderStatus) as string[]

/**
 * Rejects an order the UI cannot render rather than letting a missing field reach the SDK. A backend
 * contract change then shows up as dropped rows in the console instead of a blank page.
 */
export const parseStopOrder = (raw: unknown): StopOrder | null => {
  if (!raw || typeof raw !== 'object') return null
  const order = raw as Record<string, unknown>

  const chainId = Number(order.chainId)
  const trigger = (order.condition as StopOrder['condition'] | undefined)?.field?.value?.lte

  if (
    typeof order.id !== 'number' ||
    !isSupportedChainId(chainId) ||
    !ORDER_STATUSES.includes(order.status as string) ||
    !isNonEmptyString(order.tokenIn) ||
    !isNonEmptyString(order.tokenOut) ||
    !isRawAmount(order.amountIn) ||
    !isTokenInfo(chainId, order.tokenInInfo) ||
    !isTokenInfo(chainId, order.tokenOutInfo) ||
    !isNonEmptyString(trigger) ||
    typeof order.slippage !== 'number' ||
    typeof order.deadline !== 'number'
  ) {
    return null
  }

  return { ...(order as unknown as StopOrder), chainId }
}

export const parseStopOrders = (raw: unknown): StopOrder[] => {
  const list = Array.isArray(raw) ? raw : []
  const orders = list.map(parseStopOrder).filter((order): order is StopOrder => order !== null)

  if (orders.length !== list.length) {
    console.error(`Dropped ${list.length - orders.length} of ${list.length} stop orders failing validation`)
  }

  return orders
}
