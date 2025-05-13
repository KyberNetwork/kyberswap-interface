import { NearQuoteParams, NormalizedQuote, QuoteParams, SwapProvider } from './adapters'

export interface Quote {
  adapter: SwapProvider
  quote: NormalizedQuote
}

export class CrossChainSwapAdapterRegistry {
  private adapters: Map<string, SwapProvider> = new Map()

  registerAdapter(adapter: SwapProvider): void {
    this.adapters.set(adapter.getName().toLowerCase(), adapter)
  }

  getAdapter(name: string): SwapProvider | undefined {
    return this.adapters.get(name.toLowerCase())
  }

  getAllAdapters(): SwapProvider[] {
    return Array.from(this.adapters.values())
  }

  // get quotes from all adapters and sort them by output amount
  async getQuotes(params: QuoteParams | NearQuoteParams): Promise<Quote[]> {
    const quotes: { adapter: SwapProvider; quote: NormalizedQuote }[] = []

    const adapters = this.getAllAdapters().filter(
      adapter =>
        adapter.getSupportedChains().includes(params.fromChain) &&
        adapter.getSupportedChains().includes(params.toChain),
    )
    console.debug(
      'Available adapters',
      adapters.map(ad => ad.getName()),
    )
    // Get quotes from all compatible adapters
    const quotePromises = adapters.map(async adapter => {
      try {
        const quote = await adapter.getQuote(params)
        quotes.push({ adapter, quote })
      } catch (err) {
        console.error(`Failed to get quote from ${adapter.getName()}:`, err)
      }
    })

    await Promise.all(quotePromises)

    if (quotes.length === 0) {
      throw new Error('No valid quotes found for the requested swap')
    }

    quotes.sort((a, b) => (a.quote.outputAmount < b.quote.outputAmount ? 1 : -1))
    return quotes
  }
}
