import { CrossChainWalletSelector } from 'components/SwapWallets/CrossChainWalletSelector'
import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useDisconnectWallet from 'hooks/web3/useDisconnectWallet'
import { useWalletModalToggle } from 'state/application/hooks'
import type { Chain } from 'types/crossChain'

export const CrossChainEvmSenderWalletSelector = ({ chain }: { chain: Chain }) => {
  const { account } = useActiveWeb3React()
  const { connector } = useWeb3React()
  const openWallet = useWalletModalToggle()
  const disconnect = useDisconnectWallet()
  const wallets = useSwapWallets()

  // Unified Swap owns the displayed session and its actions, including an empty
  // slot. Only consumers outside that controller use the app-wallet fallback.
  if (wallets) {
    return (
      <CrossChainWalletSelector
        role="sender"
        chain={chain}
        wallet={
          wallets.inputConnection && wallets.inputAddress
            ? {
                ...wallets.inputConnection,
                address: wallets.inputAddress,
                icon: CONNECTOR_ICON_OVERRIDE_MAP[wallets.inputConnection.id] ?? wallets.inputConnection.icon,
              }
            : undefined
        }
        onConnect={wallets.connectInput}
        onDisconnect={wallets.disconnectInput}
      />
    )
  }

  return (
    <CrossChainWalletSelector
      role="sender"
      chain={chain}
      wallet={
        account
          ? {
              id: connector?.id || '',
              name: connector?.name || '',
              icon: CONNECTOR_ICON_OVERRIDE_MAP[connector?.id || ''] ?? connector?.icon ?? '',
              address: account,
            }
          : undefined
      }
      onConnect={openWallet}
      onDisconnect={disconnect}
    />
  )
}
