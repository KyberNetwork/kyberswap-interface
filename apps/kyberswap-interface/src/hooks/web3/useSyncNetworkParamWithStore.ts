import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useAccount } from 'hooks/useAccount'
import useIsWalletRestoring from 'hooks/useIsWalletRestoring'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { getSyncedNetworkPathname } from 'utils/routes'
import { isInSafeApp } from 'utils/safeApp'
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
  const chainIdKeeper = useRef<number>(0)
  const networkParamKeeper = useRef<string>('')
  const { connector, isConnected } = useAccount()
  const isRestoringWallet = useIsWalletRestoring()
  const [isAcceptedTerm] = useIsAcceptedTerm()
  // A session whose accepted Terms have fallen behind is about to be dropped by
  // `useDisconnectOnStaleTerms`. Mirror its condition so this hook can wait that out.
  const isLosingStaleTermsSession = !!connector && !isAcceptedTerm && !isInSafeApp

  useEffect(() => {
    // Wait out the boot restore before deciding anything, and leave `triedSync` unlatched meanwhile.
    // A returning visitor has no wallet in hand for the first moments of the page, and reading the chain
    // from that snapshot gets it wrong in both directions: `changeNetwork` takes its no-wallet path and
    // writes the route's chain to Redux without ever asking the wallet, then `triedSync` latches, so the
    // wallet that lands a moment later on the chain it was left on is never asked to switch. The app then
    // reads and signs on two different chains — deep link says HyperEVM, wallet stays on Ethereum, and
    // every chain-less wagmi read follows the wallet.
    // The same reasoning covers a session on its way out over stale Terms: asking that wallet to switch
    // chains puts a network prompt in front of someone the app is disconnecting in the same breath. Once
    // the disconnect lands there is no connector left, and the sync runs on the no-wallet path.
    if (isRestoringWallet || isLosingStaleTermsSession) return

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
      if (triedSync.current) return
      // A connected wallet that cannot switch chains (Safe and other embedded wallets) stays where it is,
      // so give up on the route's chain and let the effect below rewrite the URL to the wallet's, rather
      // than leaving the address bar naming a chain nothing is on.
      if (isConnected && !connector?.switchChain) {
        triedSync.current = true
        return
      }
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
    isRestoringWallet,
    isLosingStaleTermsSession,
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
