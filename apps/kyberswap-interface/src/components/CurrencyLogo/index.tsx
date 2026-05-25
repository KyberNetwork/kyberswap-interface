import { Currency } from '@kyberswap/ks-sdk-core'
import React, { memo, useCallback, useMemo } from 'react'

import Logo from 'components/Logo'
import useHttpLocations from 'hooks/useHttpLocations'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { getNativeTokenLogo, getTokenLogoURL } from 'utils'
import { cn } from 'utils/cn'
import { getProxyTokenLogo } from 'utils/tokenInfo'

const baseShadow = 'shadow-[0px_6px_10px_rgba(0,0,0,0.075)]'

function CurrencyLogo({
  currency,
  size = '24px',
  style,
  useProxy = false,
}: {
  currency?: Currency | WrappedTokenInfo | null
  size?: string
  style?: React.CSSProperties
  useProxy?: boolean
}) {
  const wrapWithProxy = useCallback(
    <T extends string | undefined>(uri: T): T | string => {
      if (!useProxy || !uri) {
        return uri
      }
      return getProxyTokenLogo(uri)
    },
    [useProxy],
  )

  const logoURI = currency instanceof WrappedTokenInfo ? currency?.logoURI : undefined
  const uriLocations = useHttpLocations(wrapWithProxy(logoURI))

  const srcs: string[] = useMemo(() => {
    if (currency?.isNative) return []

    if (currency?.isToken) {
      if (logoURI) {
        return [...uriLocations, wrapWithProxy(getTokenLogoURL(currency.address, currency.chainId))]
      }
      return [wrapWithProxy(getTokenLogoURL((currency as any)?.address, currency.chainId))]
    }

    return []
  }, [currency, logoURI, uriLocations, wrapWithProxy])

  if (currency?.isNative) {
    return (
      <img
        src={getNativeTokenLogo(currency?.chainId)}
        style={{ width: size, height: size, minWidth: size, ...style }}
        alt={`${currency.symbol} Logo`}
        className={cn('rounded-3xl', baseShadow)}
      />
    )
  }

  return (
    <Logo
      srcs={srcs}
      alt={`${currency?.symbol ?? 'token'} logo`}
      style={{ width: size, height: size, ...style }}
      className={cn('rounded object-contain', baseShadow)}
    />
  )
}

export default memo(CurrencyLogo)
