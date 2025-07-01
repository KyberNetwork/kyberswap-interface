import * as ecc from '@bitcoinerlab/secp256k1'
import Btc from '@ledgerhq/hw-app-btc'
import { getAppAndVersion } from '@ledgerhq/hw-app-btc/getAppAndVersion'
import { Transaction } from '@ledgerhq/hw-app-btc/lib/types'
import * as Transport from '@ledgerhq/hw-transport'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import * as bitcoin from 'bitcoinjs-lib'

import { BitcoinWalletBase, CreateProviderParams, SendBitcoinParams } from '../types'

// Initialize ECC library - this must be done before using bitcoinjs-lib
bitcoin.initEccLib(ecc)

function getFormat(derivationPath: string) {
  return derivationPath.startsWith("m/84'")
    ? 'bech32' // Native SegWit
    : derivationPath.startsWith("m/86'")
    ? 'bech32m'
    : derivationPath.startsWith("m/49'")
    ? 'p2sh' // P2SH-SegWit
    : 'legacy' // P2PKH
}

// Store transport globally to reuse
let transport: TransportWebUSB | null = null
let derivationPath: string | null = null

export const DerivationPaths = {
  'Native SegWit': "m/84'/0'/0'/0/0",
  Taproot: "m/86'/0'/0'/0/0",
  Legacy: "m/44'/0'/0'/0/0",
  'Nested SegWit': "m/49'/0'/0'/0/0", // P2SH-SegWit
}

// UTXO interface
interface UTXO {
  txid: string
  vout: number
  value: number // in satoshis
  scriptPubKey: string
  address: string
}

function amountToBuffer(amount: number): Buffer {
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64LE(BigInt(amount))
  return buffer
}

async function broadcastTransaction(txHex: string): Promise<string> {
  try {
    const response = await fetch('https://mempool.space/api/tx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: txHex,
    })

    if (!response.ok) {
      throw new Error(`Broadcast failed: ${response.statusText}`)
    }

    return await response.text() // Returns transaction ID
  } catch (error) {
    console.error('Error broadcasting transaction:', error)
    throw new Error('Failed to broadcast transaction')
  }
}

