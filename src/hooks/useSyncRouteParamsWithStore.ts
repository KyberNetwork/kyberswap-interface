import { isEVM, isSolana, NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useEagerConnect } from 'hooks'
import { useEffect, useRef } from 'react'
import { useHistory, useParams, useRouteMatch } from 'react-router-dom'
import { useChangeNetwork } from './useChangeNetwork'

export function useSyncRouteParamsWithStore() {
  const params = useParams<{ network?: string }>()
  const changeNetwork = useChangeNetwork()
  const { networkInfo } = useActiveWeb3React()
  const isOnInit = useRef(true)
  const history = useHistory()
  const match = useRouteMatch()
  const triedEager = useEagerConnect()

  useEffect(() => {
    /**
     * Try to change to network on route param on init. Exp: /swap/ethereum => try to connect to ethereum on init
     * @param params.network: network in router params need to exist
     * @param isOnInit.current: make sure only run 1 time after init
     * @param active: only run this if wallet connected
     * @param triedEager: only run after tried to connect injected wallet
     */
    if (params?.network && isOnInit.current && triedEager) {
      ;(async () => {
        const paramChainId = Object.values(NETWORKS_INFO).find(n => n.route === params?.network)?.chainId
        if (paramChainId && isEVM(paramChainId)) {
          await changeNetwork(
            paramChainId,
            () => {
              isOnInit.current = false
            },
            () => {
              history.replace({ pathname: match.path.replace(':network', networkInfo.route) })
            },
          )
        } else if (paramChainId && isSolana(paramChainId)) {
          await changeNetwork(paramChainId, () => {
            isOnInit.current = false
          })
        }
      })()
    }
  }, [changeNetwork, history, triedEager, params?.network, match.path, networkInfo.route])

  useEffect(() => {
    /**
     * Sync network route param on with current active network, only after eager tried
     */
    if (networkInfo.route !== params?.network && !isOnInit.current && triedEager) {
      history.replace({ pathname: match.path.replace(':network', networkInfo.route) })
    }
  }, [networkInfo.route, history, triedEager, match.path, params?.network])
}
