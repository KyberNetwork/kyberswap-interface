import { WalletSelector, setupWalletSelector } from '@near-wallet-selector/core'
import { Adapter, WalletReadyState } from '@solana/wallet-adapter-base'
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react'
import { useEffect, useState } from 'react'

import { ReceiverWallet, beginNearReceiverRedirect } from 'components/SwapForm/CrossChain/receiverWallet'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { createFordefiProvider } from 'components/Web3Provider/BitcoinProvider/providers/fordefi'
import { createLedgerProvider } from 'components/Web3Provider/BitcoinProvider/providers/ledger'
import { createOkxProvider } from 'components/Web3Provider/BitcoinProvider/providers/okx'
import { createUnisatProvider } from 'components/Web3Provider/BitcoinProvider/providers/unisat'
import { createXverseProvider } from 'components/Web3Provider/BitcoinProvider/providers/xverse'
import { WalletInfo } from 'components/Web3Provider/BitcoinProvider/types'
import { walletSelectorConfig } from 'components/Web3Provider/nearWalletConfig'
import { NonEvmChain } from 'types/crossChain'

export type ReceiverWalletOption = {
  id: string
  name: string
  icon: string
  installed: boolean
  hardware?: boolean
  connect: (path?: string) => Promise<ReceiverWallet[]>
}
const SOLANA_ADAPTERS: Adapter[] = []
const BITCOIN_FACTORIES = {
  xverse: createXverseProvider,
  okx: createOkxProvider,
  unisat: createUnisatProvider,
  fordefi: createFordefiProvider,
  ledger: createLedgerProvider,
}

// Receiver reads never invoke the sender provider's connect/disconnect or install account listeners.
export const readBitcoinReceiver = async (
  id: keyof typeof BITCOIN_FACTORIES,
  path?: string,
): Promise<ReceiverWallet> => {
  let result: WalletInfo = { address: null, publicKey: null, walletType: null, isConnected: false }
  const provider = BITCOIN_FACTORIES[id]({
    addressOnly: true,
    connectingWallet: null,
    defaultInfo: result,
    setWalletInfo: value => {
      result = value
    },
  })
  await provider.connect(path)
  if (!result.address) throw new Error('No receiving address returned by the wallet')
  return { id, name: provider.name, icon: provider.logo, address: result.address }
}

export const useReceiverWalletOptions = (chain: NonEvmChain) => {
  const adapters = useStandardWalletAdapters(SOLANA_ADAPTERS)
  const { availableWallets } = useBitcoinWallet()
  const [nearSelector, setNearSelector] = useState<WalletSelector>()
  const [error, setError] = useState('')

  useEffect(() => {
    if (chain !== NonEvmChain.Near) return
    let cancelled = false
    // Neither selector nor modal singletons may be reused: those belong to the sender.
    const storage = new Map<string, string>()
    setupWalletSelector({
      ...walletSelectorConfig,
      allowMultipleSelectors: true,
      modules: walletSelectorConfig.modules.map(factory => async options => {
        const module = await factory(options)
        if (!module) return null
        return {
          ...module,
          init: async (options: Parameters<typeof module.init>[0]) => {
            const wallet = await module.init(options)
            // SDK cleanup of a receiver reader must never revoke the sender's extension session.
            return { ...wallet, signOut: async () => undefined }
          },
        }
      }),
      storage: {
        getItem: async key => storage.get(key) ?? null,
        setItem: async (key, value) => {
          storage.set(key, value)
        },
        removeItem: async key => {
          storage.delete(key)
        },
      },
    })
      .then(selector => {
        if (!cancelled) setNearSelector(selector)
      })
      .catch(reason => {
        if (!cancelled) setError(reason.message || 'Could not load NEAR wallets')
      })
    return () => {
      cancelled = true
    }
  }, [chain])

  const wallets: ReceiverWalletOption[] =
    chain === NonEvmChain.Solana
      ? adapters
          .filter(adapter => adapter.readyState === WalletReadyState.Installed && adapter.name !== 'HOT Wallet')
          .map(adapter => ({
            id: adapter.name,
            name: adapter.name,
            icon: adapter.icon,
            installed: true,
            connect: async () => {
              await adapter.connect()
              if (!adapter.publicKey) throw new Error('No receiving address returned by the wallet')
              return [
                { id: adapter.name, name: adapter.name, icon: adapter.icon, address: adapter.publicKey.toString() },
              ]
            },
          }))
      : chain === NonEvmChain.Bitcoin
      ? availableWallets
          .filter(wallet => wallet.type in BITCOIN_FACTORIES)
          .map(wallet => ({
            id: wallet.type,
            name: wallet.name,
            icon: wallet.logo,
            installed: wallet.isInstalled(),
            hardware: wallet.type === 'ledger',
            connect: async path => [await readBitcoinReceiver(wallet.type as keyof typeof BITCOIN_FACTORIES, path)],
          }))
      : nearSelector?.store.getState().modules.map(module => ({
          id: module.id,
          name: module.metadata.name,
          icon: module.metadata.iconUrl,
          installed: module.type === 'injected' && module.metadata.available,
          hardware: module.type === 'hardware',
          connect: async path => {
            if (!module.metadata.available && 'downloadUrl' in module.metadata) {
              window.open(module.metadata.downloadUrl, '_blank', 'noopener,noreferrer')
              return []
            }
            if (module.id === 'my-near-wallet' && 'walletUrl' in module.metadata && module.metadata.walletUrl) {
              beginNearReceiverRedirect(
                { id: module.id, name: module.metadata.name, icon: module.metadata.iconUrl },
                module.metadata.walletUrl,
              )
              return []
            }
            const wallet = await module.wallet()
            let addresses: string[]
            if (wallet.type === 'hardware') {
              if (!path) throw new Error('Enter a derivation path')
              const publicKey = await wallet.getPublicKey(path)
              const response = await fetch(`${nearSelector.options.network.indexerUrl}/public_key/ed25519:${publicKey}`)
              if (!response.ok) throw new Error('Could not find accounts for this Ledger key')
              const data = await response.json()
              addresses = data.account_ids
            } else {
              const accounts = await wallet.signIn({ contractId: '' })
              addresses = accounts.map(account => account.accountId)
            }
            if (!addresses?.length) throw new Error('No receiving address returned by the wallet')
            return addresses.map(address => ({
              id: module.id,
              name: module.metadata.name,
              icon: module.metadata.iconUrl,
              address,
            }))
          },
        })) || []

  return { wallets, loading: chain === NonEvmChain.Near && !nearSelector && !error, error }
}
