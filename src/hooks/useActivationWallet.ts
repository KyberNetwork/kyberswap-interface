import { BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { useCallback } from 'react'

export const useActivationWallet = () => {
  const { activate } = useWeb3React()
  const { select } = useWallet()

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

  return {
    tryActivationEVM,
    tryActivationSolana,
  }
}
