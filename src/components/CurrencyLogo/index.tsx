import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import React, { memo, useCallback, useMemo } from 'react'
import styled from 'styled-components'

import Logo from 'components/Logo'
import { ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useAllTokens } from 'hooks/Tokens'
import useHttpLocations from 'hooks/useHttpLocations'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { getTokenLogoURL } from 'utils'
import { getProxyTokenLogo } from 'utils/tokenInfo'

const StyledNativeCurrencyLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 4px;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  object-fit: contain;
`

export const useGetNativeTokenLogo = (chainId: ChainId | undefined) => {
  const whitelistTokens = useAllTokens(false, chainId)
  return whitelistTokens[ETHER_ADDRESS]?.logoURI || (chainId ? NETWORKS_INFO[chainId].nativeToken.logo : '')
}

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
  const nativeLogo = useGetNativeTokenLogo(currency?.chainId)

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
    return <StyledNativeCurrencyLogo src={nativeLogo} size={size} style={style} alt={`${currency.symbol}Logo`} />
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
export default memo(CurrencyLogo)
