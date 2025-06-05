import { APP_PATHS } from 'constants/index'
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'
import { BitcoinWalletBase, CreateProviderParams, WalletInfo, WalletType } from './types'
import { createXverseProvider } from './providers/xverse'
import { createOkxProvider } from './providers/okx'
import { createUnisatProvider } from './providers/unisat'
import { createLedgerProvider } from './providers/ledger'

// Context value interface
interface BitcoinWalletContextValue {
  walletInfo: WalletInfo
  availableWallets: BitcoinWalletBase[]
  connectingWallet: WalletType | null
  setConnectingWallet: (walletType: WalletType | null) => void
  balance: number
  getBalance: () => Promise<void>
}

const BitcoinWalletContext = createContext<BitcoinWalletContextValue | null>(null)

const defaultInfo = {
  isConnected: false,
  address: null,
  publicKey: null,
  walletType: null,
}

export const BitcoinWalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>(defaultInfo)
  const [connectingWallet, setConnectingWallet] = useState<WalletType | null>(null)

  const [availableWallets, setAvailableWallets] = useState<BitcoinWalletBase[]>([])

  const { address, walletType } = walletInfo

  useEffect(() => {
    if (walletType && walletType !== 'ledger') localStorage.setItem('bitcoinWallet', walletType || '')
  }, [walletType])

  const [balance, setBalance] = useState<number>(0)
  const getBalance = useCallback(async () => {
    if (!address) return
    const res = await fetch(`https://api.blockchain.info/haskoin-store/btc/address/${address}/balance`).then(res =>
      res.json(),
    )
    setBalance(res.confirmed || 0)
  }, [address])

  useEffect(() => {
    getBalance()
    const interval = setInterval(() => {
      getBalance()
    }, 20000) // Update balance every 20 seconds

    return () => clearInterval(interval)
  }, [getBalance])

  // Check for available wallet providers
  useEffect(() => {
    const checkWalletProviders = () => {
      const createProviderPrams: CreateProviderParams = {
        connectingWallet,
        setConnectingWallet,
        setWalletInfo,
        defaultInfo,
      }
      const enhanceProvider = (provider: BitcoinWalletBase): BitcoinWalletBase => ({
        ...provider,
        disconnect: async () => {
          await provider.disconnect?.()
          setBalance(0)
        },
      })
      const providers: BitcoinWalletBase[] = []
      const xverseProvider = enhanceProvider(createXverseProvider(createProviderPrams))
      const okxProvider = enhanceProvider(createOkxProvider(createProviderPrams))
      const unisatProvider = enhanceProvider(createUnisatProvider(createProviderPrams))
      // const bitgetProvider = enhanceProvider(createBitgetProvider(createProviderPrams))
      const ledgerProvider = enhanceProvider(createLedgerProvider(createProviderPrams))

      providers.push(xverseProvider)
      // providers.push(bitgetProvider)
      providers.push(okxProvider)
      providers.push(unisatProvider)
      providers.push(ledgerProvider)

      if (window.location.pathname === APP_PATHS.CROSS_CHAIN) {
        const lastConnectedWallet = localStorage.getItem('bitcoinWallet')
        providers
          .find(wallet => wallet.type === lastConnectedWallet)
          ?.connect()
          .catch(() => {
            localStorage.removeItem('bitcoinWallet')
            setConnectingWallet(null)
          })
      }

      providers.sort(a => (a.isInstalled() ? -1 : 1))
      setAvailableWallets(providers)
    }

    checkWalletProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <BitcoinWalletContext.Provider
      value={{
        walletInfo,
        availableWallets,
        connectingWallet,
        setConnectingWallet,
        balance,
        getBalance,
      }}
    >
      {children}
    </BitcoinWalletContext.Provider>
  )
}

export const useBitcoinWallet = () => {
  const context = useContext(BitcoinWalletContext)
  if (!context) {
    throw new Error('useBitcoinWallet must be used within a BitcoinWalletProvider')
  }
  return context
}
