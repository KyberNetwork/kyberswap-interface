import { ChainId, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { AdaptedWallet } from '@reservoir0x/relay-sdk'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { WalletClient } from 'viem'

import { NearToken, SolanaToken } from 'state/crossChainSwap'

import { Quote } from '../registry'

export enum NonEvmChain {
  Near = 'near',
  Bitcoin = 'bitcoin',
  Solana = 'solana',
}

export const BitcoinToken = {
  name: 'Bitcoin',
  symbol: 'BTC',
  decimals: 8,
  logo: 'https://storage.googleapis.com/ks-setting-1d682dca/285205e7-a16d-421c-a794-67439cd6b54f1751515894455.png',
}

export type Chain = ChainId | NonEvmChain
export type Currency = EvmCurrency | NearToken | typeof BitcoinToken | SolanaToken

export const NonEvmChainInfo: { [key in NonEvmChain]: { name: string; icon: string } } = {
  [NonEvmChain.Near]: {
    name: 'NEAR',
    icon: 'https://storage.googleapis.com/ks-setting-1d682dca/000c677f-2ebc-44cc-8d76-e4c6d07627631744962669170.png',
  },
  [NonEvmChain.Bitcoin]: {
    name: 'Bitcoin',
    icon: 'https://storage.googleapis.com/ks-setting-1d682dca/285205e7-a16d-421c-a794-67439cd6b54f1751515894455.png',
  },
  [NonEvmChain.Solana]: {
    name: 'Solana',
    icon: 'https://solana.com/favicon.png',
  },
}

export const NOT_SUPPORTED_CHAINS_PRICE_SERVICE = [
  ChainId.FANTOM,
  ChainId.SCROLL,
  ChainId.BLAST,
  ChainId.ZKSYNC,
  ChainId.HYPEREVM,
  NonEvmChain.Solana,
  NonEvmChain.Bitcoin,
  NonEvmChain.Near,
]

export interface QuoteParams {
  feeBps: number
  fromChain: Chain
  toChain: Chain
  fromToken: Currency
  toToken: Currency
  amount: string
  slippage: number
  walletClient?: AdaptedWallet | WalletClient
  tokenInUsd: number
  tokenOutUsd: number
  sender: string
  recipient: string
  publicKey?: string
}

export interface EvmQuoteParams extends QuoteParams {
  fromToken: EvmCurrency
  toToken: EvmCurrency
}

export interface NearQuoteParams extends QuoteParams {
  nearTokens: NearToken[]
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

  protocolFee: number
  protocolFeeString?: string
  platformFeePercent: number
}

export interface NormalizedTxResponse {
  id: string // specific id for each provider
  sourceTxHash: string
  sender: string
  adapter: string
  sourceChain: Chain
  targetChain: Chain
  inputAmount: string
  outputAmount: string
  sourceToken: Currency
  targetToken: Currency
  targetTxHash?: string
  timestamp: number
  status?: 'Processing' | 'Success' | 'Failed' | 'Refunded'
}

export interface SwapStatus {
  txHash: string
  status: 'Processing' | 'Success' | 'Failed' | 'Refunded'
}

// Define a common interface for all swap providers
export interface SwapProvider {
  getName(): string
  getIcon(): string
  getSupportedChains(): Chain[]
  getSupportedTokens(sourceChain: Chain, destChain: Chain): Currency[]
  getQuote(params: QuoteParams): Promise<NormalizedQuote>
  executeSwap(
    quote: Quote,
    walletClient: WalletClient,
    nearWallet?: ReturnType<typeof useWalletSelector>,
    sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    sendSolanaTransaction?: WalletAdapterProps['sendTransaction'],
    connection?: Connection,
  ): Promise<NormalizedTxResponse>
  getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus>
}
export abstract class BaseSwapAdapter implements SwapProvider {
  abstract getName(): string
  abstract getIcon(): string
  abstract getSupportedChains(): Chain[]
  abstract getSupportedTokens(sourceChain: Chain, destChain: Chain): Currency[]
  abstract getQuote(params: QuoteParams): Promise<NormalizedQuote>
  abstract executeSwap(
    params: Quote,
    walletClient: WalletClient,
    nearWallet?: ReturnType<typeof useWalletSelector>,
  ): Promise<NormalizedTxResponse>
  abstract getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus>

  protected handleError(error: any): never {
    console.error(`[${this.getName()}] Error:`, error)
    throw new Error(`${this.getName()} provider error: ${error.message || 'Unknown error'}`)
  }
}
