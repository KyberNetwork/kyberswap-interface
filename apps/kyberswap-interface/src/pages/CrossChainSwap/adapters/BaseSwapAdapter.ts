import type { useWalletSelector } from '@near-wallet-selector/react-hook'
import type { WalletClient } from 'viem'

import {
  Chain,
  Currency,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapProvider,
  SwapStatus,
} from 'pages/CrossChainSwap/adapters/types'
import { Quote } from 'pages/CrossChainSwap/registry'

// Re-export the leaf types/values so eager modules (utils, redux) can import the small
// enum/types without pulling in the adapter SDK barrel.
export {
  BitcoinToken,
  NonEvmChain,
  NonEvmChainInfo,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
} from 'pages/CrossChainSwap/adapters/types'
export type {
  Chain,
  Currency,
  EvmQuoteParams,
  NearQuoteParams,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapProvider,
  SwapStatus,
} from 'pages/CrossChainSwap/adapters/types'

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

  canSupport(_category: string, _tokenIn?: Currency, _tokenOut?: Currency): boolean {
    // Default implementation - support all cases
    return true
  }

  protected handleError(error: any): never {
    console.error(`[${this.getName()}] Error:`, error)
    throw new Error(`${this.getName()} provider error: ${error.message || 'Unknown error'}`)
  }
}
