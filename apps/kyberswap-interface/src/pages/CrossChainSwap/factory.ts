import {
  AcrossAdapter,
  DeBridgeAdapter,
  KyberAcrossAdapter,
  KyberCrossAdapter,
  KyberSwapAdapter,
  LifiAdapter,
  MayanAdapter,
  RelayAdapter,
  SwapProvider,
  SymbiosisAdapter,
  XYFinanceAdapter,
} from './adapters'
import { BungeeAdapter } from './adapters/BungeeAdapter'
import { NearIntentsAdapter } from './adapters/NearIntentsAdapter'
import { OptimexAdapter } from './adapters/OptimexAdapter'
import { OrbiterAdapter } from './adapters/OrbiterAdapter'
import { ENABLE_CROSS_CHAIN_STREAM_API, normalizeAdapterName } from './utils'

// Factory for creating swap provider instances
export class CrossChainSwapFactory {
  private static adapterCreators = {
    across: () => new AcrossAdapter(),
    relay: () => new RelayAdapter(),
    xyfinance: () => new XYFinanceAdapter(),
    nearintents: () => new NearIntentsAdapter(),
    mayan: () => new MayanAdapter(),
    symbiosis: () => new SymbiosisAdapter(),
    debridge: () => new DeBridgeAdapter(),
    lifi: () => new LifiAdapter(),
    optimex: () => new OptimexAdapter(),
    kyberswap: () => new KyberSwapAdapter(),
    orbiter: () => new OrbiterAdapter(),
    bungee: () => new BungeeAdapter(),
    kyberacross: () => new KyberAcrossAdapter(),
    kybercross: () => new KyberCrossAdapter(CrossChainSwapFactory.getAdapterByName),
  }

  private static adapters = new Map<string, SwapProvider>()

  private static getAdapterCreator(name?: string): (() => SwapProvider) | undefined {
    const key = normalizeAdapterName(name)

    if (!Object.prototype.hasOwnProperty.call(CrossChainSwapFactory.adapterCreators, key)) return undefined

    return CrossChainSwapFactory.adapterCreators[key as keyof typeof CrossChainSwapFactory.adapterCreators]
  }

  private static getOrCreateAdapter(name: string): SwapProvider {
    const key = normalizeAdapterName(name)
    const createAdapter = CrossChainSwapFactory.getAdapterCreator(key)

    if (!createAdapter) {
      throw new Error(`Unsupported cross-chain adapter: ${name}`)
    }

    let adapter = CrossChainSwapFactory.adapters.get(key)

    if (!adapter) {
      adapter = createAdapter()
      CrossChainSwapFactory.adapters.set(key, adapter)
    }

    return adapter
  }

  static getKyberCrossBridgeSources(): SwapProvider[] {
    return [
      CrossChainSwapFactory.getOrCreateAdapter('across'),
      CrossChainSwapFactory.getOrCreateAdapter('relay'),
      CrossChainSwapFactory.getOrCreateAdapter('nearintents'),
      CrossChainSwapFactory.getOrCreateAdapter('mayan'),
    ]
  }

  static getSelectableSources(): SwapProvider[] {
    if (!ENABLE_CROSS_CHAIN_STREAM_API) {
      return CrossChainSwapFactory.getKyberCrossBridgeSources()
    }

    return CrossChainSwapFactory.getAllAdapters()
  }

  // Direct client quote adapters. When stream is disabled, KyberCross owns quote routing.
  static getClientQuoteAdapters(): SwapProvider[] {
    if (!ENABLE_CROSS_CHAIN_STREAM_API) {
      return [CrossChainSwapFactory.getOrCreateAdapter('kybercross')]
    }

    return CrossChainSwapFactory.getAllAdapters()
  }

  // Registry/status lookup needs every active adapter, even when quotes only use KyberCross.
  static getAllAdapters(): SwapProvider[] {
    return [
      CrossChainSwapFactory.getOrCreateAdapter('across'),
      CrossChainSwapFactory.getOrCreateAdapter('relay'),
      // CrossChainSwapFactory.getOrCreateAdapter('xyfinance'),
      CrossChainSwapFactory.getOrCreateAdapter('nearintents'),
      CrossChainSwapFactory.getOrCreateAdapter('mayan'),
      CrossChainSwapFactory.getOrCreateAdapter('symbiosis'),
      CrossChainSwapFactory.getOrCreateAdapter('debridge'),
      CrossChainSwapFactory.getOrCreateAdapter('lifi'),
      // CrossChainSwapFactory.getOrCreateAdapter('optimex'),
      CrossChainSwapFactory.getOrCreateAdapter('kyberswap'),
      // CrossChainSwapFactory.getOrCreateAdapter('orbiter'),
      CrossChainSwapFactory.getOrCreateAdapter('bungee'),
      CrossChainSwapFactory.getOrCreateAdapter('kyberacross'),
      CrossChainSwapFactory.getOrCreateAdapter('kybercross'),
    ]
  }

  // Get adapter by name
  static getAdapterByName(name?: string): SwapProvider | undefined {
    if (!name || !CrossChainSwapFactory.getAdapterCreator(name)) return undefined

    return CrossChainSwapFactory.getOrCreateAdapter(name)
  }
}
