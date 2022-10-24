import { ChainId } from '@kyberswap/ks-sdk-core'

export type LimitOrderSwapState = {
  showConfirm: boolean
  attemptingTxn: boolean
  swapErrorMessage: string | undefined
  txHash: string | undefined
  pendingText: string
}

export enum LimitOrderStatus {
  ACTIVE = 'active',
  OPEN = 'open',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELLING = 'cancelling',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  EXPRIED = 'expired',
}

export type LimitOrder = {
  id: number
  chainId: ChainId
  makerAsset: string
  takerAsset: string
  makerAssetSymbol: string
  takerAssetSymbol: string
  makerAssetLogoURL: string
  takerAssetLogoURL: string
  makingAmount: string
  takingAmount: string
  filledMakingAmount: string
  filledTakingAmount: string
  status: LimitOrderStatus
  createdAt: number // timestamp in seconds
  expiredAt: number
}
