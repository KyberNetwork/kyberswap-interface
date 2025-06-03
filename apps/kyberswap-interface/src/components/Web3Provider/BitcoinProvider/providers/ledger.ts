import { BitcoinWalletBase, CreateProviderParams, SendBitcoinParams } from '../types'
//import { getAppAndVersion } from '@ledgerhq/hw-app-btc/getAppAndVersion'
import Btc from '@ledgerhq/hw-app-btc'
import * as Transport from '@ledgerhq/hw-transport'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'

function getFormat(derivationPath: string) {
  return derivationPath.startsWith("m/84'") || derivationPath.startsWith("m/86'")
    ? 'bech32' // Native SegWit
    : derivationPath.startsWith("m/49'")
    ? 'p2sh' // P2SH-SegWit
    : 'legacy' // P2PKH
}

// Store transport globally to reuse
let transport: TransportWebUSB | null = null

const path = "m/84'/0'/0'/0/0"

export const createLedgerProvider = ({
  connectingWallet,
  setConnectingWallet,
  setWalletInfo,
  defaultInfo,
}: CreateProviderParams): BitcoinWalletBase => ({
  name: 'Ledger',
  logo: 'https://storage.googleapis.com/ks-setting-1d682dca/d8d5850d-adf9-4ec3-904b-33830f6b25bd1748936729072.png',
  type: 'ledger' as const,
  isInstalled: () => false,
  connect: async () => {
    try {
      if (!!connectingWallet) return

      setConnectingWallet('ledger')

      if (transport) {
        try {
          await transport.close()
        } catch (e) {
          console.warn('Error closing transport:', e)
        }
        transport = null
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      await TransportWebUSB.request()
      transport = (await TransportWebUSB.create(undefined, 5_000)) as TransportWebUSB
      transport.setExchangeTimeout(30000)
      await transport.send(0xb0, 0x01, 0x00, 0x00)

      const btcApp = new Btc({
        transport: transport as unknown as Transport.default,
        currency: 'bitcoin',
      })
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
      console.log(error)
      setConnectingWallet(null)
    }
  },
  disconnect: async () => {
    if (transport) {
      try {
        await transport.close()
      } catch (error) {
        console.error('Error closing transport:', error)
      }
      transport = null
    }
    localStorage.removeItem('bitcoinWallet')
    setWalletInfo(defaultInfo)
  },

  sendBitcoin: async ({ sender, recipient, amount, options }: SendBitcoinParams) => {
    console.log(`Sending Bitcoin from ${sender} to ${recipient} with amount: ${amount} and options:`, options)
    throw new Error('Not implemented yet')
  },
})
