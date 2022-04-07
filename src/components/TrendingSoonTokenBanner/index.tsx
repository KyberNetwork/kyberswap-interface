import React, { CSSProperties } from 'react'
import { Flex } from 'rebass'
import { Currency, Token } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from 'hooks'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { Trans } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import { ExternalLink } from 'theme'
import styled from 'styled-components'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import useIsTokenTrendingSoon from 'pages/TrueSight/hooks/useIsTokenTrendingSoon'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'
import { nativeNameFromETH } from 'hooks/useMixpanel'

const TrendingSoonTokenBanner = ({
  currency0,
  currency1,
  style,
}: {
  currency0?: Currency
  currency1?: Currency
  style?: CSSProperties
}) => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  const token0 = wrappedCurrency(currency0, chainId)
  const token1 = wrappedCurrency(currency1, chainId)
  const isToken0TrendingSoon = useIsTokenTrendingSoon(token0)
  const isToken1TrendingSoon = useIsTokenTrendingSoon(token1)
  const trendingSoonCurrency = isToken0TrendingSoon ? currency0 : isToken1TrendingSoon ? currency1 : undefined

  if (trendingSoonCurrency === undefined) return null

  return (
    <Container style={style}>
      <DiscoverIconWrapper>
        <DiscoverIcon size={20} color={theme.primary} />
      </DiscoverIconWrapper>
      <BannerText>
        <span>
          <Trans>We think</Trans>
        </span>
        <CurrencyLogo currency={trendingSoonCurrency} size="16px" />
        <span>{trendingSoonCurrency instanceof Token ? trendingSoonCurrency.symbol : nativeNameFromETH(chainId)}</span>
        <span>
          <Trans>might be trending soon!</Trans>
        </span>
      </BannerText>
      <BannerText>
        <span>
          <Trans>See</Trans>
        </span>
        <ExternalLink href={window.location.origin + '/#/discover?tab=trending_soon'} target="_blank">
          <Trans>here</Trans>
        </ExternalLink>
      </BannerText>
    </Container>
  )
}

const Container = styled.div`
  background: ${({ theme }) => rgba(theme.primary, 0.25)};
  border-radius: 4px;
  padding: 8px 12px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  row-gap: 4px;
  column-gap: 12px;
`

const DiscoverIconWrapper = styled.div`
  grid-row: 1 / -1;
  place-self: center;
  height: 24px;
`

const BannerText = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;

  > * {
    margin-right: 4px;
  }
`

export default TrendingSoonTokenBanner
