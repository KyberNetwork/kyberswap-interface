import { AcrossAdapter } from 'services/crossChain/adapters/AcrossAdapter'
import { BungeeAdapter } from 'services/crossChain/adapters/BungeeAdapter'
import { DeBridgeAdapter } from 'services/crossChain/adapters/DebridgeAdapter'
import { KyberCrossAdapter } from 'services/crossChain/adapters/KyberCrossAdapter'
import { KyberSwapAdapter } from 'services/crossChain/adapters/KyberSwapAdapter'
import { LifiAdapter } from 'services/crossChain/adapters/LifiAdapter'
import { MayanAdapter } from 'services/crossChain/adapters/MayanAdapter'
import { NearIntentsAdapter } from 'services/crossChain/adapters/NearIntentsAdapter'
import { RelayAdapter } from 'services/crossChain/adapters/RelayAdapter'
import { SymbiosisAdapter } from 'services/crossChain/adapters/SymbiosisAdapter'
import type { QuoteProvider, SwapProvider } from 'services/crossChain/adapters/types'
import { CrossChainSwapAdapterRegistry } from 'services/crossChain/registry'

import arbitrumIcon from 'assets/networks/arbitrum.svg'
import type { CrossChainQuoteMode } from 'state/crossChainSwap'

export type CrossChainSource = Pick<SwapProvider, 'getName'> & Partial<Pick<SwapProvider, 'getIcon' | 'canSupport'>>

const CCTP_ICON = 'https://cdn.prod.website-files.com/668c08d1b8a9330bd1d786ad/669a20df8ac2810a6dd50e67_favicon-256.svg'
const CCIP_ICON = 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png'
const ECO_ICON = 'https://cdn.prod.website-files.com/67af51ad91d062ee8ef52137/68ecc9d27b7aab7d9650a0f9_Favicon.svg'

const cctpV2Source: CrossChainSource = {
  getName: () => 'CCTP V2',
  getIcon: () => CCTP_ICON,
}

const cctpV2FastSource: CrossChainSource = {
  getName: () => 'CCTP V2 Fast',
  getIcon: () => CCTP_ICON,
}

const ccipSource: CrossChainSource = {
  getName: () => 'CCIP',
  getIcon: () => CCIP_ICON,
}

const ecoSource: CrossChainSource = {
  getName: () => 'Eco',
  getIcon: () => ECO_ICON,
}

const arbitrumBridgeSource: CrossChainSource = {
  getName: () => 'Arbitrum Bridge',
  getIcon: () => arbitrumIcon,
}

// Owns adapter instances; registry.ts owns name and legacy-alias lookup.
export class CrossChainSwapFactory {
  private static adapterCreators = {
    across: () => new AcrossAdapter(),
    relay: () => new RelayAdapter(),
    nearintents: () => new NearIntentsAdapter(),
    mayan: () => new MayanAdapter(),
    symbiosis: () => new SymbiosisAdapter(),
    debridge: () => new DeBridgeAdapter(),
    lifi: () => new LifiAdapter(),
    kyberswap: () => new KyberSwapAdapter(),
    socket: () => new BungeeAdapter(),
    kybercross: () => new KyberCrossAdapter(),
  }

  private static adapters = new Map<string, SwapProvider>()

  private static getOrCreateAdapter(name: keyof typeof CrossChainSwapFactory.adapterCreators): SwapProvider {
    let adapter = CrossChainSwapFactory.adapters.get(name)
    if (!adapter) {
      adapter = CrossChainSwapFactory.adapterCreators[name]()
      CrossChainSwapFactory.adapters.set(name, adapter)
    }
    return adapter
  }

  static getKyberCrossBridgeSources(): CrossChainSource[] {
    return [
      CrossChainSwapFactory.getOrCreateAdapter('across'),
      CrossChainSwapFactory.getOrCreateAdapter('relay'),
      CrossChainSwapFactory.getOrCreateAdapter('nearintents'),
      CrossChainSwapFactory.getOrCreateAdapter('mayan'),
      cctpV2Source,
      cctpV2FastSource,
      ccipSource,
      ecoSource,
      arbitrumBridgeSource,
    ]
  }

  static getSelectableSources(quoteMode: CrossChainQuoteMode): CrossChainSource[] {
    if (quoteMode === 'direct') {
      return CrossChainSwapFactory.getKyberCrossBridgeSources()
    }

    return CrossChainSwapFactory.getAllAdapters().filter(adapter => adapter.getName() !== 'KyberSwap')
  }

  // Direct client quote adapters. When stream is disabled, KyberCross owns quote routing.
  static getDirectQuoteAdapters(): QuoteProvider[] {
    const adapter = CrossChainSwapFactory.getOrCreateAdapter('kybercross')
    if (!(adapter instanceof KyberCrossAdapter)) throw new Error('Invalid KyberCross adapter')
    return [adapter]
  }

  // Registry/status lookup needs every active adapter, even when quotes only use KyberCross.
  static getAllAdapters(): SwapProvider[] {
    return [
      CrossChainSwapFactory.getOrCreateAdapter('across'),
      CrossChainSwapFactory.getOrCreateAdapter('relay'),
      CrossChainSwapFactory.getOrCreateAdapter('nearintents'),
      CrossChainSwapFactory.getOrCreateAdapter('mayan'),
      CrossChainSwapFactory.getOrCreateAdapter('symbiosis'),
      CrossChainSwapFactory.getOrCreateAdapter('debridge'),
      CrossChainSwapFactory.getOrCreateAdapter('lifi'),
      CrossChainSwapFactory.getOrCreateAdapter('kyberswap'),
      CrossChainSwapFactory.getOrCreateAdapter('socket'),
      CrossChainSwapFactory.getOrCreateAdapter('kybercross'),
    ]
  }
}

export const registry = new CrossChainSwapAdapterRegistry()
CrossChainSwapFactory.getAllAdapters().forEach(adapter => registry.registerAdapter(adapter))
