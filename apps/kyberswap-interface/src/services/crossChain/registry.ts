import type { NormalizedQuote, QuoteProvider, SwapProvider } from 'services/crossChain/adapters/types'
import { normalizeAdapterName } from 'services/crossChain/utils'

export interface Quote {
  id?: string
  selectionKey?: string
  adapter: SwapProvider
  quote: NormalizedQuote
  isReadOnly: boolean
}

export const getQuoteId = (quote: Quote): string => quote.id ?? quote.adapter.getName()

export const getQuoteSelectionKey = (quote: Quote): string => quote.selectionKey ?? getQuoteId(quote)

export const getSelectedQuote = (quotes: Quote[], selectionKey: string | null): Quote | null =>
  quotes.find(quote => getQuoteSelectionKey(quote) === selectionKey) ?? quotes[0] ?? null

export class CrossChainSwapAdapterRegistry {
  private adapters: Map<string, SwapProvider> = new Map()

  registerAdapter(adapter: SwapProvider): void {
    this.adapters.set(normalizeAdapterName(adapter.getName()), adapter)

    for (const alias of adapter.getAliases?.() ?? []) {
      this.adapters.set(normalizeAdapterName(alias.name), adapter)
    }
  }

  getAdapter(name?: string): SwapProvider | undefined {
    if (!name) return undefined
    return this.adapters.get(normalizeAdapterName(name))
  }

  getQuoteAdapter(name: string): QuoteProvider | undefined {
    const adapter = this.getAdapter(name)
    if (
      adapter &&
      'getQuote' in adapter &&
      typeof adapter.getQuote === 'function' &&
      'getSupportedChains' in adapter &&
      typeof adapter.getSupportedChains === 'function'
    ) {
      return adapter as QuoteProvider
    }
    return undefined
  }

  getAllAdapters(): SwapProvider[] {
    return Array.from(new Set(this.adapters.values()))
  }
}
