import { BitcoinWalletBase, CreateProviderParams, SendBitcoinParams } from '../types'
import Btc from '@ledgerhq/hw-app-btc'
// import { getAppAndVersion } from '@ledgerhq/hw-app-btc/getAppAndVersion'
import * as Transport from '@ledgerhq/hw-transport'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'

function getFormat(derivationPath: string) {
  return derivationPath.startsWith("m/84'") || derivationPath.startsWith("m/86'")
    ? 'bech32' // Native SegWit
    : derivationPath.startsWith("m/49'")
    ? 'p2sh' // P2SH-SegWit
    : 'legacy' // P2PKH
}

export const createLedgerProvider = ({
  connectingWallet,
  setConnectingWallet,
  setWalletInfo,
  defaultInfo,
}: CreateProviderParams): BitcoinWalletBase => ({
  name: 'Ledger',
  logo: 'https://www.ledger.com/wp-content/themes/ledger-v2/public/images/ledger-logo-long.svg',
  type: 'ledger' as const,
  isInstalled: () => false,
  connect: async () => {
    try {
      if (!!connectingWallet) return

      setConnectingWallet('ledger')
      await TransportWebUSB.request()
      const transport = (await TransportWebUSB.create(undefined, 5_000)) as TransportWebUSB
      transport.setExchangeTimeout(30000)
      await transport.send(0xb0, 0x01, 0x00, 0x00)

      const btcApp = new Btc({
        transport: transport as unknown as Transport.default,
        currency: 'bitcoin',
      })
      const path = "m/84'/0'/0'/0/0"
      const result = await btcApp.getWalletPublicKey(path, {
        format: getFormat(path),
      })
      const address = result.bitcoinAddress
      const compressedPublicKey = result.publicKey

      setWalletInfo({
        isConnected: true,
        address,
        publicKey: compressedPublicKey,
        walletType: 'ledger',
      })
      setConnectingWallet(null)
    } catch (error) {
      setConnectingWallet(null)
    }
  },
  disconnect: async () => {
    localStorage.removeItem('bitcoinWallet')
    setWalletInfo(defaultInfo)
  },
  sendBitcoin: async ({ recipient, amount, options }: SendBitcoinParams) => {
    return await window?.unisat_wallet.sendBitcoin(recipient, amount.toString(), options)
  },
})
