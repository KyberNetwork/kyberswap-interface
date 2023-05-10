import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback } from 'react'

import { SUPPORTED_WALLETS, WALLETLINK_LOCALSTORAGE_NAME } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useIsUserManuallyDisconnect } from 'state/user/hooks'
import { isEVMWallet, isSolanaWallet } from 'utils'

const useDisconnectWallet = () => {
  const [, setIsUserManuallyDisconnect] = useIsUserManuallyDisconnect()
  const { disconnect } = useWallet()
  const { walletKey, isEVM, isSolana } = useActiveWeb3React()
  const { connector, deactivate } = useWeb3React()
  return useCallback(() => {
    const wallet = walletKey && SUPPORTED_WALLETS[walletKey]
    const onRemove = () => {
      setIsUserManuallyDisconnect(true)
      localStorage.removeItem(WALLETLINK_LOCALSTORAGE_NAME)
    }
    //If wallet support both network, disconnect to both
    if (wallet && isEVMWallet(wallet) && isSolanaWallet(wallet)) {
      deactivate()
      disconnect()
      onRemove()
      return
    }

    if (isEVM) {
      deactivate()
      // @ts-expect-error close can be returned by wallet
      if (connector && connector.close) connector.close()
    } else if (isSolana) {
      disconnect()
    }
    onRemove()
  }, [connector, deactivate, disconnect, isEVM, isSolana, setIsUserManuallyDisconnect, walletKey])
}
export default useDisconnectWallet
