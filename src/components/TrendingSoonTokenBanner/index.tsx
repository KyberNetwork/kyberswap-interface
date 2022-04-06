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

  return (
    <Container style={style}>
      <DiscoverIconWrapper>
        <DiscoverIcon size={20} color={theme.primary} />
      </DiscoverIconWrapper>
      <Text>
        <span>
          <Trans>We think</Trans>
        </span>
        {isToken0TrendingSoon && currency0 && (
          <>
            <CurrencyLogoWrapper>
              <CurrencyLogo currency={currency0} size="16px" />
            </CurrencyLogoWrapper>
            <span>{currency0 instanceof Token ? currency0.symbol : nativeNameFromETH(chainId)}</span>
          </>
        )}
        {isToken0TrendingSoon && isToken1TrendingSoon && (
          <span>
            <Trans>and</Trans>
          </span>
        )}
        {isToken1TrendingSoon && currency1 && (
          <>
            <CurrencyLogoWrapper>
              <CurrencyLogo currency={currency1} size="16px" />
            </CurrencyLogoWrapper>
            <span>{currency1.symbol}</span>
          </>
        )}
        <span>
          <Trans>might be trending soon!</Trans>
        </span>
      </Text>
      <Text>
        <span>
          <Trans>See</Trans>
        </span>
        <ExternalLink href={window.location.origin + '/#/discover?tab=trending_soon'} target="_blank">
          <Trans>here</Trans>
        </ExternalLink>
      </Text>
    </Container>
  )
}

const Container = styled.div`
  background: ${({ theme }) => rgba(theme.bg8, 0.25)};
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
`

const Text = styled.div`
  font-size: 12px;

  > * {
    margin-right: 4px;
  }
`

const CurrencyLogoWrapper = styled.div`
  display: inline-block;
  transform: translateY(3.5px);
`

export default TrendingSoonTokenBanner
