import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'

import { APP_PATHS } from 'constants/index'

import { BitcoinConnection, createBitcoinConnection } from './connection'
import { BitcoinWalletBase, WalletInfo, WalletType } from './types'

// Context value interface
interface BitcoinWalletContextValue {
  connection?: BitcoinConnection
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

  const [connections, setConnections] = useState<BitcoinConnection[]>([])
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
      const sessions = (['xverse', 'okx', 'unisat', 'fordefi', 'ledger'] as const).map(type =>
        createBitcoinConnection(type, setConnectingWallet, setWalletInfo),
      )
      const providers = sessions.map(session => ({
        ...session.provider,
        disconnect: async () => {
          await session.provider.disconnect?.()
          setBalance(0)
        },
      }))
      setConnections(sessions)

      if (
        [APP_PATHS.SWAP, APP_PATHS.KYBER_CROSS, APP_PATHS.PARTNER_SWAP, APP_PATHS.USER_SWAP].some(path =>
          window.location.pathname.startsWith(path),
        )
      ) {
        // Re-hydrate the previously connected wallet via its SILENT restore() only — never connect(), which
        // pops the wallet's approval dialog. This effect re-runs whenever the route mounts, so calling
        // connect() here made wallets without a silent path (OKX, Xverse) prompt on every cross-chain visit.
        // Wallets that don't implement restore() are simply skipped.
        const lastConnectedWallet = localStorage.getItem('bitcoinWallet')
        providers
          .find(wallet => wallet.type === lastConnectedWallet)
          ?.restore?.()
          .catch(() => {
            localStorage.removeItem('bitcoinWallet')
            setConnectingWallet(null)
          })
      }

      providers.sort(a => (a.isInstalled() ? -1 : 1))
      setAvailableWallets(providers)
      return () =>
        sessions.forEach(session => {
          void session.dispose().catch(console.error)
        })
    }

    return checkWalletProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <BitcoinWalletContext.Provider
      value={{
        connection: connections.find(session => session.provider.type === walletType),
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
