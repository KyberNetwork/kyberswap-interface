import { useMemo } from 'react'
import { isMobile } from 'react-device-detect'
import { Connector, useConnectors } from 'wagmi'

import { CONNECTION, CONNECTION_ORDER, HardCodedConnectors, getConnectorWithId } from 'components/Web3Provider'
import { isInSafeApp } from 'utils'

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

    // Defensive: drop the io.metamask EIP-6963 entry. wagmi v3 normally dedupes it against the
    // metaMask SDK connector's rdns, but a late provider injection or rdns mismatch could leak it
    // through and surface as a second "MetaMask" row alongside the SDK entry.
    if (c.id === CONNECTION.METAMASK_RDNS) {
      return false
    }

    // SafePal's custom connector pins SafePal's EIP-6963 rdns, so wagmi's mipd dedup
    // collapses the announced provider onto it instead of creating a second URL-keyed
    // connector. Always surface this one — its own `connect()` opens the download page
    // when no provider has injected yet, mirroring HardCodedConnectors install behavior.
    return c.type === CONNECTION.INJECTED_CONNECTOR_TYPE && c.id !== CONNECTION.INJECTED_CONNECTOR_ID
  })

  const hardcodedInjectedIds = HardCodedConnectors.map(c => c.id)
  const realInjectedConnectors = injectedConnectors.filter(c => !hardcodedInjectedIds.includes(c.id))

  // Special-case: Return deprecated window.ethereum connector when no eip6963 injectors are present.
  // Skip when window.ethereum is MetaMask — wagmi v3 dedupes the io.metamask EIP-6963 announcement
  // against the metaMask SDK connector's rdns, so the SDK entry is the canonical MetaMask row and
  // the generic "Browser Wallet" fallback would appear as a duplicate pointing at the same provider.
  const fallbackInjector = getConnectorWithId(
    connectors.filter(c => !hardcodedInjectedIds.includes(c.id)),
    CONNECTION.INJECTED_CONNECTOR_ID,
    { shouldThrow: true },
  )
  if (!realInjectedConnectors.length && Boolean(window.ethereum) && !window.ethereum?.isMetaMask) {
    return { injectedConnectors: [fallbackInjector], isCoinbaseWalletBrowser }
  }

  return { injectedConnectors, isCoinbaseWalletBrowser }
}

function getConnectorNameKey(connector: Connector) {
  return connector.name.trim().toLowerCase()
}

function getConnectorOrderIndex(connector: Connector) {
  const id = getConnectorOrderId(connector)
  const index = CONNECTION_ORDER.indexOf(id as any)
  return index === -1 ? Number.POSITIVE_INFINITY : index
}

// Dedupe only real injected connectors by display name. Hardcoded install/deep-link options
// are removed before this step, so they cannot replace an actual provider connector.
function dedupeInjectedConnectors(connectors: InjectableConnector[]) {
  const byName = new Map<string, InjectableConnector>()

  connectors.forEach(connector => {
    const name = getConnectorNameKey(connector)
    const existing = byName.get(name)
    if (!existing || getConnectorOrderIndex(connector) < getConnectorOrderIndex(existing)) {
      byName.set(name, connector)
    }
  })

  return Array.from(byName.values())
}

function getConnectorOrderId(connector: Connector) {
  return HardCodedConnectors.find(c => c.id === connector.id)?.realId ?? connector.id
}

type InjectableConnector = Connector & { isInjected?: boolean }
export function useOrderedConnections(): InjectableConnector[] {
  const connectors = useConnectors()

  return useMemo(() => {
    const { injectedConnectors: injectedConnectorsBase, isCoinbaseWalletBrowser } = getInjectedConnectors(connectors)
    const injectedConnectors = injectedConnectorsBase.map(c => ({ ...c, isInjected: true }))

    const metaMaskSdkConnector = getConnectorWithId(connectors, CONNECTION.METAMASK_SDK_CONNECTOR_ID)
    const coinbaseSdkConnector = getConnectorWithId(connectors, CONNECTION.COINBASE_SDK_CONNECTOR_ID)
    const walletConnectConnector = getConnectorWithId(connectors, CONNECTION.WALLET_CONNECT_CONNECTOR_ID)
    const safeConnector = getConnectorWithId(connectors, CONNECTION.SAFE_CONNECTOR_ID)
    if (isInSafeApp && safeConnector) return [safeConnector]

    const hardcodedInjectedIds = HardCodedConnectors.map(c => c.id)

    let hardcodeInjectedConnectors = connectors.filter(c => hardcodedInjectedIds.includes(c.id))

    // Keep installed/injected providers separate from hardcoded install options.
    // This lets us dedupe provider aliases without hiding install options globally.
    const injectedConnectorsWithoutHardcoded = dedupeInjectedConnectors(
      injectedConnectors.filter(c => {
        return !hardcodedInjectedIds.includes(c.id)
      }),
    )

    // remove hardcoded connectors if the real connector is present
    HardCodedConnectors.forEach(c => {
      const connector = getConnectorWithId(connectors, c.realId as any)
      if (connector) {
        hardcodeInjectedConnectors = hardcodeInjectedConnectors.filter(ic => ic.id !== c.id)
      }
    })

    if (!metaMaskSdkConnector || !coinbaseSdkConnector || !walletConnectConnector) {
      throw new Error('Expected connector(s) missing from wagmi context.')
    }

    // Special-case: In mobile in-wallet browsers, show only the wallet that injected the provider.
    // Porto can be present as an extra injected connector, but should not replace the active wallet.
    if (isMobile) {
      const mobileInjectedConnectors = injectedConnectorsWithoutHardcoded.filter(c => c.id !== CONNECTION.PORTO)
      if (mobileInjectedConnectors.length >= 1) {
        return mobileInjectedConnectors
      }
    }

    // Special-case: Only display the Coinbase connector in the Coinbase Wallet.
    if (isCoinbaseWalletBrowser) {
      return [coinbaseSdkConnector]
    }

    const orderedConnectors: InjectableConnector[] = []

    // MetaMask SDK connector — wagmi auto-dedupes the EIP-6963 io.metamask injected entry
    // via the connector's `rdns` field, so only this one represents MetaMask.
    orderedConnectors.push(metaMaskSdkConnector)

    // Other EIP-6963 injected connectors (Rabby, Phantom, Trust, etc.) the user has installed.
    orderedConnectors.push(...injectedConnectorsWithoutHardcoded)

    // Add always-available connectors before applying CONNECTION_ORDER.
    orderedConnectors.push(walletConnectConnector)
    orderedConnectors.push(coinbaseSdkConnector)
    orderedConnectors.push(...hardcodeInjectedConnectors)

    // Sort the connectors by the CONNECTION_ORDER, if not found, put at the end
    orderedConnectors.sort((a, b) => {
      const aIndex = CONNECTION_ORDER.indexOf(getConnectorOrderId(a) as any)
      const bIndex = CONNECTION_ORDER.indexOf(getConnectorOrderId(b) as any)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })

    return orderedConnectors
  }, [connectors])
}
