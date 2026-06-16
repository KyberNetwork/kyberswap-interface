import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { CSSProperties, ImgHTMLAttributes, useState } from 'react'
import { HelpCircle } from 'react-feather'

import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { Chain, NonEvmChain, NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { getNativeTokenLogo, isEvmChain } from 'utils'
import { cn } from 'utils/cn'

const BAD_SRCS: { [tokenAddress: string]: true } = {}

interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  srcs: string[]
  size?: string | number
}

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert.
 */
export default function Logo({ srcs, alt, ...rest }: LogoProps) {
  const [, refresh] = useState<number>(0)

  const src: string | undefined = srcs.find(s => !BAD_SRCS[s])

  if (src) {
    return (
      <img
        {...rest}
        alt={alt}
        src={src}
        onError={() => {
          if (src) BAD_SRCS[src] = true
          refresh(i => i + 1)
        }}
      />
    )
  }

  return <HelpCircle {...(rest as any)} />
}

export function NetworkLogo({ chainId, style = {} }: { chainId: Chain; style?: CSSProperties }) {
  const chainInfo = isEvmChain(chainId) ? NETWORKS_INFO[chainId as ChainId] : NonEvmChainInfo[chainId as NonEvmChain]

  if (!chainInfo?.icon) return null
  return <img src={chainInfo.icon} alt="Switch Network" style={style} />
}

export function TokenLogoWithChain(data: { tokenLogo: string; chainId: ChainId; size: number | string }): JSX.Element
export function TokenLogoWithChain(data: { size: number | string; currency: Currency | WrappedTokenInfo }): JSX.Element
export function TokenLogoWithChain(data: any) {
  const { tokenLogo: tokenLogoParam, chainId: chainParam, size, currency } = data

  const chainId: ChainId = currency?.chainId || chainParam
  const nativeLogo = getNativeTokenLogo(chainId)
  const tokenLogo = (currency?.isNative ? nativeLogo : currency?.logoURI) || tokenLogoParam
  const ratio = 0.7
  const networkSize = ratio * parseInt(size + '')

  return (
    <div style={{ position: 'relative', height: size }}>
      <Logo srcs={[tokenLogo ?? '']} style={{ width: size, height: size, borderRadius: '4px' }} />
      <NetworkLogo
        chainId={chainId}
        style={{
          position: 'absolute',
          width: networkSize,
          height: networkSize,
          top: -8 * ratio,
          right: -8 * ratio,
          zIndex: 1,
        }}
      />
    </div>
  )
}

// Soft white halo (4px close + 70px wide bloom) at 20% alpha.
const shadowClasses = 'shadow-[0_4px_5px_0_rgba(255,255,255,0.2),0_1px_70px_0_rgba(255,255,255,0.2)]'

export const TokenLogoWithShadow = ({ size, style, className, ...rest }: LogoProps & { size?: string }) => (
  <Logo
    {...rest}
    style={{ width: size, height: size, ...style }}
    className={cn('rounded-full', shadowClasses, className)}
  />
)
TokenLogoWithShadow.displayName = 'TokenLogoWithShadow'
