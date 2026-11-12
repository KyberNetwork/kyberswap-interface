import { createFordefiProvider } from 'components/Web3Provider/BitcoinProvider/providers/fordefi'
import { createLedgerProvider } from 'components/Web3Provider/BitcoinProvider/providers/ledger'
import { createOkxProvider } from 'components/Web3Provider/BitcoinProvider/providers/okx'
import { createUnisatProvider } from 'components/Web3Provider/BitcoinProvider/providers/unisat'
import { createXverseProvider } from 'components/Web3Provider/BitcoinProvider/providers/xverse'
import type { CreateProviderParams, WalletInfo } from 'components/Web3Provider/BitcoinProvider/types'

const factories = {
  xverse: createXverseProvider,
  okx: createOkxProvider,
  unisat: createUnisatProvider,
  fordefi: createFordefiProvider,
  ledger: createLedgerProvider,
}
export const EMPTY_BITCOIN_WALLET: WalletInfo = {
  address: null,
  publicKey: null,
  walletType: null,
  isConnected: false,
}

/** The instance owns both signing state (including Ledger transport/path) and live account updates. */
export const createBitcoinConnection = (
  type: keyof typeof factories,
  setConnectingWallet?: CreateProviderParams['setConnectingWallet'],
  onChange?: (info: WalletInfo) => void,
) => {
  let info = EMPTY_BITCOIN_WALLET
  const listeners = new Set<() => void>()
  let disposed = false
  const provider = factories[type]({
    connectingWallet: null,
    setConnectingWallet,
    defaultInfo: EMPTY_BITCOIN_WALLET,
    setWalletInfo: next => {
      if (disposed) return
      info = next
      onChange?.(next)
      listeners.forEach(listener => listener())
    },
  })
  return {
    provider,
    getInfo: () => info,
    dispose: async () => {
      if (disposed) return
      disposed = true
      listeners.clear()
      await provider.dispose?.()
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
export type BitcoinConnection = ReturnType<typeof createBitcoinConnection>
