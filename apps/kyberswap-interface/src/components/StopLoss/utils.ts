import { Currency } from '@kyberswap/ks-sdk-core'

import {
  StopLossCorePayload,
  StopLossDisplayStatus,
  StopLossExecution,
  StopLossExecutionStatus,
  StopLossOrder,
  StopLossOrderStatus,
  StopLossTypedData,
} from 'components/StopLoss/types'
import { isSupportedChainId } from 'constants/networks'
import { tryParseAmount } from 'state/swap/hooks'

/** The service rejects any deadline past 2100-01-01, so an "expires never" choice lands here instead. */
export const MAX_STOP_LOSS_DEADLINE = 4102444800

export const clampStopLossDeadline = (deadlineInSeconds: number) =>
  Math.min(Math.floor(deadlineInSeconds), MAX_STOP_LOSS_DEADLINE)

/**
 * The service emits `"salt": ""` on the EIP-712 domain, which strict signers reject because they
 * expect bytes32. `salt` is absent from the EIP712Domain type list, so dropping it leaves the digest
 * unchanged.
 */
export const stripEmptyEip712Salt = (typedData: StopLossTypedData): StopLossTypedData => {
  const { salt, ...domain } = typedData.domain as { salt?: unknown }
  return salt === '' || salt === undefined ? { ...typedData, domain } : typedData
}

/**
 * The current attempt. Picked by the highest `executionNum` rather than array position, so it does
 * not rest on an ordering the service has never promised.
 */
export const getLatestExecution = (order: StopLossOrder): StopLossExecution | undefined =>
  order.executions?.length
    ? order.executions.reduce((latest, e) => (e.executionNum > latest.executionNum ? e : latest))
    : undefined

const IN_FLIGHT_EXECUTION_STATUSES = [StopLossExecutionStatus.CREATED, StopLossExecutionStatus.PENDING]

/**
 * Collapses the order status and its latest settlement attempt into the single state a row shows.
 * An order stays `Open` while a settlement is in flight, so that case is only visible through the
 * executions. A failed attempt leaves the order Active: the service keeps trying it while it is `Open`
 * (a wallet short of tokenIn fills once topped up), so it must stay cancellable.
 */
export const getStopLossDisplayStatus = (order: StopLossOrder): StopLossDisplayStatus => {
  switch (order.status) {
    case StopLossOrderStatus.DONE:
      return StopLossDisplayStatus.EXECUTED
    case StopLossOrderStatus.CANCELLED:
      return StopLossDisplayStatus.CANCELLED
    case StopLossOrderStatus.EXPIRED:
      return StopLossDisplayStatus.EXPIRED
    default: {
      const execution = getLatestExecution(order)
      if (!execution) return StopLossDisplayStatus.ACTIVE
      if (IN_FLIGHT_EXECUTION_STATUSES.includes(execution.status)) return StopLossDisplayStatus.TRIGGERED
      return StopLossDisplayStatus.ACTIVE
    }
  }
}

const ACTIVE_DISPLAY_STATUSES = [StopLossDisplayStatus.ACTIVE, StopLossDisplayStatus.TRIGGERED]

/**
 * Which table an order belongs in. Keyed on the *display* status, not the service's, because a
 * settlement in flight is still `Open` to the service but belongs with the live orders.
 */
export const isActiveStopLossStatus = (status: StopLossDisplayStatus) => ACTIVE_DISPLAY_STATUSES.includes(status)

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

/** Trigger price as a human decimal string, tokenOut per tokenIn. */
export const getStopLossTriggerPrice = (order: StopLossOrder) => order.condition?.field?.value?.lte ?? ''

/** The settlement transaction, available once an attempt reached the chain. */
export const getStopLossExecutionTxHash = (order: StopLossOrder) => getLatestExecution(order)?.hash

/**
 * Why a triggered order never settled.
 *
 * Hard-coded placeholder: neither the order nor its executions carry a reason, so every failure reads
 * the same. The single place to swap once the service returns one — see the pending BE request.
 */
export const getStopLossFailureReason = (_order: StopLossOrder): string => 'insufficient liquidity'

/**
 * The card inputs that reproduce a past order.
 *
 * Expiry is carried as the original *duration*, not the original deadline: the deadline is a fixed
 * point in time, so an expired order would clone to one already past its deadline, and any other
 * closed order to a shorter window than the user originally chose.
 */
export const getStopLossRecreateDraft = (
  order: StopLossOrder,
  defaultExpire: number,
): { triggerPrice: string; slippage: number | undefined; expire: number } => {
  const duration = order.deadline - order.createdAt
  return {
    triggerPrice: getStopLossTriggerPrice(order),
    // Without a usable figure the form falls back to the pair's suggested slippage.
    slippage: Number.isFinite(order.slippage) && order.slippage > 0 ? order.slippage : undefined,
    expire: Number.isFinite(duration) && duration > 0 ? duration : defaultExpire,
  }
}

