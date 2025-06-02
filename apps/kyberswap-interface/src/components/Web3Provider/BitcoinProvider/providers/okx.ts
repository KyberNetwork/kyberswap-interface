import { BitcoinWalletBase, CreateProviderParams, SendBitcoinParams } from '../types'

const isOkxInstalled = () => typeof window !== 'undefined' && 'okxwallet' in window && window.okxwallet !== undefined

export const createOkxProvider = ({
  connectingWallet,
  setConnectingWallet,
  setWalletInfo,
  defaultInfo,
}: CreateProviderParams): BitcoinWalletBase => ({
  name: 'OKX Wallet',
  logo: 'https://storage.googleapis.com/ks-setting-1d682dca/77e2b120-4456-4181-b621-f2bbc590689d1747713432378.png',
  type: 'okx' as const,
  isInstalled: () => isOkxInstalled(),
  connect: async () => {
    try {
      if (!isOkxInstalled()) {
        window.open('https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge', '_blank')
        return
      }
      if (!!connectingWallet) {
        return
      }
      setConnectingWallet('okx')
      let resp = await window.okxwallet.bitcoin.connect()
      // sometime okx return null => throw error => user try again => always failed.
      // => call disconnect && connect again will resolve
      if (resp === null) await window.okxwallet.bitcoin.disconnect?.()
      resp = await window.okxwallet.bitcoin.connect()

      const { address, compressedPublicKey } = resp
      setWalletInfo({
        isConnected: true,
        address,
        publicKey: compressedPublicKey,
        walletType: 'okx',
      })
      setConnectingWallet(null)
    } catch (e) {
      console.log('okx connect error', e)
      setConnectingWallet
    }
  },
  disconnect: async () => {
    await window.okxwallet.bitcoin.disconnect?.()
    localStorage.removeItem('bitcoinWallet')
    setWalletInfo(defaultInfo)
  },
  sendBitcoin: async ({ recipient, amount, options }: SendBitcoinParams) => {
    return await window.okxwallet.bitcoin.sendBitcoin(recipient, Number(amount), options)
  },
})
