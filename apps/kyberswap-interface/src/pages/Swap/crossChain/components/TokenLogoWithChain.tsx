import Logo from 'components/Logo'
import { useTokenLogo } from 'pages/Swap/crossChain/hooks/useTokenLogo'
import { getNetworkInfo } from 'pages/Swap/crossChain/utils'
import { Chain, Currency } from 'types/crossChain'

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
  const tokenLogo = useTokenLogo(currency, chainId)

  return (
    <div className="relative mr-1 flex">
      <Logo srcs={[tokenLogo]} width={size} height={size} className="rounded-full" alt={currency?.symbol} />
      <img
        src={getNetworkInfo(chainId).icon}
        className="absolute right-[-4px] top-[-2px] size-[10px] rounded-full"
        style={chainLogoStyle}
      />
    </div>
  )
}
