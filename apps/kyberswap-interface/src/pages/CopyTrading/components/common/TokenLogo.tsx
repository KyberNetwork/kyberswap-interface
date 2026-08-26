import { useMemo } from 'react'

import CurrencyLogo from 'components/CurrencyLogo'
import Logo from 'components/Logo'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

export type CopyTradingTokenLogoToken = {
  address?: string
  chainId?: number | string
  decimals?: number
  logoUrl?: string
  name?: string
  symbol?: string
}

type CopyTradingTokenLogoProps = {
  fallbackChainId: number
  size?: string
  token?: CopyTradingTokenLogoToken
}

const CopyTradingTokenLogo = ({ fallbackChainId, size = '20px', token }: CopyTradingTokenLogoProps) => {
  const chainId = Number(token?.chainId) || fallbackChainId
  const currency = useMemo(() => {
    if (!token?.address || !chainId) return undefined

    try {
      return new WrappedTokenInfo({
        address: token.address,
        chainId,
        decimals: token.decimals ?? 0,
        logoURI: token.logoUrl,
        name: token.name || token.symbol || 'Token',
        symbol: token.symbol || 'Token',
      })
    } catch {
      return undefined
    }
  }, [chainId, token?.address, token?.decimals, token?.logoUrl, token?.name, token?.symbol])

  return (
    <span className="inline-flex shrink-0" style={{ width: size, height: size }}>
      {currency ? (
        <CurrencyLogo currency={currency} size={size} />
      ) : (
        <Logo
          srcs={token?.logoUrl ? [token.logoUrl] : []}
          alt={`${token?.symbol || 'Token'} logo`}
          className="rounded-full object-contain"
          style={{ width: size, height: size }}
        />
      )}
    </span>
  )
}

export default CopyTradingTokenLogo
