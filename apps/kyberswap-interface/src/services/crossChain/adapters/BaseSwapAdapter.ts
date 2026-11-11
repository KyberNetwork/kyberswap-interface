import type { useWalletSelector } from '@near-wallet-selector/react-hook'
import { SwapProvider } from 'services/crossChain/adapters/types'
import { Quote } from 'services/crossChain/registry'
import type { WalletClient } from 'viem'

import { Currency, NormalizedTxResponse, SwapStatus } from 'types/crossChain'

export type { EvmQuoteParams, NormalizedQuote, QuoteParams, SwapProvider } from 'services/crossChain/adapters/types'

export abstract class BaseSwapAdapter implements SwapProvider {
  abstract getName(): string
  abstract getIcon(): string
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
}
