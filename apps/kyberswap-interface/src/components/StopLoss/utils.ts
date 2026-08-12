import { Currency } from '@kyberswap/ks-sdk-core'

import { DEFAULT_STOP_LOSS_SLIPPAGE } from 'components/StopLoss/constants'
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
const FAILED_EXECUTION_STATUSES = [StopLossExecutionStatus.FAILED, StopLossExecutionStatus.NOT_MINED]

/**
 * Collapses the order status and its latest settlement attempt into the single state a row shows.
 * An order stays `Open` while a settlement is in flight or after one failed, so those two cases are
 * only visible through the executions.
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
      if (FAILED_EXECUTION_STATUSES.includes(execution.status)) return StopLossDisplayStatus.FAILED
      return StopLossDisplayStatus.ACTIVE
    }
  }
}

const ACTIVE_DISPLAY_STATUSES = [StopLossDisplayStatus.ACTIVE, StopLossDisplayStatus.TRIGGERED]

/**
 * Which table an order belongs in. Keyed on the *display* status, not the service's, because the
 * service has no failed state: a failed settlement leaves the order reading `Open`, so splitting on
 * the raw status would file every failure under Active — where the layout has no status column to
 * show it in. A failed execution is never retried, so the order is finished even though the service
 * keeps calling it open until the deadline passes.
 */
export const isActiveStopLossStatus = (status: StopLossDisplayStatus) => ACTIVE_DISPLAY_STATUSES.includes(status)

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
): { triggerPrice: string; slippage: number; expire: number } => {
  const duration = order.deadline - order.createdAt
  return {
    triggerPrice: getStopLossTriggerPrice(order),
    slippage: Number.isFinite(order.slippage) && order.slippage > 0 ? order.slippage : DEFAULT_STOP_LOSS_SLIPPAGE,
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
 * Reads the received amount from an execution.
 *
 * `amountOut.amount` is documented as raw units while its sibling `amountIn.amount` is human-readable,
 * and a whole number is valid under either reading — the two differ by 10^decimals, so guessing wrong
 * shows a settlement figure off by orders of magnitude. The execution carries `amountUsd` and a
 * per-token `priceUsd`, which together say which reading the number must be.
 */
export const resolveExecutionAmountOut = (
  execution: StopLossExecution | undefined,
  tokenOut: string,
  decimals: number | undefined,
): number | undefined => {
  const raw = execution?.extraData?.amountOut?.amount
  if (!raw || decimals === undefined || !/^\d+(\.\d+)?$/.test(raw)) return undefined

  const asHuman = Number(raw)
  if (!Number.isFinite(asHuman)) return undefined
  const asRaw = asHuman / 10 ** decimals

  const amountUsd = Number(execution?.extraData?.amountOut?.amountUsd)
  const priceUsd = Number(
    execution?.extraData?.tokensInfo?.find(token => token.address?.toLowerCase() === tokenOut.toLowerCase())?.priceUsd,
  )
  // Without both references the documented reading is all there is to go on.
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || !Number.isFinite(priceUsd) || priceUsd <= 0) return asRaw

  return Math.abs(asRaw * priceUsd - amountUsd) <= Math.abs(asHuman * priceUsd - amountUsd) ? asRaw : asHuman
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
