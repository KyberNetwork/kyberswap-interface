import { RelayAdapter, AcrossAdapter, SwapProvider, XYFinanceAdapter } from './adapters'

// Factory for creating swap provider instances
export class CrossChainSwapFactory {
  // Singleton instances (lazy loaded)
  private static acrossInstance: AcrossAdapter
  private static relayInstance: RelayAdapter
  private static xyFinanceInstance: XYFinanceAdapter

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

  // Get all registered adapters
  static getAllAdapters(): SwapProvider[] {
    return [
      CrossChainSwapFactory.getAcrossAdapter(),
      CrossChainSwapFactory.getRelayAdapter(),
      CrossChainSwapFactory.getXyFinanceAdapter(),
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
      default:
        return undefined
    }
  }
}
