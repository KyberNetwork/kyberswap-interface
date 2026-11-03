import { useEffect, useRef } from 'react'
import { useConfig } from 'wagmi'

import { MetaMaskMobilePrompt } from 'components/Header/web3/WalletModal/MetaMaskMobilePrompt'
import { useOrderedConnections } from 'components/Header/web3/WalletModal/useConnections'
import { ReceiverWalletModal } from 'components/SwapForm/CrossChain/ReceiverWalletModal'
import { readEvmReceiver } from 'components/SwapForm/CrossChain/readEvmReceiver'
import type { SwapWalletConnection } from 'components/SwapForm/CrossChain/walletConnection'
import { CONNECTOR_ICON_OVERRIDE_MAP, registerPortoConnector } from 'components/Web3Provider'
import { setMetaMaskMobileLink, useMetaMaskMobileLink } from 'components/Web3Provider/metamaskMobileLink'
import type { Chain } from 'types/crossChain'

export const EvmReceiverWalletModal = (props: {
  chain: Chain
  onSelect: (wallet: SwapWalletConnection) => void
  onDismiss: () => void
}) => {
  const config = useConfig()
  const metaMaskLink = useMetaMaskMobileLink()
  const active = useRef(true)
  const connectors = useOrderedConnections()

  const wallets = connectors.map(connector => ({
    id: connector.id,
    name: connector.name,
    icon: CONNECTOR_ICON_OVERRIDE_MAP[connector.id] ?? connector.icon ?? '',
    installed: !!connector.isInjected,
    connect: async () => {
      setMetaMaskMobileLink(null)
      try {
        return await readEvmReceiver(connector, config)
      } finally {
        if (active.current) setMetaMaskMobileLink(null)
      }
    },
  }))

  // Each modal session owns its mobile handoff; a late completion must not clear the next session's link.
  useEffect(() => {
    active.current = true
    setMetaMaskMobileLink(null)
    void registerPortoConnector()
    return () => {
      active.current = false
      setMetaMaskMobileLink(null)
    }
  }, [])

  return (
    <ReceiverWalletModal
      {...props}
      wallets={wallets}
      loading={false}
      error=""
      connectionPrompt={metaMaskLink ? <MetaMaskMobilePrompt link={metaMaskLink} /> : undefined}
    />
  )
}
