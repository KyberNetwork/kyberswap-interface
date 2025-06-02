import { AddressResponse, BitcoinWalletBase, CreateProviderParams } from '../types'

export const createXverseProvider = ({
  connectingWallet,
  setConnectingWallet,
  setWalletInfo,
  defaultInfo,
}: CreateProviderParams): BitcoinWalletBase => ({
  name: 'Xverse',
  logo: 'https://storage.googleapis.com/ks-setting-1d682dca/15c4bbc4-920a-47dd-a29d-b5fa1277797d1747030204965.png',
  type: 'xverse' as const,
  isInstalled: () => !!window?.XverseProviders,
  connect: async () => {
    if (!window?.XverseProviders) {
      window.open(
        'https://chromewebstore.google.com/detail/xverse-bitcoin-crypto-wal/idnnbdplmphpflfnlkomgpfbpcgelopg',
        '_blank',
      )
      return
    }
    if (connectingWallet !== null) {
      return
    }

    setConnectingWallet('xverse')
    const permissionRes = await window.XverseProviders.BitcoinProvider.request('wallet_requestPermissions')
    if (permissionRes.error) {
      setConnectingWallet(null)
      setWalletInfo(defaultInfo)
      throw new Error(permissionRes.error)
    }

    const response = await window.XverseProviders.BitcoinProvider.request('getAddresses', {
      purposes: ['payment'],
      message: 'Connect to KyberSwap.com',
    })
    if (response.error) {
      setConnectingWallet(null)
      setWalletInfo(defaultInfo)
      throw new Error(response.error)
    }
    const address = response.result.addresses.find((addr: AddressResponse) => addr.purpose === 'payment')
    if (!address) {
      setConnectingWallet(null)
      setWalletInfo(defaultInfo)
      throw new Error('No address found')
    }

    setWalletInfo({
      isConnected: true,
      address: address.address,
      publicKey: address.publicKey,
      walletType: 'xverse',
    })
  },
  disconnect: async () => {
    localStorage.removeItem('bitcoinWallet')
    await window?.XverseProviders?.BitcoinProvider.request('wallet_renouncePermissions')
    setWalletInfo(defaultInfo)
  },
  sendBitcoin: async ({ recipient, amount }: { recipient: string; amount: number | string }) => {
    const response = await window?.XverseProviders?.BitcoinProvider.request('sendTransfer', {
      recipients: [
        {
          address: recipient,
          amount: Number(amount),
        },
      ],
    }).catch((err: any) => {
      throw new Error(err.message)
    })
    if (response.result?.txid) {
      return response.result.txid
    }

    throw new Error(response?.error?.message || 'No transaction ID received')
  },
})
