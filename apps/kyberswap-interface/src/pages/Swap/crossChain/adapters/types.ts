import type { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import type { useWalletSelector } from '@near-wallet-selector/react-hook'
import type { AdaptedWallet } from '@relayprotocol/relay-sdk'
import type { WalletAdapterProps } from '@solana/wallet-adapter-base'
import type { Connection } from '@solana/web3.js'
import type { WalletClient } from 'viem'

import type { Quote } from 'pages/Swap/crossChain/registry'
import type { Chain, Currency, GasDropQuote, NearToken, NormalizedTxResponse, SwapStatus } from 'types/crossChain'

export interface QuoteParams {
  gasDrop?: boolean
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
  quoteParams: Readonly<QuoteParams>

  /** Opaque aggregator identity used by BE transaction registration. */
  quoteId?: string
  quoteToken?: string

  gasDrop?: GasDropQuote
  minimumOutputAmount?: bigint

  outputAmount: bigint
  formattedOutputAmount: string

  inputUsd: number
  outputUsd: number

  rate: number
  timeEstimate: number // in seconds
  priceImpact: number | null // percent; null when prices are unavailable

  contractAddress: string

  rawQuote: unknown

  additionalFeeUsd?: number // USD value of the additional provider fee.
  additionalFeeAmount?: string // Display amount with token symbol, e.g. "0.0001 ETH".
  platformFeePercent: number
}

export interface SwapProviderAlias {
  name: string
  icon?: string
}

// Define a common interface for all swap providers
export interface SwapProvider {
  getName(): string
  getIcon(): string
  getAliases?(): SwapProviderAlias[]
  getSupportedChains(): Chain[]
  getSupportedTokens(sourceChain: Chain, destChain: Chain): Currency[]
  getQuote(params: QuoteParams, signal?: AbortSignal): Promise<NormalizedQuote>
  // Redirect wallets return no result; their callback restores the transaction.
  executeSwap(
    quote: Quote,
    walletClient: WalletClient,
    nearWallet?: ReturnType<typeof useWalletSelector>,
    sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    sendSolanaTransaction?: WalletAdapterProps['sendTransaction'],
    connection?: Connection,
    onSourceTransaction?: (
      sourceTxHash: string,
      tracking?: Pick<NormalizedTxResponse, 'id' | 'depositAddress'>,
    ) => void,
  ): Promise<NormalizedTxResponse | undefined>
  getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus>
  canSupport(category: string, tokenIn?: Currency, tokenOut?: Currency): boolean
}
