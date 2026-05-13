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

// Thrown by the pre-send blackjack check when the active wallet is on the deny list.
// Lives here (not inside the `hooks` module that owns the legacy Web3Provider Proxy) so
// any signing path — both the ethers Proxy in `useWeb3React` and the new viem-based
// `sendEVMTransaction` — can throw the same error type.
export class BlacklistedWalletError extends Error {
  constructor() {
    super('There was an error with your transaction.')
    this.name = 'BlacklistedWalletError'
  }
}
