import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { reconnect, watchChainId } from '@wagmi/core'
import { ReactNode, useEffect } from 'react'
import { Connector, WagmiProvider } from 'wagmi'

import {
  CONNECTION,
  CONNECTOR_ANNOUNCE_TIMEOUT,
  PORTO_CONNECTOR_ID,
  getSafepalProvider,
  hasPersistedConnection,
  readRecentConnectorId,
  registerPortoConnector,
  wagmiConfig,
} from 'components/Web3Provider/config'
import { isSupportedChainId } from 'constants/networks'
import { syncWalletChain } from 'hooks/web3/walletChainSync'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'

export {
  CONNECTION,
  CONNECTION_ORDER,
  CONNECTOR_ICON_OVERRIDE_MAP,
  HardCodedConnectors,
  SMART_WALLETS,
  arc,
  elysium,
  getConnectorWithId,
  getSafepalProvider,
  hasPersistedConnection,
  registerPortoConnector,
  robinhood,
  wagmiConfig,
} from 'components/Web3Provider/config'

export const queryClient = new QueryClient()

export default function Web3Provider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.requestIdleCallback) {
      const handle = window.requestIdleCallback(() => void registerPortoConnector(), { timeout: 3_000 })
      return () => window.cancelIdleCallback?.(handle)
    }
    const handle = window.setTimeout(() => void registerPortoConnector(), 2_000)
    return () => window.clearTimeout(handle)
  }, [])
  useEffect(() => {
    const unwatch = watchChainId(wagmiConfig, {
      onChange(chainId) {
        if (isSupportedChainId(chainId)) {
          // App-requested switches own the chain + destination update. Buffer early wallet events
          // until that operation settles; otherwise sync external wallet changes immediately.
          syncWalletChain(() => dispatch(updateChainId(chainId as any)))
        }
      },
    })
    return () => {
      unwatch()
    }
  }, [dispatch])

  // Restore the previous session ourselves, because WagmiProvider below passes `reconnectOnMount={false}`.
  //
  // wagmi's own mount reconnect walks EVERY connector and awaits `connector.getProvider()` on each — and
  // that call is where a connector dynamically imports its SDK. A visitor who has never connected a wallet
  // therefore downloads the MetaMask (~356KB) and WalletConnect (~397KB) SDKs during boot just for wagmi to
  // learn they have no session. Scoping the walk to the connector they actually last used skips all of it:
  // with no stored id there is nothing to restore, so no SDK loads at all.
  //
  // The stored id alone is not enough to decide there is something to restore, since it outlives
  // `disconnect()` — hence the persisted-connection check first, which is what tells a visitor who left
  // connected apart from one who disconnected and never came back.
  //
  // Runs on mount rather than at idle so a returning visitor's wallet reconnects promptly. EIP-6963 wallets
  // announce asynchronously, so the connector the stored id names may not be registered at this point —
  // wait for it to arrive rather than falling back to wagmi's full walk. A walk restores whichever
  // connector authorizes first, and the targetless injected one resolves whatever holds `window.ethereum`;
  // with more than one extension installed that is not necessarily the wallet the visitor chose, and coming
  // back as a different account is worse than coming back disconnected. Porto is excluded because it is
  // knowingly absent until registerPortoConnector() runs, which reconnects it itself.
  useEffect(() => {
    if (!hasPersistedConnection()) return

    const recentConnectorId = readRecentConnectorId()
    if (!recentConnectorId || recentConnectorId === PORTO_CONNECTOR_ID) return

    const findRecentConnector = () => wagmiConfig.connectors.find(connector => connector.id === recentConnectorId)
    const restore = (connector: Connector) => {
      reconnect(wagmiConfig, { connectors: [connector] }).catch(() => {})
    }

    const registeredConnector = findRecentConnector()
    if (registeredConnector) {
      restore(registeredConnector)
      return
    }

    let unsubscribe: (() => void) | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    const stopWaiting = () => {
      if (timeout) clearTimeout(timeout)
      unsubscribe?.()
      timeout = undefined
      unsubscribe = undefined
    }

    timeout = setTimeout(stopWaiting, CONNECTOR_ANNOUNCE_TIMEOUT)
    unsubscribe = wagmiConfig._internal.connectors.subscribe(() => {
      const announcedConnector = findRecentConnector()
      if (!announcedConnector) return
      stopWaiting()
      restore(announcedConnector)
    })

    return stopWaiting
  }, [])

  // SafePal reconnect recovery. The extension lazy-attaches its EVM provider
  // (window.__safepalEthereumBootstrap__.activeProvider — see getSafepalProvider)
  // some time after the page loads and does NOT fire an EIP-6963 announce, so
  // the mount reconnect above runs before the provider exists, finds nothing
  // via `connector.getProvider()`, and gives up without ever reaching
  // `isAuthorized()` (where the shim lives). Poll for the bootstrap object and,
  // once it lands, re-trigger reconnect so the custom safepalConnector finds it.
  // Guarded so it only runs while no other connector is current, and only for a visitor who left connected
  // on SafePal — this recovers that one session, so it reconnects that one connector.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasPersistedConnection()) return
    if (readRecentConnectorId() !== CONNECTION.SAFEPAL) return

    let triggered = false
    let pollHandle: ReturnType<typeof setInterval> | null = null

    const tryReconnect = () => {
      if (triggered) return
      if (!getSafepalProvider()) return
      if (wagmiConfig.state.current) return
      const safepalConnector = wagmiConfig.connectors.find(connector => connector.id === CONNECTION.SAFEPAL)
      if (!safepalConnector) return
      // Status `reconnecting`/`connecting` means wagmi is still iterating
      // connectors; calling reconnect() now hits its `isReconnecting` re-entry
      // guard and no-ops. Defer to the next poll tick.
      const status = wagmiConfig.state.status
      if (status === 'reconnecting' || status === 'connecting') return
      triggered = true
      if (pollHandle) clearInterval(pollHandle)
      reconnect(wagmiConfig, { connectors: [safepalConnector] }).catch(() => {})
    }

    let pollCount = 0
    pollHandle = setInterval(() => {
      pollCount += 1
      if (pollCount > 50 || triggered) {
        if (pollHandle) clearInterval(pollHandle)
        return
      }
      tryReconnect()
    }, 100)

    return () => {
      if (pollHandle) clearInterval(pollHandle)
    }
  }, [])

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
