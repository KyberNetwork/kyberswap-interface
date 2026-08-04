import { ChainId } from '@kyberswap/ks-sdk-core'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import { Chain, Currency } from 'pages/CrossChainSwap/adapters'
import { isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { getNetworkInfo } from 'pages/CrossChainSwap/utils'
import { getNativeTokenLogo } from 'utils/tokenLogo'

export const TokenLogoWithChain = ({
  currency,
  chainId,
  size = 16,
  chainLogoStyle = {},
}: {
  currency?: Currency & Partial<{ isNative: boolean; logoURI: string; logo: string }>
  chainId: Chain
  size?: number
  chainLogoStyle?: React.CSSProperties
}) => {
  return (
    <div className="relative mr-1 flex">
      {isEvmChain(chainId) ? (
        <img
          src={(currency?.isNative ? getNativeTokenLogo(chainId as ChainId) : currency?.logoURI) || UnknownToken}
          width={size}
          height={size}
          className="rounded-full"
          alt={currency?.symbol}
        />
      ) : (
        <img src={currency?.logo} width={size} height={size} className="rounded-full" alt={currency?.symbol} />
      )}
      <img
        src={getNetworkInfo(chainId).icon}
        width={size / 2 + 'px'}
        height={size / 2 + 'px'}
        className="absolute right-[-4px] top-0 rounded-full"
        style={chainLogoStyle}
      />
    </div>
  )
}
