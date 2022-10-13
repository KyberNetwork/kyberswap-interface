import { BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { useCallback } from 'react'

import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import { isEVMWallet, isSolanaWallet } from 'utils'

export const useActivationWallet = () => {
  const { activate } = useWeb3React()
  const { select, wallet: solanaWallet } = useWallet()
  const { isSolana, isEVM } = useActiveWeb3React()
  const tryActivationEVM = useCallback(
    async (connector: AbstractConnector | undefined) => {
      // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
      if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
        connector.walletConnectProvider = undefined
      }
      if (connector) {
        try {
          await activate(connector, undefined, true)
        } catch (error) {
          if (error instanceof UnsupportedChainIdError) {
            await activate(connector)
          } else {
            throw error
          }
        }
      }
    },
    [activate],
  )

  const tryActivationSolana = useCallback(
    async (adapter: BaseMessageSignerWalletAdapter) => {
      try {
        select(adapter.name)
      } catch (error) {
        throw error
      }
    },
    [select],
  )

  const tryActivation = useCallback(
    async (walletKey: SUPPORTED_WALLET) => {
      const wallet = SUPPORTED_WALLETS[walletKey]
      try {
        if (isEVM && isEVMWallet(wallet) && !wallet.href) {
          await tryActivationEVM(wallet.connector)
        }
        if (isSolana && isSolanaWallet(wallet) && wallet.adapter !== solanaWallet?.adapter) {
          await tryActivationSolana(wallet.adapter)
        }
      } catch (err) {
        throw err
      }
    },
    [isSolana, isEVM, solanaWallet?.adapter, tryActivationEVM, tryActivationSolana],
  )

  return {
    tryActivation,
    tryActivationEVM,
    tryActivationSolana,
  }
}
