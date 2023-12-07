import { Connector } from '@web3-react/types'
import { useCallback } from 'react'

import { coinbaseWallet, krystalWalletConnectV2, walletConnectV2 } from 'constants/connectors'
import { LOCALSTORAGE_LAST_WALLETKEY_EVM, SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'

const disconnectEvmConnector: (connector: Connector | undefined) => void | Promise<void> = (
  connector: Connector | undefined,
) => {
  if (connector) {
    if (connector === coinbaseWallet) {
      return connector.resetState()
    }
    connector.deactivate?.()
    connector.resetState?.()
    if (connector === walletConnectV2 || connector === krystalWalletConnectV2) {
      // This key should be deleted when disconnected by walletconnect library
      // But it was deleted slowly, if user call connector.active() again before this key cleared, bug will appear
      // So we force remove it right after disconnected to preventing bug
      // todo: deep dive rootcause why it slowly delete
      localStorage.removeItem('wc@2:client:0.3//session')
    }
  }
}

const useDisconnectWallet = () => {
  const { walletKey } = useActiveWeb3React()
  const { connector } = useWeb3React()
  return useCallback(async () => {
    const wallet = walletKey && SUPPORTED_WALLETS[walletKey]
    // If wallet support both network, disconnect to both
    if (wallet) {
      await disconnectEvmConnector(connector)
      localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_EVM)
    } else {
      await disconnectEvmConnector(connector)
      localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_EVM)
    }
  }, [connector, walletKey])
}
export default useDisconnectWallet
