import { ChainId, Currency, Fraction } from '@kyberswap/ks-sdk-core'

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

export type LimitOrderFromTokenPair = {
  id: number
  chainId: ChainId
  signature: string
  salt: string
  makerAsset: string
  takerAsset: string
  maker: string
  contractAddress: string
  receiver: string
  allowedSenders: string
  makingAmount: string
  takingAmount: string
  filledMakingAmount: string
  filledTakingAmount: string
  feeConfig: string
  feeRecipient: string
  makerTokenFeePercent: string
  isTakerAssetFee: boolean
  makerAssetData: string
  takerAssetData: string
  getMakerAmount: string
  getTakerAmount: string
  predicate: string
  permit: string
  interaction: string
  expiredAt: number
  orderHash: string
  availableMakingAmount: string
  makerBalanceAllowance: string
  makerAssetDecimals: number
  takerAssetDecimals: number
  makerAssetLogoURL?: string
  takerAssetLogoURL?: string
}

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