// Helper function to fetch UTXOs from a block explorer API
async function fetchUTXOs(address: string): Promise<UTXO[]> {
  try {
    // Using BlockCypher API as an example - you might want to use a different service
    const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}?unspentOnly=true`)
    const data = await response.json()

    if (!data.txrefs) return []

    return data.txrefs.map((utxo: any) => ({
      txid: utxo.tx_hash,
      vout: utxo.tx_output_n,
      value: utxo.value,
      scriptPubKey: '', // This would need to be fetched separately if needed
      address: address,
    }))
  } catch (error) {
    console.error('Error fetching UTXOs:', error)
    throw new Error('Failed to fetch UTXOs')
  }
}

// Helper function to calculate transaction size (approximate)
function estimateTransactionSize(inputCount: number, outputCount: number, addressType: string): number {
  let inputSize: number
  const outputSize = 34 // P2PKH output size

  switch (addressType) {
    case 'bech32':
      inputSize = 68 // Native SegWit input
      break
    case 'p2sh':
      inputSize = 91 // P2SH-SegWit input
      break
    default:
      inputSize = 148 // Legacy input
  }

  return 10 + inputCount * inputSize + outputCount * outputSize
}

// Helper function to get full transaction data
async function getTransactionData(txid: string): Promise<string> {
  try {
    const response = await fetch(`https://mempool.space/api/tx/${txid}/hex`)
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`)
    }
    return await response.text()
  } catch (error) {
    console.error('Error fetching transaction data:', error)
    throw new Error('Failed to fetch transaction data')
  }
}

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
  connect: async (path?: string) => {
    try {
      if (!path) throw new Error('Derivation path is required for Ledger connection')
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
      derivationPath = path

      setWalletInfo({
        isConnected: true,
        address,
        publicKey: compressedPublicKey,
        walletType: 'ledger',
      })
      setConnectingWallet(null)
    } catch (error) {
      setConnectingWallet(null)
      throw error
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
    derivationPath = null
  },

  sendBitcoin: async ({ sender, recipient, amount, options }: SendBitcoinParams) => {
    try {
      if (!transport || !sender || !derivationPath) {
        throw new Error('Ledger not connected. Please connect your device first.')
      }
      console.log(`Preparing to send ${amount} BTC from ${sender} to ${recipient}`)

      // Initialize Btc app
      const btcApp = new Btc({
        transport: transport as unknown as Transport.default,
        currency: 'bitcoin',
      })
      const utxos = await fetchUTXOs(sender)
      if (utxos.length === 0) {
        throw new Error('No UTXOs found for the sender address')
      }

      const feeRate = options?.feeRate || 5 // what should the default value be?
      // Select UTXOs for the transaction
      let totalInputValue = 0
      const selectedUtxos: UTXO[] = []
      // Simple UTXO selection: use UTXOs until we have enough to cover amount + fees
      const estimatedSize = estimateTransactionSize(
        utxos.length,
        2,
        getFormat(derivationPath || DerivationPaths['Native SegWit']),
      )
      const estimatedFee = Math.ceil(estimatedSize * feeRate)
      const totalNeeded = Number(amount) + estimatedFee
      for (const utxo of utxos) {
        selectedUtxos.push(utxo)
        totalInputValue += utxo.value

        if (totalInputValue >= totalNeeded) {
          break
        }
      }

      if (totalInputValue < totalNeeded) {
        throw new Error(`Insufficient funds. Need ${totalNeeded} satoshis, but only have ${totalInputValue} satoshis`)
      }

      // Calculate actual fee and change
      const actualSize = estimateTransactionSize(
        selectedUtxos.length,
        2,
        getFormat(derivationPath || DerivationPaths['Native SegWit']),
      )
      const actualFee = Math.ceil(actualSize * feeRate)
      const changeAmount = totalInputValue - Number(amount) - actualFee
      console.log(`Transaction details:`)
      console.log(`- Amount: ${amount} satoshis`)
      console.log(`- Fee: ${actualFee} satoshis`)
      console.log(`- Change: ${changeAmount} satoshis`)
      console.log(`- Total inputs: ${totalInputValue} satoshis`)

      const inputs: [Transaction, number, string | null | undefined, number | null | undefined][] = []

      const associatedKeysets = []
      const format = getFormat(derivationPath || DerivationPaths['Native SegWit'])

      for (const utxo of selectedUtxos) {
        const rawTx = await getTransactionData(utxo.txid)
        const tx = btcApp.splitTransaction(rawTx, format !== 'legacy', false)
        inputs.push([tx, utxo.vout, undefined, undefined])
        associatedKeysets.push(derivationPath)
      }

      const { version } = await getAppAndVersion(transport)
      const transaction = {
        version: Buffer.from(version),
        inputs: [],
        outputs: [
          {
            amount: amountToBuffer(+amount),
            script: Buffer.from(bitcoin.address.toOutputScript(recipient, bitcoin.networks.bitcoin)),
          },
        ],
      }

      if (changeAmount > 546) {
        transaction.outputs.push({
          amount: amountToBuffer(changeAmount),
          script: Buffer.from(bitcoin.address.toOutputScript(sender, bitcoin.networks.bitcoin)),
        })
      }

      const outputScriptHex = btcApp.serializeTransactionOutputs(transaction).toString('hex')

      const signedTx = await btcApp.createPaymentTransaction({
        inputs,
        associatedKeysets,
        outputScriptHex,
        additionals: format === 'bech32' ? ['bech32'] : [],
        segwit: format !== 'legacy',
      })
      // Broadcast the signed transaction
      const txId = await broadcastTransaction(signedTx)
      return txId
    } catch (e) {
      console.error('Error sending Bitcoin:', e)
      throw e
    }
  },
})
