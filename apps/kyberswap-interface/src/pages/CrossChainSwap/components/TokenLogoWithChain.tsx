import { ChainId, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'

import { getNativeTokenLogo, isEvmChain } from 'utils'

import { Chain, Currency } from '../adapters'
import { getNetworkInfo } from '../utils'

export const TokenLogoWithChain = ({
  currency,
  chainId,
  size = 16,
  chainLogoStyle = {},
}: {
  currency?: Currency
  chainId: Chain
  size?: number
  chainLogoStyle?: React.CSSProperties
}) => {
  return (
    <div className="relative mr-1 flex">
      {isEvmChain(chainId) ? (
        <img
          src={
            (currency as EvmCurrency)?.isNative ? getNativeTokenLogo(chainId as ChainId) : (currency as any)?.logoURI
          }
          width={size}
          height={size}
          className="rounded-full"
          alt={currency?.symbol}
        />
      ) : (
        <img src={(currency as any)?.logo} width={size} height={size} className="rounded-full" alt={currency?.symbol} />
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
