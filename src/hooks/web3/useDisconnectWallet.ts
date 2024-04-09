import { useCallback } from 'react'

import { useWeb3React } from 'hooks'
import { useAppDispatch } from 'state/hooks'
import { setRecentConnectionDisconnected } from 'state/user/actions'

const useDisconnectWallet = () => {
  const dispatch = useAppDispatch()
  const { connector } = useWeb3React()
  const disconnect = useCallback(() => {
    connector.deactivate?.()
    connector.resetState()
    dispatch(setRecentConnectionDisconnected())
  }, [connector, dispatch])

  return disconnect
}
export default useDisconnectWallet
