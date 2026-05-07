import { TransactionRequest } from '@ethersproject/abstract-provider'
import { Deferrable } from 'ethers/lib/utils'

export enum ErrorName {
  LimitOrderError = 'LimitOrderError',
  SwapError = 'SwapError',
  GasRefundClaimError = 'GasRefundClaimError',
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
