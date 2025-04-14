import { ChainId, Token as EvmToken } from '@kyberswap/ks-sdk-core'
import { WalletClient } from 'viem'
import { Quote } from '../registry'

export type Chain = ChainId | 'bitcoin' | 'near'
export type Token = EvmToken

export interface QuoteParams {
  fromChain: Chain
  toChain: Chain
  fromToken: Token
  toToken: Token
  amount: string
  walletClient?: WalletClient
}

export interface NormalizedQuote {
  outputAmount: bigint
  formattedOutputAmount: string

  inputUsd: number
  outputUsd: number

  rate: number
  timeEstimate: number // in seconds
  priceImpact: number // percent

  gasFeeUsd: number

  contractAddress: string

  rawQuote: any
}

export interface NormalizedTxResponse {
  id: string // specific id for each provider
  sourceTxHash: string
  adapter: string
}

export interface SwapStatus {
  foo?: 'bar'
}

// Define a common interface for all swap providers
export interface SwapProvider {
  getName(): string
  getIcon(): string
  getSupportedChains(): Chain[]
  getSupportedTokens(sourceChain: Chain, destChain: Chain): Token[]
  getQuote(params: QuoteParams): Promise<NormalizedQuote>
  executeSwap(quote: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse>
  getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus>
}
export abstract class BaseSwapAdapter implements SwapProvider {
  abstract getName(): string
  abstract getIcon(): string
  abstract getSupportedChains(): Chain[]
  abstract getSupportedTokens(sourceChain: Chain, destChain: Chain): Token[]
  abstract getQuote(params: QuoteParams): Promise<NormalizedQuote>
  abstract executeSwap(params: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse>
  abstract getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus>

  protected handleError(error: any): never {
    console.error(`[${this.getName()}] Error:`, error)
    throw new Error(`${this.getName()} provider error: ${error.message || 'Unknown error'}`)
  }
}
