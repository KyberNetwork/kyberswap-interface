import { Token } from '@kyberswap/ks-sdk-core'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { RowFixed } from 'components/Row'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import { getTokenLogoURL } from 'utils'

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
`

export default function AddTokenToMetaMask({ token }: { token: Token }) {
  const { chainId, walletKey } = useActiveWeb3React()

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
  if (!walletKey) return null
  if (walletKey === 'WALLET_CONNECT') return null
  if (walletKey === 'COINBASE') return null // Coinbase wallet no need to add since it automatically track token
  return (
    <ButtonEmpty mt="12px" padding="0" width="fit-content" onClick={addToMetaMask}>
      <RowFixed>
        <StyledLogo src={SUPPORTED_WALLETS[walletKey].icon} />
      </RowFixed>
    </ButtonEmpty>
  )
}
