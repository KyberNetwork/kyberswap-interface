import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useEagerConnect } from 'hooks'
import { useConnectedWallet } from 'state/authen/hooks'
import { getChainIdFromSlug } from 'utils/string'

import { useChangeNetwork } from './useChangeNetwork'

export function useSyncNetworkParamWithStore() {
  const params = useParams<{ network?: string }>()
  const changeNetwork = useChangeNetwork()
  const { networkInfo, walletEVM, walletSolana, chainId, account } = useActiveWeb3React()
  const isOnInit = useRef(true)
  const navigate = useNavigate()
  const triedEager = useEagerConnect()
  const [possibleWallet] = useConnectedWallet()
  const location = useLocation()
  const [requestingNetwork, setRequestingNetwork] = useState<string>()

  useEffect(() => {
    if (!params?.network) {
      isOnInit.current = false
      return
    }
    if (isOnInit.current) {
      const paramChainId = getChainIdFromSlug(params?.network)
      /**
       * Try to change to network on route param on init. Exp: /swap/ethereum => try to connect to ethereum on init
       * @param isOnInit.current: make sure only run 1 time after init
       * @param triedEager: only run after tried to connect injected wallet
       */
      ;(async () => {
        if (!paramChainId) {
          isOnInit.current = false
          return
        }
        if ((possibleWallet || possibleWallet === null) && !account) {
          // connected wallet but web3-react slow return account, or checking connection
          return
        }
        setRequestingNetwork(params?.network)
        if (!isOnInit.current) return
        isOnInit.current = false
        await changeNetwork(paramChainId, undefined, () => {
          if (params.network) {
            navigate(
              { ...location, pathname: location.pathname.replace(params.network, networkInfo.route) },
              { replace: true },
            )
          }
        })
      })()
    } else {
      isOnInit.current = false
    }
  }, [
    location,
    changeNetwork,
    params?.network,
    navigate,
    networkInfo.route,
    walletEVM.isConnected,
    walletSolana.isConnected,
    possibleWallet,
    account,
  ])

  useEffect(() => {
    if (NETWORKS_INFO[chainId].route === requestingNetwork) setRequestingNetwork(undefined)
  }, [chainId, requestingNetwork])

  useEffect(() => {
    /**
     * Sync network route param with current active network, only after eager tried
     */
    if (
      ((requestingNetwork && requestingNetwork !== params?.network) || !requestingNetwork) &&
      params.network &&
      networkInfo.route !== params?.network &&
      !isOnInit.current &&
      triedEager
    ) {
      navigate(
        { ...location, pathname: location.pathname.replace(params.network, networkInfo.route) },
        { replace: true },
      )
    }
  }, [location, networkInfo.route, navigate, triedEager, params?.network, requestingNetwork])
}
