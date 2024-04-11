import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { getChainIdFromSlug } from 'utils/string'

import { useChangeNetwork } from './useChangeNetwork'

export function useSyncNetworkParamWithStore() {
  const { network: networkParam } = useParams<{ network?: string }>()
  const paramChainId = getChainIdFromSlug(networkParam)
  const { changeNetwork } = useChangeNetwork()
  const { networkInfo, chainId, isWrongNetwork } = useActiveWeb3React()
  const navigate = useNavigate()
  const location = useLocation()
  const [requestingNetwork, setRequestingNetwork] = useState<string>()
  const triedSync = useRef(false)

  useEffect(() => {
    if (!networkParam || !paramChainId || isWrongNetwork) {
      triedSync.current = true
      return
    }

    /**
     * Try to change to network on route param on init. Exp: /swap/ethereum => try to connect to ethereum on init
     * @param isOnInit.current: make sure only run 1 time after init
     * @param triedEager: only run after tried to connect injected wallet
     */
    ;(async () => {
      if (triedSync.current) return
      setRequestingNetwork(networkParam)
      await changeNetwork(paramChainId, undefined, () => {
        navigate(
          { ...location, pathname: location.pathname.replace(networkParam, networkInfo.route) },
          { replace: true },
        )
      })
      triedSync.current = true
    })()
  }, [changeNetwork, location, navigate, networkInfo.route, networkParam, paramChainId, isWrongNetwork])

  useEffect(() => {
    if (NETWORKS_INFO[chainId].route === requestingNetwork) setRequestingNetwork(undefined)
  }, [chainId, requestingNetwork])

  useEffect(() => {
    if (isWrongNetwork) {
      return
    }
    /**
     * Sync network route param with current active network, only after eager tried
     */
    if (
      ((requestingNetwork && requestingNetwork !== networkParam) || !requestingNetwork) &&
      networkParam &&
      networkInfo.route !== networkParam &&
      triedSync.current
    ) {
      navigate(
        { ...location, pathname: location.pathname.replace(encodeURIComponent(networkParam), networkInfo.route) },
        { replace: true },
      )
    }
  }, [location, networkInfo.route, navigate, networkParam, requestingNetwork, isWrongNetwork])
}
