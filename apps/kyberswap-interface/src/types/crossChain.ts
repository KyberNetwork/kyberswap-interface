import { ChainId, type Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'

import SolanaIcon from 'assets/networks/solana.svg'

export interface NearToken {
  assetId: string
  decimals: number
  blockchain: string
  symbol: string
  price: number
  priceUpdatedAt: number
  contractAddress: string
  logo: string
}

export interface SolanaToken {
  id: string
  name: string
  symbol: string
  icon: string
  logo: string
  decimals: number
  tokenProgram: string
}

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
export type NonEvmCurrency = NearToken | typeof BitcoinToken | SolanaToken
export type Currency = EvmCurrency | NonEvmCurrency

export const isEvmChain = (chain: Chain) => Object.values(ChainId).includes(chain)

export const isNonEvmChain = (chain: Chain) => Object.values(NonEvmChain).includes(chain)

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
  ChainId.ABSTRACT,
  ChainId.ZKSYNC,
  ChainId.HYPEREVM,
  NonEvmChain.Solana,
  NonEvmChain.Bitcoin,
  NonEvmChain.Near,
]

export type GasDropQuote = {
  amount: string
  minAmount: string
  amountUsd?: number
  inputAmountUsd?: number
  inputToken: string
}

export type GasDropStatus = {
  status: 'Pending' | 'Delivered' | 'Failed' | 'NotExecuted'
  amount?: string
}

export type TransactionStatus = NonNullable<NormalizedTxResponse['status']>
export const isProcessingTransactionStatus = (status?: TransactionStatus) => !status || status === 'Processing'

export interface NormalizedTxResponse {
  gasDrop?: GasDropQuote
  gasDropStatus?: GasDropStatus
  id: string // specific id for each provider
  /** Actual broadcast source-chain transaction hash; never a deposit address. */
  sourceTxHash: string
  /** NEAR Intents provider tracking address, distinct from source/destination hashes. */
  depositAddress?: string
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
  // Enriched fields for data analysis
  amountInUsd: number
  amountOutUsd: number
  platformFeePercent: number
  recipient: string
  // Debug field to store original estimated amount when actual amount is available
  estimatedAmountOut?: string
}

export interface SwapStatus {
  gasDropStatus?: GasDropStatus
  txHash: string
  status: 'Processing' | 'Success' | 'Failed' | 'Refunded'
  amountOut?: string // Actual output amount from the destination chain (raw amount, not formatted)
}
