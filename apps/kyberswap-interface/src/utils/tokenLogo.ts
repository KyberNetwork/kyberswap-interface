import { ChainId, WETH } from '@kyberswap/ks-sdk-core'

import KNCLogoUrl from 'assets/images/KNC.svg'
import KNCLLogoUrl from 'assets/images/KNCL.png'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { KNCL_ADDRESS, KNC_ADDRESS } from 'constants/tokens'
import store from 'state'
import type { TokenAddressMap } from 'state/lists/reducer'
import { isAddress } from 'utils/address'

export const getNativeTokenLogo = (
  chainId: ChainId,
  tokens: TokenAddressMap[number] = store.getState()?.lists?.mapWhitelistTokens?.[chainId],
) => {
  return tokens?.[ETHER_ADDRESS]?.logoURI || (chainId ? NETWORKS_INFO[chainId].nativeToken.logo : '')
}

export const getTokenLogoURL = (
  inputAddress: string,
  chainId: ChainId,
  tokens: TokenAddressMap[number] = store.getState()?.lists?.mapWhitelistTokens?.[chainId],
): string => {
  let address = inputAddress
  if (address === ZERO_ADDRESS) {
    address = WETH[chainId].address
  }

  if (address.toLowerCase() === KNC_ADDRESS.toLowerCase()) {
    return KNCLogoUrl
  }

  if (address.toLowerCase() === KNCL_ADDRESS.toLowerCase()) {
    return KNCLLogoUrl
  }

  // WBTC
  if (address.toLowerCase() === '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f') {
    return 'https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744'
  }

  const normalizedAddress = isAddress(chainId, address.toLowerCase()) || address
  const imageURL =
    tokens?.[normalizedAddress]?.logoURI || tokens?.[address]?.logoURI || tokens?.[address.toLowerCase()]?.logoURI
  return imageURL || ''
}
