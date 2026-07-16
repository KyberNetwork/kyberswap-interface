import { ChainId, WETH } from '@kyberswap/ks-sdk-core'

import KNCLogoUrl from 'assets/images/KNC.svg'
import KNCLLogoUrl from 'assets/images/KNCL.png'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { KNCL_ADDRESS, KNC_ADDRESS } from 'constants/tokens'
import store from 'state'

export const getNativeTokenLogo = (chainId: ChainId) => {
  return (
    store.getState()?.lists?.mapWhitelistTokens?.[chainId]?.[ETHER_ADDRESS]?.logoURI ||
    (chainId ? NETWORKS_INFO[chainId].nativeToken.logo : '')
  )
}

export const getTokenLogoURL = (inputAddress: string, chainId: ChainId): string => {
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

  const imageURL = store.getState()?.lists?.mapWhitelistTokens?.[chainId]?.[address]?.logoURI
  return imageURL || ''
}