export type BuildStopLossPayloadParams = {
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
export const buildStopLossPayload = ({
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
}: BuildStopLossPayloadParams): StopLossCorePayload => ({
  chainId,
  userWallet: account,
  // Native currency is wrapped before settlement, so the order always sells the wrapped token.
  tokenIn: currencyIn.wrapped.address,
  tokenOut: currencyOut.wrapped.address,
  amountIn: tryParseAmount(inputAmount, currencyIn.wrapped)?.quotient?.toString() ?? '0',
  slippage,
  deadline: clampStopLossDeadline(expiredAt / 1000),
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
 * Reads one side of an execution's settled amount, in the token's human units.
 *
 * `amountOut.amount` is documented as raw units while its sibling `amountIn.amount` is human-readable,
 * and a whole number is valid under either reading — the two differ by 10^decimals, so guessing wrong
 * shows a settlement figure off by orders of magnitude. The execution carries `amountUsd` and a
 * per-token `priceUsd`, which together say which reading the number must be.
 */
const resolveExecutionAmount = (
  execution: StopLossExecution | undefined,
  side: 'amountIn' | 'amountOut',
  token: string,
  decimals: number | undefined,
): number | undefined => {
  const field = execution?.extraData?.[side]
  const value = field?.amount
  if (!value || decimals === undefined || !/^\d+(\.\d+)?$/.test(value)) return undefined

  const asHuman = Number(value)
  if (!Number.isFinite(asHuman)) return undefined
  // A raw amount is an integer, so a fraction settles the reading on its own.
  if (value.includes('.')) return asHuman
  const asRaw = asHuman / 10 ** decimals

  const amountUsd = Number(field?.amountUsd)
  const priceUsd = Number(
    execution?.extraData?.tokensInfo?.find(info => info.address?.toLowerCase() === token.toLowerCase())?.priceUsd,
  )
  // Without both references the documented reading is all there is to go on.
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || !Number.isFinite(priceUsd) || priceUsd <= 0) {
    return side === 'amountOut' ? asRaw : asHuman
  }

  return Math.abs(asRaw * priceUsd - amountUsd) <= Math.abs(asHuman * priceUsd - amountUsd) ? asRaw : asHuman
}

/** What one execution received, in tokenOut's human units. */
export const resolveExecutionAmountOut = (
  execution: StopLossExecution | undefined,
  tokenOut: string,
  decimals: number | undefined,
) => resolveExecutionAmount(execution, 'amountOut', tokenOut, decimals)

/** What one execution sold, in tokenIn's human units. */
export const resolveExecutionAmountIn = (
  execution: StopLossExecution | undefined,
  tokenIn: string,
  decimals: number | undefined,
) => resolveExecutionAmount(execution, 'amountIn', tokenIn, decimals)

/** One settlement that went through. Amounts are in human units; any the execution does not report are unset. */
export type StopLossFill = {
  hash: string
  amountIn?: number
  amountOut?: number
  /** tokenIn priced in tokenOut by the oracle when this fill settled. */
  price?: number
}

/**
 * Every settlement of the order that went through, oldest first. A stop-loss settles in one today, but
 * an order keeps a list of executions, so nothing that shows them assumes there is only one.
 */
export const getStopLossFills = (
  order: StopLossOrder,
  tokenInDecimals: number | undefined,
  tokenOutDecimals: number | undefined,
): StopLossFill[] =>
  (order.executions ?? [])
    .filter(execution => execution.status === StopLossExecutionStatus.SUCCESS)
    .sort((a, b) => a.executionNum - b.executionNum)
    .map(execution => {
      const price = Number(execution.extraData?.oraclePrice)
      return {
        hash: execution.hash,
        amountIn: resolveExecutionAmountIn(execution, order.tokenIn, tokenInDecimals),
        amountOut: resolveExecutionAmountOut(execution, order.tokenOut, tokenOutDecimals),
        price: Number.isFinite(price) && price > 0 ? price : undefined,
      }
    })

export type StopLossFillSummary = { amountIn?: number; amountOut?: number; price?: number }

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
export const summarizeStopLossFills = (fills: StopLossFill[], orderAmountIn?: number): StopLossFillSummary => {
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

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0

const ORDER_STATUSES = Object.values(StopLossOrderStatus) as string[]

/**
 * Rejects an order the UI cannot render rather than letting a missing field reach the SDK. A backend
 * contract change then shows up as dropped rows in the console instead of a blank page.
 */
export const parseStopLossOrder = (raw: unknown): StopLossOrder | null => {
  if (!raw || typeof raw !== 'object') return null
  const order = raw as Record<string, unknown>

  const chainId = Number(order.chainId)
  const trigger = (order.condition as StopLossOrder['condition'] | undefined)?.field?.value?.lte

  if (
    typeof order.id !== 'number' ||
    !isSupportedChainId(chainId) ||
    !ORDER_STATUSES.includes(order.status as string) ||
    !isNonEmptyString(order.tokenIn) ||
    !isNonEmptyString(order.tokenOut) ||
    !isRawAmount(order.amountIn) ||
    !isNonEmptyString(trigger) ||
    typeof order.slippage !== 'number' ||
    typeof order.deadline !== 'number'
  ) {
    return null
  }

  return { ...(order as unknown as StopLossOrder), chainId }
}

export const parseStopLossOrders = (raw: unknown): StopLossOrder[] => {
  const list = Array.isArray(raw) ? raw : []
  const orders = list.map(parseStopLossOrder).filter((order): order is StopLossOrder => order !== null)

  if (orders.length !== list.length) {
    console.error(`Dropped ${list.length - orders.length} of ${list.length} stop-loss orders failing validation`)
  }

  return orders
}
