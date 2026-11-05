import type { Wallet, WalletSelector } from '@near-wallet-selector/core'
import type { Adapter } from '@solana/wallet-adapter-base'
import type { Connector } from 'wagmi'

import type { BitcoinConnection } from 'components/Web3Provider/BitcoinProvider/connection'
import type { BitcoinWalletBase } from 'components/Web3Provider/BitcoinProvider/types'
import { Chain, NonEvmChain, isNonEvmChain } from 'types/crossChain'

import type { ReceiverWallet } from './receiverWallet'

export type WalletFamily = NonEvmChain | 'evm'
export const walletFamily = (chain: Chain): WalletFamily => (isNonEvmChain(chain) ? (chain as NonEvmChain) : 'evm')
export const noSubscription = () => () => undefined

type LiveConnection = ReceiverWallet & {
  release?: () => Promise<void>
  getAddress: () => string
  subscribe: (listener: () => void) => () => void
}
export type SwapWalletConnection = LiveConnection &
  (
    | { family: 'evm'; connector: Connector; selectAppConnection: () => void }
    | { family: NonEvmChain.Solana; wallet: Adapter }
    | { family: NonEvmChain.Near; wallet: Wallet }
    | { family: NonEvmChain.Bitcoin; wallet: BitcoinWalletBase; getPublicKey: () => string }
  )

export const solanaConnection = (wallet: Adapter): SwapWalletConnection => ({
  family: NonEvmChain.Solana,
  wallet,
  id: wallet.name,
  name: wallet.name,
  icon: wallet.icon,
  address: wallet.publicKey?.toString() || '',
  getAddress: () => wallet.publicKey?.toString() || '',
  subscribe: listener => {
    wallet.on('connect', listener)
    wallet.on('disconnect', listener)
    return () => {
      wallet.off('connect', listener)
      wallet.off('disconnect', listener)
    }
  },
})

export const nearConnection = (wallet: Wallet, address: string, selector: WalletSelector): SwapWalletConnection => ({
  family: NonEvmChain.Near,
  wallet,
  id: wallet.id,
  name: wallet.metadata.name,
  icon: wallet.metadata.iconUrl,
  address,
  getAddress: () => {
    const accounts = selector.store.getState().accounts
    return accounts.find(account => account.accountId === address)?.accountId || ''
  },
  subscribe: listener => {
    const subscription = selector.store.observable.subscribe(listener)
    return () => subscription.unsubscribe()
  },
})

export const bitcoinConnection = (session: BitcoinConnection): SwapWalletConnection => ({
  family: NonEvmChain.Bitcoin,
  wallet: session.provider,
  id: session.provider.type,
  name: session.provider.name,
  icon: session.provider.logo,
  address: session.getInfo().address || '',
  derivationPath: session.getInfo().derivationPath,
  getAddress: () => session.getInfo().address || '',
  subscribe: session.subscribe,
  release: session.dispose,
  getPublicKey: () => session.getInfo().publicKey || '',
})
