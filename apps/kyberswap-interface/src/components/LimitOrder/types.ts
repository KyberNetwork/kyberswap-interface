import { ChainId, Currency, Fraction } from '@kyberswap/ks-sdk-core'
import { z } from 'zod'

import { isSupportedChainId } from 'constants/networks'
import type { BaseTradeInfo } from 'hooks/useBaseTradeInfo'

export enum LimitOrderTab {
  PRICE = 'price',
  ORDER_BOOK = 'order_book',
  MY_ORDER = 'my_order',
}

export enum LimitOrderStatus {
  // status from BE
  ACTIVE = 'active',
  OPEN = 'open',
  PARTIALLY_FILLED = 'partially_filled',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  FILLED = 'filled',
  CANCELLING = 'cancelling',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  // custom status
  CANCELLED_FAILED = 'cancelled_failed',
}

export type LimitOrder = {
  id: number
  nonce: number
  chainId: ChainId
  makerAsset: string
  takerAsset: string
  makerAssetSymbol: string
  takerAssetSymbol: string
  makerAssetLogoURL: string
  takerAssetLogoURL: string
  makerAssetDecimals: number
  takerAssetDecimals: number
  makingAmount: string
  takingAmount: string
  filledMakingAmount: string
  filledTakingAmount: string
  status: LimitOrderStatus
  createdAt: number // timestamp in seconds
  expiredAt: number
  transactions: Array<{
    id: number
    txTime: number
    txHash: string
    makingAmount: string
    takingAmount: string
  }>
  contractAddress: string
  operatorSignatureExpiredAt?: number
  // custom
  isSuccessful: boolean
  uuid: string
  txHash: string
  nativeOutput?: boolean
}

const MAX_UINT256 = 2n ** 256n - 1n

// Raw on-chain amounts arrive as decimal strings and are fed straight to JSBI, which throws on
// anything else. The upper bound mirrors ks-sdk-core's `AMOUNT` invariant on CurrencyAmount.
// The digit test guards BigInt inside the same predicate because zod keeps running a chained
// refinement after an earlier check has failed, so BigInt must never see a non-numeric string.
const isRawAmount = (value: string) => /^\d+$/.test(value) && BigInt(value) <= MAX_UINT256

const rawAmountSchema = z.string().refine(isRawAmount)

// Amounts that end up as a divisor when deriving the order rate: zero makes decimal.js-light throw.
const divisorRawAmountSchema = z.string().refine(value => isRawAmount(value) && BigInt(value) > 0n)

const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/)

// ks-sdk-core's BaseCurrency invariant: an integer in [0, 255).
const decimalsSchema = z.number().int().min(0).max(254)

export const limitOrderFromTokenPairSchema = z.object({
  id: z.number(),
  // The API serialises chainId as a string.
  chainId: z.coerce.number().refine(isSupportedChainId),
  signature: z.string(),
  salt: z.string(),
  makerAsset: addressSchema,
  takerAsset: addressSchema,
  maker: z.string(),
  contractAddress: z.string(),
  receiver: z.string(),
  allowedSenders: z.string(),
  makingAmount: divisorRawAmountSchema,
  takingAmount: divisorRawAmountSchema,
  filledMakingAmount: rawAmountSchema,
  filledTakingAmount: rawAmountSchema,
  feeConfig: z.string(),
  feeRecipient: z.string(),
  makerTokenFeePercent: z.string(),
  isTakerAssetFee: z.boolean(),
  makerAssetData: z.string(),
  takerAssetData: z.string(),
  getMakerAmount: z.string(),
  getTakerAmount: z.string(),
  predicate: z.string(),
  permit: z.string(),
  interaction: z.string(),
  expiredAt: z.number(),
  orderHash: z.string(),
  availableMakingAmount: rawAmountSchema,
  makerBalanceAllowance: z.string().optional(),
  makerAssetDecimals: decimalsSchema,
  takerAssetDecimals: decimalsSchema,
  makerAssetLogoURL: z.string().optional(),
  takerAssetLogoURL: z.string().optional(),
  nativeOutput: z.boolean().optional(),
})

export type LimitOrderFromTokenPair = z.infer<typeof limitOrderFromTokenPairSchema>

export type LimitOrderFromTokenPairFormatted = {
  id: number
  chainId: ChainId
  rawOrder: LimitOrderFromTokenPair
  isReversed: boolean
  hasAvailable: boolean
  formattedMakerAmount: string
  formattedTakerAmount: string
  formattedAvailableMakerAmount: string
  formattedAvailableTakerAmount: string
  rate: string
  formattedRate: string
  invertedRate: string
  formattedInvertedRate: string
  formattedMarketDiffPercent: string
  formattedInvertedMarketDiffPercent: string
  marketDiffPercent: number
  filledPercent: string
}

export enum CancelOrderType {
  GAS_LESS_CANCEL,
  HARD_CANCEL,
}

export type RateInfo = {
  rate: string // to store user input
  invertRate: string // to store user input
  rateFraction?: Fraction // to calc with big number
}

export type DeltaRateLimitOrder = {
  rawPercent: number | undefined
  percent: string
  profit: boolean
}

export type CancelOrderFunction = (data: {
  orders: LimitOrder[]
  isCancelAll: boolean
  cancelType: CancelOrderType
}) => Promise<CancelOrderResponse | undefined>

export type CancelOrderResponse = {
  orders: { operatorSignatureExpiredAt: number }[]
}

export type CreateOrderParams = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  chainId: ChainId
  account: string | undefined
  inputAmount: string
  outputAmount: string
  expiredAt: number
  referral?: string
}

export type LimitOrderCreateContext = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  chainId: ChainId
  networkName: string
  inputAmount: string
  outputAmount: string
  displayRate: string
  expiredAt: number
  displayTime: string
  rateInfo: RateInfo
  tradeInfo: BaseTradeInfo | undefined
  deltaRate: DeltaRateLimitOrder
}

export type LimitOrderTakeContext = {
  order: LimitOrderFromTokenPair
  payCurrency: Currency
  receiveCurrency: Currency
}
