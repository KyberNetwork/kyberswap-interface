import { Token } from '@kyberswap/ks-sdk-core'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { RowFixed } from 'components/Row'
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { getTokenLogoURL } from 'utils'

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
`

export default function AddTokenToMetaMask({ token }: { token: Token }) {
  const { chainId, walletKey } = useActiveWeb3React()
  const { connector } = useWeb3React()

  async function addToMetaMask() {
    const tokenAddress = token.address
    const tokenSymbol = token.symbol
    const tokenDecimals = token.decimals
    const tokenImage = getTokenLogoURL(token.address, chainId)

    try {
      await window.ethereum?.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      })
    } catch (error) {
      console.error(error)
    }
  }
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector?.id || ''] ?? connector?.icon

  if (!walletKey || !icon) return null
  if (walletKey === 'WalletConnect') return null
  if (walletKey === 'COINBASE') return null // Coinbase wallet no need to add since it automatically track token
  return (
    <ButtonEmpty mt="12px" padding="0" width="fit-content" onClick={addToMetaMask}>
      <RowFixed>
        <StyledLogo src={icon} />
      </RowFixed>
    </ButtonEmpty>
  )
}
