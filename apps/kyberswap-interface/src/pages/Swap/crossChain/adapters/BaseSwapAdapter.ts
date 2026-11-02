import type { useWalletSelector } from '@near-wallet-selector/react-hook'
import type { WalletClient } from 'viem'

import { NormalizedQuote, QuoteParams, SwapProvider } from 'pages/Swap/crossChain/adapters/types'
import { Quote } from 'pages/Swap/crossChain/registry'
import { Chain, Currency, NormalizedTxResponse, SwapStatus } from 'types/crossChain'

export type {
  EvmQuoteParams,
  NearQuoteParams,
  NormalizedQuote,
  QuoteParams,
  SwapProvider,
} from 'pages/Swap/crossChain/adapters/types'

export abstract class BaseSwapAdapter implements SwapProvider {
  abstract getName(): string
  abstract getIcon(): string
  abstract getSupportedChains(): Chain[]
  abstract getSupportedTokens(sourceChain: Chain, destChain: Chain): Currency[]
  /**
   * @deprecated Use the aggregator stream API for cross-chain quotes. Retained for same-chain KyberSwap quotes.
   */
  abstract getQuote(params: QuoteParams, signal?: AbortSignal): Promise<NormalizedQuote>
  abstract executeSwap(
    params: Quote,
    walletClient: WalletClient,
    nearWallet?: ReturnType<typeof useWalletSelector>,
  ): Promise<NormalizedTxResponse | undefined>
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
