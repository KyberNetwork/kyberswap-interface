export type WalletType = 'xverse' | 'okx' | 'unisat' | 'fordefi' | 'bitget' | 'ledger'

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
  // Silent session re-hydration on mount: reads already-authorized accounts WITHOUT prompting. Only
  // implemented for wallets that expose a non-prompting get-accounts API; wallets whose only entry is a
  // prompting connect() (OKX, Xverse) omit it so auto-restore never pops an approval dialog.
  restore?: () => Promise<void>
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

export interface CreateProviderParams {
  connectingWallet: string | null
  setConnectingWallet: (wallet: WalletType | null) => void
  setWalletInfo: (info: WalletInfo) => void
  defaultInfo: WalletInfo
}
