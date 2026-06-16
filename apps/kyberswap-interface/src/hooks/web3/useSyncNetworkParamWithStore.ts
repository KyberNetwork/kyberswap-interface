import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useAccount } from 'hooks/useAccount'
import { getChainIdFromSlug } from 'utils/string'

import { useChangeNetwork } from './useChangeNetwork'

const getSyncedNetworkPathname = (pathname: string, networkParam: string, networkRoute: string) => {
  const syncedPathname = pathname.replace(encodeURIComponent(networkParam), networkRoute)

  if (syncedPathname.startsWith(`${APP_PATHS.SWAP}/${networkRoute}/`)) {
    return `${APP_PATHS.SWAP}/${networkRoute}`
  }

  if (syncedPathname.startsWith(`${APP_PATHS.LIMIT}/${networkRoute}/`)) {
    return `${APP_PATHS.LIMIT}/${networkRoute}`
  }

  return syncedPathname
}

export function useSyncNetworkParamWithStore() {
  const { network: networkParam } = useParams<{ network?: string }>()
  const paramChainId = getChainIdFromSlug(networkParam)
  const { changeNetwork } = useChangeNetwork()
  const { networkInfo, chainId, isWrongNetwork } = useActiveWeb3React()
  const navigate = useNavigate()
  const location = useLocation()
  const [requestingNetwork, setRequestingNetwork] = useState<string>()
  const triedSync = useRef(false)
  const chainIdKeeper = useRef<number>(0)
  const networkParamKeeper = useRef<string>('')
  const { connector, isConnected } = useAccount()

  useEffect(() => {
    if (!networkParam || !paramChainId || isWrongNetwork) {
      triedSync.current = true
      return
    }
    if (!chainIdKeeper.current) chainIdKeeper.current = paramChainId
    if (!networkParamKeeper.current)
      networkParamKeeper.current = networkParam

      /**
       * Try to change to network on route param on init. Exp: /swap/ethereum => try to connect to ethereum on init
       * @param isOnInit.current: make sure only run 1 time after init
       * @param triedEager: only run after tried to connect injected wallet
       */
    ;(async () => {
      if (triedSync.current || (isConnected && !connector?.switchChain)) return
      setRequestingNetwork(networkParamKeeper.current)
      await changeNetwork(chainIdKeeper.current, undefined, () => {
        navigate(
          {
            ...location,
            pathname: getSyncedNetworkPathname(location.pathname, networkParamKeeper.current, networkInfo.route),
          },
          { replace: true },
        )
      })
      triedSync.current = true
    })()
  }, [
    changeNetwork,
    location,
    navigate,
    networkInfo.route,
    networkParam,
    paramChainId,
    isWrongNetwork,
    connector?.switchChain,
    isConnected,
  ])

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
        { ...location, pathname: getSyncedNetworkPathname(location.pathname, networkParam, networkInfo.route) },
        { replace: true },
      )
    }
  }, [location, networkInfo.route, navigate, networkParam, requestingNetwork, isWrongNetwork])
}
