import { Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { CSSProperties, memo, useMemo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import Icon from 'components/Icons/Icon'
import Row from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useTokenListQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { KyberAIListType } from 'pages/TrueSightV2/types'
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

  const token0 = currencyIn?.wrapped
  const token1 = currencyOut?.wrapped
  const token0Symbol = currencyIn instanceof Token ? currencyIn.symbol : WETH[chainId].name
  const token1Symbol = currencyOut instanceof Token ? currencyOut.symbol : WETH[chainId].name

  const { data: bullish0, isFetching: fetching0 } = useTokenListQuery(
    { type: KyberAIListType.ALL, page: 1, pageSize: 5, keywords: token0?.address },
    { skip: !token0?.address, refetchOnMountOrArgChange: true },
  )
  const { data: bullish1, isFetching: fetching1 } = useTokenListQuery(
    { type: KyberAIListType.ALL, page: 1, pageSize: 5, keywords: token1?.address },
    { skip: !token1?.address, refetchOnMountOrArgChange: true },
  )

  const isFetching = fetching0 && fetching1

  const banner: { icon: string; text: string } | undefined = useMemo(() => {
    if (!token0 || !token1 || isFetching) return undefined
    const token0Bullish = bullish0 && bullish0.data.length > 0
    const token1Bullish = bullish1 && bullish1.data.length > 0
    if (!token0Bullish && !token1Bullish) {
      return undefined
    }
    if (token0Bullish && token1Bullish) {
      return { icon: 'bullish', text: t`Both ${token0Symbol} and ${token1Symbol} seems bullish right now.` }
    }
    if (token0Bullish) {
      return { icon: 'bullish', text: t`${token0Symbol} seems bullish right now.` }
    }
    if (token1Bullish) {
      return { icon: 'bullish', text: t`${token1Symbol} seems bullish right now.` }
    }
    return undefined
  }, [bullish0, bullish1, token0Symbol, token1Symbol, token0, token1, isFetching])

  if (!banner) return null

  return (
    <Container style={style}>
      <Row gap="8px">
        <Text color={theme.primary}>
          <Icon id={banner.icon} size={16} />
        </Text>
        <BannerText>
          {banner.text}{' '}
          <ExternalLink href={window.location.origin + APP_PATHS.KYBERAI_EXPLORE}>
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
  padding: 8px 16px;
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
