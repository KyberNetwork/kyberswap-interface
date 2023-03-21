import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { usePrevious } from 'react-use'

import { NETWORKS_INFO } from 'constants/networks'
import { isAuthorized, useActiveWeb3React, useEagerConnect } from 'hooks'

import { useChangeNetwork } from './useChangeNetwork'

/**
 *
 * we need this hook to check user actually connected wallet or not
 * although we connected wallet, it will take small time to load => account = undefined => wait a bit => account = 0x....
 */
function useIsConnectedWallet() {
  const { account } = useActiveWeb3React()
  const prevAccount = usePrevious(account)
  const key = 'connectedWallet'
  useEffect(() => {
    if (account) {
      localStorage.setItem(key, '1')
    }
    if (prevAccount && !account) {
      localStorage.removeItem(key)
    }
  }, [account, prevAccount])
  const connectedWallet = localStorage.getItem(key)
  return connectedWallet
}

export function useSyncNetworkParamWithStore() {
  const params = useParams<{ network?: string }>()
  const changeNetwork = useChangeNetwork()
  const { networkInfo, walletEVM, walletSolana, chainId, account } = useActiveWeb3React()
  const isOnInit = useRef(true)
  const navigate = useNavigate()
  const triedEager = useEagerConnect()
  const isConnected = useIsConnectedWallet()

  const location = useLocation()
  const [requestingNetwork, setRequestingNetwork] = useState<string>()

  useEffect(() => {
    if (!params?.network) {
      isOnInit.current = false
      return
    }
    let success = false
    if (isOnInit.current) {
      const paramChainId = Object.values(NETWORKS_INFO).find(n => n.route === params?.network)?.chainId
      /**
       * Try to change to network on route param on init. Exp: /swap/ethereum => try to connect to ethereum on init
       * @param isOnInit.current: make sure only run 1 time after init
       * @param triedEager: only run after tried to connect injected wallet
       */
      ;(async () => {
        const authorize = await isAuthorized()
        if (isConnected && authorize && !account) {
          return
        }
        if (!paramChainId) {
          success = true
          return
        }
        setRequestingNetwork(params?.network)
        await changeNetwork(paramChainId, undefined, () => {
          if (params.network) {
            navigate(
              { ...location, pathname: location.pathname.replace(params.network, networkInfo.route) },
              { replace: true },
            )
          }
        })
        success = true
      })()
    }
    if (success) isOnInit.current = false
  }, [
    location,
    changeNetwork,
    params?.network,
    navigate,
    networkInfo.route,
    walletEVM.isConnected,
    walletSolana.isConnected,
    isConnected,
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
