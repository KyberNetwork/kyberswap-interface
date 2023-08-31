import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React, useInactiveListener, useWeb3React } from 'hooks'
import { useEagerConnect } from 'hooks/web3/useEagerConnect'
import { AppState } from 'state'
import { updateChainId } from 'state/user/actions'

export default function Web3ReactManager({ children }: { children: JSX.Element }) {
  const chainIdState = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  const { isEVM } = useActiveWeb3React()
  const { active, chainId: chainIdEVM } = useWeb3React()

  // try to eagerly connect to an injected provider, if it exists and has granted access already
  const triedEager = useEagerConnect()

  // when there's no account connected, react to logins (broadly speaking) on the injected provider, if it exists
  useInactiveListener(!triedEager.current)
  const dispatch = useDispatch()
  /** On user change network from wallet, update chainId in store, only work on EVM wallet */
  useEffect(() => {
    if (triedEager.current && chainIdEVM && chainIdState !== chainIdEVM && active && isEVM) {
      dispatch(updateChainId(chainIdEVM))
    }
    // Only run on change network from wallet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainIdEVM, triedEager.current, active])

  // on page load, do nothing until we've tried to connect to the injected connector
  if (isEVM && !triedEager.current) {
    return <LocalLoader />
  }

  return children
}
