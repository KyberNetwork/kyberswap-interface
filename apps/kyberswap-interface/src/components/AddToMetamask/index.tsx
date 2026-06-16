import { Token } from '@kyberswap/ks-sdk-core'
import { useWatchAsset } from 'wagmi'

import { ButtonEmpty } from 'components/Button'
import { RowFixed } from 'components/Row'
import { CONNECTION, CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { getTokenLogoURL } from 'utils'

export default function AddTokenToMetaMask({ token }: { token: Token }) {
  const { chainId, walletKey } = useActiveWeb3React()
  const { connector } = useWeb3React()
  // Routes wallet_watchAsset through the active connector's provider so it works for the
  // metaMask SDK on mobile (no window.ethereum) as well as desktop injected wallets.
  const { mutate: watchAsset } = useWatchAsset()

  function addToMetaMask() {
    watchAsset(
      {
        type: 'ERC20',
        options: {
          address: token.address,
          symbol: token.symbol ?? '',
          decimals: token.decimals,
          image: getTokenLogoURL(token.address, chainId),
        },
      },
      {
        onError: error => {
          console.error(error)
        },
      },
    )
  }
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector?.id || ''] ?? connector?.icon

  if (!walletKey || !icon) return null
  // walletKey is the connector id; match the wagmi v3 ids exactly.
  // Coinbase auto-tracks tokens; WalletConnect-paired wallets often don't support wallet_watchAsset.
  if (walletKey === CONNECTION.WALLET_CONNECT_CONNECTOR_ID) return null
  if (walletKey === CONNECTION.COINBASE_SDK_CONNECTOR_ID) return null
  return (
    <ButtonEmpty mt="12px" padding="0" width="fit-content" onClick={addToMetaMask}>
      <RowFixed>
        <img src={icon} className="size-4" alt="" />
      </RowFixed>
    </ButtonEmpty>
  )
}
