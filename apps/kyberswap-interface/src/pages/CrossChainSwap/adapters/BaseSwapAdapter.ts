import { ChainId, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { WalletClient } from 'viem'
import { Quote } from '../registry'
import { NearToken } from 'state/crossChainSwap'

export enum NonEvmChain {
  Near = 'near',
}

export type Chain = ChainId | NonEvmChain
export type Currency = EvmCurrency | NearToken

export const NonEvmChainInfo: { [key in NonEvmChain]: { name: string; icon: string } } = {
  [NonEvmChain.Near]: {
    name: 'NEAR',
    icon: 'https://storage.googleapis.com/ks-setting-1d682dca/000c677f-2ebc-44cc-8d76-e4c6d07627631744962669170.png',
  },
}

export interface QuoteParams {
  fromChain: Chain
  toChain: Chain
  fromToken: Currency
  toToken: Currency
  amount: string
  slippage: number
  walletClient?: WalletClient
}

export interface NormalizedQuote {
  quoteParams: QuoteParams

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
  sourceChain: Chain
  targetChain: Chain
  inputAmount: string
  outputAmount: string
  sourceToken: Currency
  targetToken: Currency
  targetTxHash?: string
  timestamp: number
  status?: 'pending' | 'filled'
}

export interface SwapStatus {
  txHash: string
  status: 'pending' | 'filled'
}

// Define a common interface for all swap providers
export interface SwapProvider {
  getName(): string
  getIcon(): string
  getSupportedChains(): Chain[]
  getSupportedTokens(sourceChain: Chain, destChain: Chain): Currency[]
  getQuote(params: QuoteParams): Promise<NormalizedQuote>
  executeSwap(quote: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse>
  getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus>
}
export abstract class BaseSwapAdapter implements SwapProvider {
  abstract getName(): string
  abstract getIcon(): string
  abstract getSupportedChains(): Chain[]
  abstract getSupportedTokens(sourceChain: Chain, destChain: Chain): Currency[]
  abstract getQuote(params: QuoteParams): Promise<NormalizedQuote>
  abstract executeSwap(params: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse>
  abstract getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus>

  protected handleError(error: any): never {
    console.error(`[${this.getName()}] Error:`, error)
    throw new Error(`${this.getName()} provider error: ${error.message || 'Unknown error'}`)
  }
}
