import { useMemo } from 'react'
import { isMobile } from 'react-device-detect'
import { Connector, useConnect } from 'wagmi'

import { CONNECTION, getConnectorWithId } from 'components/Web3Provider'

function getInjectedConnectors(connectors: readonly Connector[]) {
  let isCoinbaseWalletBrowser = false
  const injectedConnectors = connectors.filter(c => {
    // Special-case: Ignore coinbase eip6963-injected connector; coinbase connection is handled via the SDK connector.
    if (c.id === CONNECTION.COINBASE_RDNS) {
      if (isMobile) {
        isCoinbaseWalletBrowser = true
      }
      return false
    }

    return c.type === CONNECTION.INJECTED_CONNECTOR_TYPE && c.id !== CONNECTION.INJECTED_CONNECTOR_ID
  })

  // Special-case: Return deprecated window.ethereum connector when no eip6963 injectors are present.
  const fallbackInjector = getConnectorWithId(connectors, CONNECTION.INJECTED_CONNECTOR_ID, { shouldThrow: true })
  if (!injectedConnectors.length && Boolean(window.ethereum)) {
    return { injectedConnectors: [fallbackInjector], isCoinbaseWalletBrowser }
  }

  return { injectedConnectors, isCoinbaseWalletBrowser }
}

type InjectableConnector = Connector & { isInjected?: boolean }
export function useOrderedConnections(): InjectableConnector[] {
  const { connectors } = useConnect()

  return useMemo(() => {
    const { injectedConnectors: injectedConnectorsBase, isCoinbaseWalletBrowser } = getInjectedConnectors(connectors)
    const injectedConnectors = injectedConnectorsBase.map(c => ({ ...c, isInjected: true }))

    const coinbaseSdkConnector = getConnectorWithId(connectors, CONNECTION.COINBASE_SDK_CONNECTOR_ID)
    const walletConnectConnector = getConnectorWithId(connectors, CONNECTION.WALLET_CONNECT_CONNECTOR_ID)
    const bloctoConnector = getConnectorWithId(connectors, CONNECTION.BLOCTO_ID)

    if (!coinbaseSdkConnector || !walletConnectConnector) {
      throw new Error('Expected connector(s) missing from wagmi context.')
    }

    // Special-case: Only display the injected connector for in-wallet browsers.
    if (isMobile && injectedConnectors.length === 1) {
      return injectedConnectors
    }

    // Special-case: Only display the Coinbase connector in the Coinbase Wallet.
    if (isCoinbaseWalletBrowser) {
      return [coinbaseSdkConnector]
    }

    const orderedConnectors: InjectableConnector[] = []

    // Injected connectors should appear next in the list, as the user intentionally installed/uses them.
    orderedConnectors.push(...injectedConnectors)

    // WalletConnect and Coinbase are added last in the list.
    orderedConnectors.push(walletConnectConnector)
    orderedConnectors.push(coinbaseSdkConnector)

    if (bloctoConnector) orderedConnectors.push(bloctoConnector)

    // Place the most recent connector at the top of the list.
    orderedConnectors
    return orderedConnectors
  }, [connectors])
}
