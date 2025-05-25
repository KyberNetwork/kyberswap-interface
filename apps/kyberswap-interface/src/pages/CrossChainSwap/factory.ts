import {
  AcrossAdapter,
  DeBridgeAdapter,
  KyberSwapAdapter,
  LifiAdapter,
  MayanAdapter,
  RelayAdapter,
  SwapProvider,
  SymbiosisAdapter,
  XYFinanceAdapter,
} from './adapters'
import { NearIntentsAdapter } from './adapters/NearIntentsAdapter'
import { OptimexAdapter } from './adapters/OptimexAdapter'

// Factory for creating swap provider instances
export class CrossChainSwapFactory {
  // Singleton instances (lazy loaded)
  private static acrossInstance: AcrossAdapter
  private static relayInstance: RelayAdapter
  private static xyFinanceInstance: XYFinanceAdapter
  private static nearIntentsInstance: NearIntentsAdapter
  private static mayanInstance: MayanAdapter
  private static symbiosisInstance: SymbiosisAdapter
  private static debridgeInstance: DeBridgeAdapter
  private static lifiInstance: LifiAdapter
  private static optimexInstance: OptimexAdapter
  private static ksInstance: KyberSwapAdapter

  // Get or create Across adapter
  static getAcrossAdapter(): AcrossAdapter {
    if (!CrossChainSwapFactory.acrossInstance) {
      CrossChainSwapFactory.acrossInstance = new AcrossAdapter()
    }
    return CrossChainSwapFactory.acrossInstance
  }

  // Get or create Relay adapter
  static getRelayAdapter(): RelayAdapter {
    if (!CrossChainSwapFactory.relayInstance) {
      CrossChainSwapFactory.relayInstance = new RelayAdapter()
    }
    return CrossChainSwapFactory.relayInstance
  }

  static getXyFinanceAdapter(): XYFinanceAdapter {
    if (!CrossChainSwapFactory.xyFinanceInstance) {
      CrossChainSwapFactory.xyFinanceInstance = new XYFinanceAdapter()
    }
    return CrossChainSwapFactory.xyFinanceInstance
  }

  static getNearIntentsAdapter(): NearIntentsAdapter {
    if (!CrossChainSwapFactory.nearIntentsInstance) {
      CrossChainSwapFactory.nearIntentsInstance = new NearIntentsAdapter()
    }
    return CrossChainSwapFactory.nearIntentsInstance
  }

  static getMayanAdapter(): MayanAdapter {
    if (!CrossChainSwapFactory.mayanInstance) {
      CrossChainSwapFactory.mayanInstance = new MayanAdapter()
    }
    return CrossChainSwapFactory.mayanInstance
  }

  static getSymbiosisAdapter(): SymbiosisAdapter {
    if (!CrossChainSwapFactory.symbiosisInstance) {
      CrossChainSwapFactory.symbiosisInstance = new SymbiosisAdapter()
    }
    return CrossChainSwapFactory.symbiosisInstance
  }

  static getDebridgeInstance(): DeBridgeAdapter {
    if (!CrossChainSwapFactory.debridgeInstance) {
      CrossChainSwapFactory.debridgeInstance = new DeBridgeAdapter()
    }
    return CrossChainSwapFactory.debridgeInstance
  }

  static getLifiInstance(): LifiAdapter {
    if (!CrossChainSwapFactory.lifiInstance) {
      CrossChainSwapFactory.lifiInstance = new LifiAdapter()
    }
    return CrossChainSwapFactory.lifiInstance
  }

  static getOptimexAdapter(): OptimexAdapter {
    if (!CrossChainSwapFactory.optimexInstance) {
      CrossChainSwapFactory.optimexInstance = new OptimexAdapter()
    }
    return CrossChainSwapFactory.optimexInstance
  }

  static getKsApdater(): KyberSwapAdapter {
    if (!CrossChainSwapFactory.ksInstance) {
      CrossChainSwapFactory.ksInstance = new KyberSwapAdapter()
    }
    return CrossChainSwapFactory.ksInstance
  }

  // Get all registered adapters
  static getAllAdapters(): SwapProvider[] {
    return [
      CrossChainSwapFactory.getAcrossAdapter(),
      CrossChainSwapFactory.getRelayAdapter(),
      CrossChainSwapFactory.getXyFinanceAdapter(),
      CrossChainSwapFactory.getNearIntentsAdapter(),
      CrossChainSwapFactory.getMayanAdapter(),
      // TODO: disable symbiosis for now becasue they didnt support charge fee by api params yet
      // CrossChainSwapFactory.getSymbiosisAdapter(),
      CrossChainSwapFactory.getDebridgeInstance(),
      CrossChainSwapFactory.getLifiInstance(),
      // CrossChainSwapFactory.getOptimexAdapter(),
      CrossChainSwapFactory.getKsApdater(),
    ]
  }

  // Get adapter by name
  static getAdapterByName(name: string): SwapProvider | undefined {
    switch (name.toLowerCase()) {
      case 'across':
        return CrossChainSwapFactory.getAcrossAdapter()
      case 'relay':
        return CrossChainSwapFactory.getRelayAdapter()
      case 'xyfinance':
        return CrossChainSwapFactory.getXyFinanceAdapter()
      case 'near intents':
        return CrossChainSwapFactory.getNearIntentsAdapter()
      case 'mayan':
        return CrossChainSwapFactory.getMayanAdapter()
      case 'symbiosis':
        return CrossChainSwapFactory.getSymbiosisAdapter()
      case 'debridge':
        return CrossChainSwapFactory.getDebridgeInstance()
      case 'lifi':
        return CrossChainSwapFactory.getLifiInstance()
      case 'optimex':
        return CrossChainSwapFactory.getOptimexAdapter()
      case 'kyberswap':
        return CrossChainSwapFactory.getKsApdater()
      default:
        return undefined
    }
  }
}
