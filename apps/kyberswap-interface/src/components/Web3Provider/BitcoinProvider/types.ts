export type WalletType = 'xverse' | 'okx' | 'unisat' | 'bitget' | 'ledger'

export interface SendBitcoinParams {
  sender?: string // required for ledger
  recipient: string
  amount: number | string
  options?: { feeRate?: number }
}

export interface BitcoinWalletBase {
  name: string
  logo: string
  type: WalletType
  connect: (path?: string) => Promise<void>
  disconnect?: () => Promise<void>
  sendBitcoin: ({ recipient, amount }: SendBitcoinParams) => Promise<string>
  isInstalled: () => boolean
}

export interface AddressResponse {
  address: string
  publicKey: string
  purpose: 'payment' | 'ordinals'
}

export interface WalletInfo {
  isConnected: boolean
  address: string | null
  publicKey: string | null
  walletType: WalletType | null
}

export interface BitcoinWalletContextValue {
  walletInfo: WalletInfo
  availableWallets: BitcoinWalletBase[]
  connectingWallet: WalletType | null
  setConnectingWallet: (walletType: WalletType | null) => void
  balance: number
  getBalance: () => Promise<void>
}

export interface CreateProviderParams {
  connectingWallet: string | null
  setConnectingWallet: (wallet: WalletType | null) => void
  setWalletInfo: (info: WalletInfo) => void
  defaultInfo: WalletInfo
}
