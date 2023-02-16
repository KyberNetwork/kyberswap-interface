import { Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { CSSProperties, memo, useMemo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import Icon from 'components/Icons/Icon'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { FadeIn } from 'utils/keyframes'

const TrendingSoonTokenBanner = ({
  currencyIn,
  currencyOut,
  style,
}: {
  style?: CSSProperties
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}) => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const token0 = currencyIn?.wrapped
  const trendingSoonCurrency = useMemo(() => token0, [token0])

  if (trendingSoonCurrency === undefined) return null

  const currencySymbol = trendingSoonCurrency instanceof Token ? trendingSoonCurrency.symbol : WETH[chainId].name

  return (
    <Container style={style}>
      <Row gap="8px">
        <Text color={theme.primary}>
          <Icon id="bullish" size={16} />
        </Text>
        <BannerText>
          {currencySymbol} <Trans>seems bullish right now.</Trans>{' '}
          <ExternalLink
            href={window.location.origin + '/discover/single-token'}
            target="_blank"
            onClickCapture={() => {
              mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_SEE_HERE_CLICKED, { trending_token: currencySymbol })
            }}
            style={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            <Trans>See here</Trans>
          </ExternalLink>
        </BannerText>
      </Row>
    </Container>
  )
}

const Container = styled.div`
  background: ${({ theme }) => rgba(theme.primary, 0.25)};
  border-radius: 999px;
  padding: 8px 12px;
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 4px;
  column-gap: 8px;
  animation: ${FadeIn} 0.3s linear;
`
const BannerText = styled.div`
  font-size: 12px;
`

export default memo(TrendingSoonTokenBanner)
