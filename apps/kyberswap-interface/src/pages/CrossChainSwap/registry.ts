import type { NormalizedQuote, SwapProvider } from 'pages/CrossChainSwap/adapters'
import { normalizeAdapterName } from 'pages/CrossChainSwap/utils'

export interface Quote {
  adapter: SwapProvider
  quote: NormalizedQuote
  isReadOnly: boolean
}

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

  getAllAdapters(): SwapProvider[] {
    return Array.from(new Set(this.adapters.values()))
  }
}
