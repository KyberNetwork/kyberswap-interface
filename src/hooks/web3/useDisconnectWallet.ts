import { useWallet } from '@solana/wallet-adapter-react'
import { Connector } from '@web3-react/types'
import { useCallback } from 'react'

import {
  LOCALSTORAGE_LAST_WALLETKEY_EVM,
  LOCALSTORAGE_LAST_WALLETKEY_SOLANA,
  SUPPORTED_WALLETS,
} from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { isEVMWallet, isSolanaWallet } from 'utils'

const disconnectEvmConnector: (connector: Connector | undefined) => void | Promise<void> = (
  connector: Connector | undefined,
) => {
  window.ethereum?.selectedProvider?.close?.() // for coinbase
  if (connector) {
    if (connector.deactivate) {
      return connector.deactivate()
    } else {
      return connector.resetState()
    }
  }
}

const useDisconnectWallet = () => {
  const { disconnect } = useWallet()
  const { walletKey, isEVM, isSolana } = useActiveWeb3React()
  const { connector } = useWeb3React()
  return useCallback(async () => {
    const wallet = walletKey && SUPPORTED_WALLETS[walletKey]
    // If wallet support both network, disconnect to both
    if (wallet && isEVMWallet(wallet) && isSolanaWallet(wallet)) {
      await Promise.allSettled([disconnectEvmConnector(connector), disconnect()])
      localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_EVM)
      localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_SOLANA)
    } else if (isEVM) {
      await disconnectEvmConnector(connector)
      localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_EVM)
    } else if (isSolana) {
      await disconnect()
      localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_SOLANA)
    }
  }, [connector, disconnect, isEVM, isSolana, walletKey])
}
export default useDisconnectWallet
