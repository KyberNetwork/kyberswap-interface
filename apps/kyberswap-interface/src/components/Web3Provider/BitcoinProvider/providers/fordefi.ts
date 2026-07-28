import { BitcoinWalletBase, CreateProviderParams, SendBitcoinParams } from '../types'

const getFordefiUnisatProvider = () => window.FordefiProviders?.UtxoProvider?.unisatProvider

export const createFordefiProvider = ({
  connectingWallet,
  setConnectingWallet,
  setWalletInfo,
  defaultInfo,
}: CreateProviderParams): BitcoinWalletBase => {
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      setWalletInfo(defaultInfo)
      localStorage.removeItem('bitcoinWallet')
    } else {
      try {
        const provider = getFordefiUnisatProvider()
        const publicKey = await provider?.getPublicKey()
        setWalletInfo({
          isConnected: true,
          address: accounts[0],
          publicKey,
          walletType: 'fordefi',
        })
      } catch (error) {
        console.log('Error updating Fordefi wallet info after account change:', error)
      }
    }
  }

  const handleDisconnect = () => {
    setWalletInfo(defaultInfo)
    localStorage.removeItem('bitcoinWallet')
  }

  const setupEventListeners = () => {
    const provider = getFordefiUnisatProvider()
    provider?.on?.('accountsChanged', handleAccountsChanged)
    provider?.on?.('disconnect', handleDisconnect)
  }

  const removeEventListeners = () => {
    const provider = getFordefiUnisatProvider()
    provider?.removeListener?.('accountsChanged', handleAccountsChanged)
    provider?.removeListener?.('disconnect', handleDisconnect)
  }

  return {
    name: 'Fordefi',
    logo: 'https://storage.googleapis.com/ks-setting-1d682dca/5b0d4c33-2378-4f4b-9c5b-a7791b08b1af1780471044959.png',
    type: 'fordefi' as const,
    isInstalled: () => !!getFordefiUnisatProvider(),
    connect: async () => {
      const provider = getFordefiUnisatProvider()
      if (!provider) {
        window.open('https://www.fordefi.com/', '_blank')
        return
      }
      if (!!connectingWallet) {
        return
      }
      setConnectingWallet('fordefi')
      const currentNetwork = await provider.getNetwork()
      if (currentNetwork !== 'livenet') {
        await provider.switchNetwork('livenet')
      }
      const [accounts, publicKey] = await Promise.all([provider.requestAccounts(), provider.getPublicKey()])

      setWalletInfo({
        isConnected: true,
        address: accounts[0],
        publicKey,
        walletType: 'fordefi',
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
      return await getFordefiUnisatProvider()?.sendBitcoin(recipient, Number(amount), options)
    },
  }
}
