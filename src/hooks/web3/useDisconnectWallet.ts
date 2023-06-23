import { useWallet } from '@solana/wallet-adapter-react'
import { Connector } from '@web3-react/types'
import { useCallback } from 'react'

import { coinbaseWallet, walletConnectV2 } from 'constants/connectors/evm'
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
  if (connector) {
    if (connector === coinbaseWallet) {
      return connector.resetState()
    }
    connector.deactivate?.()
    connector.resetState?.()
    if (connector === walletConnectV2) {
      // This key should be deleted when disconnected by walletconnect library
      // But it was deleted slowly, if user call connector.active() again before this key cleared, bug will appear
      // So we force remove it right after disconnected to preventing bug
      // todo: deep dive rootcause why it slowly delete
      localStorage.removeItem('wc@2:client:0.3//session')
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
