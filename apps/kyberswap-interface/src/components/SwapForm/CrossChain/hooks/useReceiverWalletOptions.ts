import { WalletSelector, setupWalletSelector } from '@near-wallet-selector/core'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'

import { beginNearReceiverRedirect } from 'components/SwapForm/CrossChain/receiverWallet'
import {
  SwapWalletConnection,
  bitcoinConnection,
  nearConnection,
  solanaConnection,
} from 'components/SwapForm/CrossChain/walletConnection'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { createBitcoinConnection } from 'components/Web3Provider/BitcoinProvider/connection'
import { walletSelectorConfig } from 'components/Web3Provider/nearWalletConfig'
import { NonEvmChain } from 'types/crossChain'

export type ReceiverWalletOption = {
  id: string
  name: string
  icon: string
  installed: boolean
  hardware?: boolean
  connect: (path?: string) => Promise<SwapWalletConnection[]>
}

// Retain the independent Bitcoin signing instance, including Ledger transport and derivation path.
export const readBitcoinReceiver = async (
  id: Parameters<typeof createBitcoinConnection>[0],
  path?: string,
): Promise<SwapWalletConnection> => {
  const connection = createBitcoinConnection(id)
  const { provider } = connection
  try {
    await provider.connect(path)
    if (!connection.getInfo().address) throw new Error('No receiving address returned by the wallet')
    return bitcoinConnection(connection)
  } catch (error) {
    await connection.dispose()
    throw error
  }
}

// Keep receiver authorization separate from the app selector's persisted session.
export const createNearReceiverSelector = () => {
  const storage = new Map<string, string>()
  return setupWalletSelector({
    ...walletSelectorConfig,
    allowMultipleSelectors: true,
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
}

export const useReceiverWalletOptions = (chain: NonEvmChain, side: 'input' | 'output' = 'output') => {
  const { wallets: solanaWallets } = useWallet()
  const { availableWallets } = useBitcoinWallet()
  const [nearSelector, setNearSelector] = useState<WalletSelector>()
  const [error, setError] = useState('')

  useEffect(() => {
    if (chain !== NonEvmChain.Near) return
    let cancelled = false
    createNearReceiverSelector()
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

  const getWalletOptions = (): ReceiverWalletOption[] => {
    if (chain === NonEvmChain.Solana) {
      return solanaWallets
        .map(wallet => wallet.adapter)
        .filter(adapter => adapter.readyState === WalletReadyState.Installed && adapter.name !== 'HOT Wallet')
        .map(adapter => ({
          id: adapter.name,
          name: adapter.name,
          icon: adapter.icon,
          installed: true,
          connect: async () => {
            await adapter.connect()
            if (!adapter.publicKey) throw new Error('No receiving address returned by the wallet')
            return [solanaConnection(adapter)]
          },
        }))
    }

    if (chain === NonEvmChain.Bitcoin) {
      return availableWallets
        .filter(wallet => wallet.type !== 'bitget')
        .map(wallet => ({
          id: wallet.type,
          name: wallet.name,
          icon: wallet.logo,
          installed: wallet.isInstalled(),
          hardware: wallet.type === 'ledger',
          connect: async path => [
            await readBitcoinReceiver(wallet.type as Parameters<typeof createBitcoinConnection>[0], path),
          ],
        }))
    }

    if (!nearSelector) return []
    return nearSelector.store.getState().modules.map(module => ({
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
        if (module.type === 'browser' && 'walletUrl' in module.metadata) {
          beginNearReceiverRedirect(
            { id: module.id, name: module.metadata.name, icon: module.metadata.iconUrl },
            module.metadata.walletUrl,
            side,
          )
          return []
        }

        const wallet = await module.wallet()
        let addresses: string[]
        if (wallet.type === 'hardware') {
          if (!path) throw new Error('Enter a derivation path')
          // Ledger exposes a key; resolve its accounts before registering them with the SDK.
          const publicKey = await wallet.getPublicKey(path)
          const response = await fetch(`${nearSelector.options.network.indexerUrl}/public_key/ed25519:${publicKey}`)
          if (!response.ok) throw new Error('Could not find accounts for this Ledger key')
          const data = await response.json()
          addresses = data.account_ids
          await wallet.signIn({
            contractId: '',
            accounts: addresses.map(accountId => ({ accountId, publicKey, derivationPath: path })),
          })
        } else {
          const accounts = await wallet.signIn({ contractId: '' })
          addresses = accounts.map(account => account.accountId)
        }

        if (!addresses?.length) throw new Error('No receiving address returned by the wallet')
        return addresses.map(address => ({
          ...nearConnection(wallet, address, nearSelector),
          ...(path ? { derivationPath: path } : {}),
        }))
      },
    }))
  }

  return { wallets: getWalletOptions(), loading: chain === NonEvmChain.Near && !nearSelector && !error, error }
}
