import { TransactionRequest } from '@ethersproject/abstract-provider'
import { captureException } from '@sentry/react'
import { Deferrable } from 'ethers/lib/utils'

import { didUserReject } from 'constants/connectors/utils'
import { SUPPORTED_WALLET } from 'constants/wallets'

import { friendlyError } from './errorMessage'

export enum ErrorName {
  LimitOrderError = 'LimitOrderError',
  SwapError = 'SwapError',
  ClaimCampaignError = 'ClaimCampaignError',
  GasRefundClaimError = 'GasRefundClaimError',
  RemoveElasticLiquidityError = 'RemoveElasticLiquidityError',
  RemoveClassicLiquidityError = 'RemoveClassicLiquidityError',
}

export function captureSwapError(error: TransactionError) {
  if (didUserReject(error)) return

  const friendlyErrorResult = friendlyError(error)
  if (friendlyErrorResult.includes('slippage')) return

  const e = new Error(`${error.type}: ${friendlyErrorResult}`, { cause: error })
  e.name = error.name

  const tmp = JSON.stringify(error)
  const tag = tmp.includes('minTotalAmountOut')
    ? 'minTotalAmountOut'
    : tmp.includes('ERR_LIMIT_OUT')
    ? 'ERR_LIMIT_OUT'
    : tmp.toLowerCase().includes('1inch')
    ? 'call1InchFailed'
    : tmp.toLowerCase().includes('return amount is not enough')
    ? 'returnAmountIsNotEnough'
    : 'other'

  captureException(e, {
    level: 'fatal',
    extra: { rawData: error.rawData, step: error.step },
    tags: {
      type: tag,
    },
  })
}

export class TransactionError extends Error {
  name: ErrorName
  type: 'estimateGas' | 'sendTransaction'
  rawData: Deferrable<TransactionRequest>
  code?: number
  step?: string
  wallet: SUPPORTED_WALLET | undefined

  constructor(
    name: ErrorName,
    type: 'estimateGas' | 'sendTransaction',
    message: string,
    rawData: Deferrable<TransactionRequest>,
    options: ErrorOptions | undefined,
    wallet: SUPPORTED_WALLET | undefined,
  ) {
    super(message, options)
    this.name = name
    this.type = type
    this.rawData = rawData
    this.code = (options?.cause as any)?.code
    this.wallet = wallet
  }
}
