import { TransactionRequest } from '@ethersproject/abstract-provider'
import { captureException } from '@sentry/react'
import { Deferrable } from 'ethers/lib/utils'

import { didUserReject } from 'constants/connectors/utils'

import { friendlyError, knownPatterns } from './errorMessage'

export enum ErrorName {
  LimitOrderError = 'LimitOrderError',
  SwapError = 'SwapError',
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

  const level = Object.keys(knownPatterns)
    .map(key => knownPatterns[key])
    .includes(friendlyErrorResult)
    ? 'warning'
    : 'error'

  captureException(e, {
    level,
    extra: { rawData: error.rawData },
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
  wallet: string | undefined

  constructor(
    name: ErrorName,
    type: 'estimateGas' | 'sendTransaction',
    message: string,
    rawData: Deferrable<TransactionRequest>,
    options: ErrorOptions | undefined,
    wallet: string | undefined,
  ) {
    super(message, options)
    this.name = name
    this.type = type
    this.rawData = rawData
    this.code = (options?.cause as any)?.code
    this.wallet = wallet
  }
}
