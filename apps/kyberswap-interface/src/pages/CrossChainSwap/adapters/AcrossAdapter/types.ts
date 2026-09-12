import type { AcrossClient, ExecuteQuoteParams, ExecuteSwapQuoteParams } from '@across-protocol/app-sdk'

export type AcrossDepositStatus = 'pending' | 'filled' | 'expired' | 'refunded' | 'slowFillRequested'

export interface AcrossDepositStatusResponse {
  status?: AcrossDepositStatus
  fillTxnRef?: string
  fillTx?: string
  originChainId?: number
  destinationChainId?: number
  depositId?: string | number
  depositTxnRef?: string
  depositRefundTxnRef?: string
  actionsSucceeded?: boolean
  error?: string
  message?: string
}

export interface AcrossSuggestedFeesQuote {
  outputAmount: string
  estimatedFillTimeSec: number
}

export type AcrossSwapQuote = Awaited<ReturnType<AcrossClient['getSwapQuote']>>
export type AcrossWalletClient = ExecuteQuoteParams['walletClient']
export type AcrossDeposit = ExecuteQuoteParams['deposit']
export type AcrossSwapExecutionProgress = Parameters<NonNullable<ExecuteSwapQuoteParams['onProgress']>>[0]
