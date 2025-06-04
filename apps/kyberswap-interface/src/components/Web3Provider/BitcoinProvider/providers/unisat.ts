import { BitcoinWalletBase, CreateProviderParams, SendBitcoinParams } from '../types'

export const createUnisatProvider = ({
  connectingWallet,
  setConnectingWallet,
  setWalletInfo,
  defaultInfo,
}: CreateProviderParams): BitcoinWalletBase => {
  // Function to handle account changes
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setWalletInfo(defaultInfo)
      localStorage.removeItem('bitcoinWallet')
    } else {
      // Account changed - update wallet info
      try {
        const publicKey = await window.unisat_wallet.getPublicKey()
        setWalletInfo({
          isConnected: true,
          address: accounts[0],
          publicKey,
          walletType: 'unisat',
        })
      } catch (error) {
        console.log('Error updating wallet info after account change:', error)
      }
    }
  } // Set up event listener when wallet is available
  const setupEventListeners = () => {
    if (window.unisat_wallet) {
      // Listen for account changes
      window.unisat_wallet.on?.('accountsChanged', handleAccountsChanged)

      // Listen for disconnect events (if available)
      window.unisat_wallet.on?.('disconnect', () => {
        setWalletInfo(defaultInfo)
        localStorage.removeItem('bitcoinWallet')
      })
    }
  }

  // Remove event listeners
  const removeEventListeners = () => {
    if (window.unisat_wallet) {
      window.unisat_wallet.removeListener?.('accountsChanged', handleAccountsChanged)
      window.unisat_wallet.removeListener?.('disconnect', () => {})
    }
  }
  return {
    name: 'Unisat Wallet',
    logo: 'https://storage.googleapis.com/ks-setting-1d682dca/d2d471f2-8a3c-4824-9166-39db073aec131747803667826.png',
    type: 'unisat' as const,
    isInstalled: () => !!window.unisat_wallet,
    connect: async () => {
      if (!window.unisat_wallet) {
        window.open(
          'https://chromewebstore.google.com/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo?hl=en',
          '_blank',
        )
        return
      }
      if (!!connectingWallet) {
        return
      }
      setConnectingWallet('unisat')
      const currentNetwork = await window.unisat_wallet.getNetwork()
      if (currentNetwork !== 'livenet') {
        await window.unisat_wallet.switchNetwork('livenet')
      }
      const [accounts, publicKey] = await Promise.all([
        window.unisat_wallet.requestAccounts(),
        window.unisat_wallet.getPublicKey(),
      ])

      setWalletInfo({
        isConnected: true,
        address: accounts[0],
        publicKey,
        walletType: 'unisat',
      })
      setConnectingWallet(null)
      setupEventListeners()
    },
    disconnect: async () => {
      removeEventListeners()
      localStorage.removeItem('bitcoinWallet')
      setWalletInfo(defaultInfo)
    },
    sendBitcoin: async ({ recipient, amount, options }: SendBitcoinParams) => {
      return await window?.unisat_wallet.sendBitcoin(recipient, Number(amount), options)
    },
  }
}
