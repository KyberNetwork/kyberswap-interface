/// <reference types="react-scripts" />

interface Navigator {
  brave?: {
    isBrave: () => Promise<boolean | undefined>
  }
}
interface Window {
  ethereum?: {
    isMetaMask?: boolean
    isCoin98?: boolean
    isBraveWallet?: any
    isPhantom?: boolean
    isCoinbaseWallet?: boolean
    isTrust?: boolean
    isTrustWallet?: boolean
    isRabby?: boolean
    isLedgerConnect?: boolean
    isKrystal?: boolean
    isKrystalWallet?: boolean
    isZerion?: boolean
    on?: (...args: any[]) => void
    removeListener?: (...args: any[]) => void
    request: (params: { method: string; params?: any }) => Promise<any>
    selectedProvider?: {
      isCoinbaseBrowser: boolean
      isCoinbaseWallet: boolean
      isMetaMask: boolean
      close?: () => void
    }
    providers?: any[]
    autoRefreshOnNetworkChange?: boolean
  }
  web3?: {
    currentProvider?: {
      isCoinbaseBrowser: boolean
      isCoinbaseWallet: boolean
    }
  }
  tag?: string
  coin98?: any
  okxwallet?: any
  unisat_wallet?: any
  phantom?: any
  rabby?: any
  coinbaseWalletExtension?: any
  dataLayer?: any[]
  chrome?: any
  opr?: any
  zESettings?: any

  XverseProviders?: { BitcoinProvider: any }
  bitkeep?: any
}
