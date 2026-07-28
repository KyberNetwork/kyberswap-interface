export enum ErrorName {
  LimitOrderError = 'LimitOrderError',
  SwapError = 'SwapError',
  GasRefundClaimError = 'GasRefundClaimError',
}

// Loose shape of the eth_call/eth_sendTransaction payload captured for debugging
// inside TransactionError. Both branches of `sendEVMTransaction` build objects
// matching this shape; widen it as needed if more fields become useful.
export type TransactionErrorRawData = {
  from?: string
  to?: string
  data?: unknown
  value?: unknown
  gasLimit?: unknown
  accessList?: unknown
}

export class TransactionError extends Error {
  name: ErrorName
  type: 'estimateGas' | 'sendTransaction'
  rawData: TransactionErrorRawData
  code?: number
  wallet: string | undefined

  constructor(
    name: ErrorName,
    type: 'estimateGas' | 'sendTransaction',
    message: string,
    rawData: TransactionErrorRawData,
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

// Thrown by the pre-send blackjack check when the active wallet is on the deny list.
export class BlacklistedWalletError extends Error {
  constructor() {
    super('There was an error with your transaction.')
    this.name = 'BlacklistedWalletError'
  }
}
