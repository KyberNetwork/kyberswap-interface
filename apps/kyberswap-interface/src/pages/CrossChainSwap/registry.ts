import { NormalizedQuote, SwapProvider } from './adapters'
import { normalizeAdapterName } from './utils'

export interface Quote {
  adapter: SwapProvider
  quote: NormalizedQuote
}

export class CrossChainSwapAdapterRegistry {
  private adapters: Map<string, SwapProvider> = new Map()

  registerAdapter(adapter: SwapProvider): void {
    this.adapters.set(normalizeAdapterName(adapter.getName()), adapter)
  }

  getAdapter(name?: string): SwapProvider | undefined {
    if (!name) return undefined
    return this.adapters.get(normalizeAdapterName(name))
  }

  getAllAdapters(): SwapProvider[] {
    return Array.from(this.adapters.values())
  }
}
