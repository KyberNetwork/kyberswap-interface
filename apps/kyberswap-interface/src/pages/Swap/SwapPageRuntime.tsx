import { type ReactNode, createContext, useContext, useSyncExternalStore } from 'react'

import { type SwapWalletSnapshot, SwapWalletSnapshotContext } from 'components/SwapWallets/SwapWalletContext'
import type { CrossChainTradeRouteProps } from 'components/TradeRouting/CrossChainTradeRoute'

export type SwapRuntimeSnapshot = Readonly<{
  route: Readonly<Omit<CrossChainTradeRouteProps, 'defaultCollapsed'>> | undefined
  wallets: SwapWalletSnapshot | undefined
}>

const SwapRouteSnapshotContext = createContext<SwapRuntimeSnapshot['route']>(undefined)
export const useSwapRouteSnapshot = () => useContext(SwapRouteSnapshotContext)

/** Page-local projection of existing owners. Publishing only rerenders consumers,
 * never the lazy wallet/quote producers, which may publish new values on every render. */
export const createSwapPageRuntime = () => {
  let current: { identity: string; walletIdentity: string; snapshot: SwapRuntimeSnapshot } | undefined
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    publish: (identity: string, walletIdentity: string, snapshot: SwapRuntimeSnapshot) => {
      current = { identity, walletIdentity, snapshot }
      listeners.forEach(listener => listener())
    },
  }
}

const serverSnapshot = () => undefined

export const SwapPageRuntime = ({
  runtime,
  identity,
  walletIdentity,
  children,
}: {
  runtime: ReturnType<typeof createSwapPageRuntime>
  identity: string
  walletIdentity: string
  children: ReactNode
}) => {
  const current = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, serverSnapshot)
  const route = current?.identity === identity ? current.snapshot.route : undefined
  const wallets = current?.walletIdentity === walletIdentity ? current.snapshot.wallets : undefined
  return (
    <SwapRouteSnapshotContext.Provider value={route}>
      <SwapWalletSnapshotContext.Provider value={wallets}>{children}</SwapWalletSnapshotContext.Provider>
    </SwapRouteSnapshotContext.Provider>
  )
}
