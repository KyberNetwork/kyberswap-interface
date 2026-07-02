import { ChainId, type Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import type { useWalletSelector } from '@near-wallet-selector/react-hook'
import type { AdaptedWallet } from '@relayprotocol/relay-sdk'
import type { WalletAdapterProps } from '@solana/wallet-adapter-base'
import type { Connection } from '@solana/web3.js'
import type { WalletClient } from 'viem'

import SolanaIcon from 'assets/networks/solana.svg'
import type { NearToken } from 'pages/CrossChainSwap/hooks/useNearTokens'
import type { SolanaToken } from 'pages/CrossChainSwap/hooks/useSolanaTokens'
import type { Quote } from 'pages/CrossChainSwap/registry'

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
    icon: SolanaIcon,
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
  includedSources?: string[]
  excludedSources?: string[]
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
  bridgeProvider?: string
  routeId?: string
  // Enriched fields for data analysis
  amountInUsd: number
  amountOutUsd: number
  platformFeePercent: number
  recipient: string
  // Debug field to store original estimated amount when actual amount is available
  estimatedAmountOut?: string
}

export interface SwapStatus {
  txHash: string
  status: 'Processing' | 'Success' | 'Failed' | 'Refunded'
  amountOut?: string // Actual output amount from the destination chain (raw amount, not formatted)
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
  canSupport(category: string, tokenIn?: Currency, tokenOut?: Currency): boolean
}
