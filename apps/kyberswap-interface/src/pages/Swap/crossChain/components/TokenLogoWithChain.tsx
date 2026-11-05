import { ChainId } from '@kyberswap/ks-sdk-core'

import Logo from 'components/Logo'
import { getNetworkInfo } from 'pages/Swap/crossChain/utils'
import { Chain, Currency, isEvmChain } from 'types/crossChain'
import { isNativeAsset } from 'utils/nativeErc20'
import { getNativeTokenLogo, getTokenLogoURL } from 'utils/tokenLogo'

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
  const tokenLogo =
    isEvmChain(chainId) && currency && !isNativeAsset(currency)
      ? currency.logoURI || ('address' in currency ? getTokenLogoURL(currency.address, chainId as ChainId) : '')
      : ''

  return (
    <div className="relative mr-1 flex">
      {isEvmChain(chainId) ? (
        <Logo
          srcs={[isNativeAsset(currency) ? getNativeTokenLogo(chainId as ChainId) : tokenLogo]}
          width={size}
          height={size}
          className="rounded-full"
          alt={currency?.symbol}
        />
      ) : (
        <Logo
          srcs={[currency?.logo || '']}
          width={size}
          height={size}
          className="rounded-full"
          alt={currency?.symbol}
        />
      )}
      <img
        src={getNetworkInfo(chainId).icon}
        className="absolute right-[-4px] top-[-2px] size-[10px] rounded-full"
        style={chainLogoStyle}
      />
    </div>
  )
}
