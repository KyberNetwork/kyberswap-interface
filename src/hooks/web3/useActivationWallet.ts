import { BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connector } from '@web3-react/types'
import { useCallback } from 'react'

import { walletConnectV2 } from 'connectors'
import { LOCALSTORAGE_LAST_WALLETKEY, SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import { useIsUserManuallyDisconnect } from 'state/user/hooks'
import { isEVMWallet, isSolanaWallet } from 'utils'

export const useActivationWallet: () => {
  tryActivation: (walletKey: SUPPORTED_WALLET) => Promise<void>
  tryActivationEVM: (connector: Connector) => Promise<void>
  tryActivationSolana: (adapter: BaseMessageSignerWalletAdapter) => Promise<void>
} = () => {
  const { select, wallet: solanaWallet } = useWallet()
  const { isSolana, isEVM } = useActiveWeb3React()
  const [, setIsUserManuallyDisconnect] = useIsUserManuallyDisconnect()

  const tryActivationEVM: (connector: Connector) => Promise<void> = useCallback(async (connector: Connector) => {
    try {
      if (connector === walletConnectV2) {
        import('@walletconnect/ethereum-provider').then(async ethProviderModule => {
          console.log('ethProviderModule', { ethProviderModule })
        })
      }
      await connector.activate()
    } catch (error) {
      console.error('Activate evm failed:', { connector, error })
      throw error
    }
  }, [])

  const tryActivationSolana: (adapter: BaseMessageSignerWalletAdapter) => Promise<void> = useCallback(
    async (adapter: BaseMessageSignerWalletAdapter) => {
      try {
        select(adapter.name)
      } catch (error) {
        throw error
      }
    },
    [select],
  )

  const tryActivation: (walletKey: SUPPORTED_WALLET) => Promise<void> = useCallback(
    async (walletKey: SUPPORTED_WALLET) => {
      setIsUserManuallyDisconnect(false)
      const wallet = SUPPORTED_WALLETS[walletKey]
      try {
        await (async () => {
          if (isEVM && isEVMWallet(wallet) && !wallet.href) {
            await tryActivationEVM(wallet.connector)
          }
          if (isSolana && isSolanaWallet(wallet) && wallet.adapter !== solanaWallet?.adapter) {
            await tryActivationSolana(wallet.adapter)
          }
        })()
        localStorage.setItem(LOCALSTORAGE_LAST_WALLETKEY, walletKey.toString())
      } catch (error) {
        localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY)
        throw error
      }
    },
    [setIsUserManuallyDisconnect, isSolana, isEVM, solanaWallet?.adapter, tryActivationEVM, tryActivationSolana],
  )

  return {
    tryActivation,
    tryActivationEVM,
    tryActivationSolana,
  }
}
