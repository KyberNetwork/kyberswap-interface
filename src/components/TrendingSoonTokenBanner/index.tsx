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
import { NETWORK_TO_CHAINID } from 'pages/TrueSightV2/constants'
import { useTokenDetailQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { KyberAIListType } from 'pages/TrueSightV2/types'
import { useIsWhiteListKyberAI } from 'state/user/hooks'
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
  const { chainId, account } = useActiveWeb3React()
  const { isWhiteList } = useIsWhiteListKyberAI()
  const chain = Object.keys(NETWORK_TO_CHAINID).find(i => NETWORK_TO_CHAINID[i] === chainId)

  const theme = useTheme()

  const token0 = currencyIn?.wrapped
  const token1 = currencyOut?.wrapped
  const token0Symbol = currencyIn instanceof Token ? currencyIn.symbol : WETH[chainId].name
  const token1Symbol = currencyOut instanceof Token ? currencyOut.symbol : WETH[chainId].name

  const { data: tokenOverview0, isFetching: fetching0 } = useTokenDetailQuery(
    { address: token0?.address, chain },
    { skip: !token0?.address || !account || !isWhiteList, refetchOnMountOrArgChange: true },
  )

  const { data: tokenOverview1, isFetching: fetching1 } = useTokenDetailQuery(
    { address: token1?.address, chain },
    { skip: !token1?.address || !account || !isWhiteList, refetchOnMountOrArgChange: true },
  )

  const isFetching = fetching0 && fetching1

  const banner: { icon: string; text: string; redirectUrl?: string; color?: string } | undefined = useMemo(() => {
    if (!tokenOverview0 || !tokenOverview1 || isFetching) return undefined
    const token0Bullish =
      tokenOverview0.kyberScore && tokenOverview0.kyberScore.label !== '' && tokenOverview0.kyberScore.score > 64

    const token1Bullish =
      tokenOverview1.kyberScore && tokenOverview1.kyberScore.label !== '' && tokenOverview1.kyberScore?.score > 64

    const token0Bearish =
      tokenOverview0.kyberScore && tokenOverview0.kyberScore.label !== '' && tokenOverview0.kyberScore?.score < 33

    const token1Bearish =
      tokenOverview1.kyberScore && tokenOverview1.kyberScore.label !== '' && tokenOverview1.kyberScore?.score < 33

    if (token0Bullish && token1Bullish) {
      return {
        icon: 'bullish',
        text: t`Both ${token0Symbol} and ${token1Symbol} seem bullish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_RANKINGS + `?type=${KyberAIListType.BULLISH}`,
      }
    }
    if (token0Bearish && token1Bearish) {
      return {
        icon: 'bearish',
        text: t`Both ${token0Symbol} and ${token1Symbol} seem bearish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_RANKINGS + `?type=${KyberAIListType.BEARISH}`,
        color: theme.red,
      }
    }
    if (token0Bullish && token1Bearish) {
      return {
        icon: 'bearish',
        text: t`${token0Symbol} seems bullish while ${token1Symbol} seems bearish right now.`,
        color: theme.warning,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_RANKINGS + `?type=${KyberAIListType.BULLISH}`,
      }
    }
    if (token1Bullish && token0Bearish) {
      return {
        icon: 'bearish',
        text: t`${token1Symbol} seems bullish while ${token0Symbol} seems bearish right now.`,
        color: theme.warning,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_RANKINGS + `?type=${KyberAIListType.BULLISH}`,
      }
    }
    if (token0Bullish) {
      return {
        icon: 'bullish',
        text: t`${token0Symbol} seems bullish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_EXPLORE + `/${chain}/${tokenOverview0.address}`,
      }
    }
    if (token1Bullish) {
      return {
        icon: 'bullish',
        text: t`${token1Symbol} seems bullish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_EXPLORE + `/${chain}/${tokenOverview1.address}`,
      }
    }
    if (token0Bearish) {
      return {
        icon: 'bearish',
        text: t`${token0Symbol} seems bearish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_EXPLORE + `/${chain}/${tokenOverview0?.address}`,
        color: theme.red,
      }
    }
    if (token1Bearish) {
      return {
        icon: 'bearish',
        text: t`${token1Symbol} seems bearish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_EXPLORE + `/${chain}/${tokenOverview1?.address}`,
        color: theme.red,
      }
    }
    return undefined
  }, [isFetching, tokenOverview0, tokenOverview1, chain, token0Symbol, token1Symbol, theme])

  if (!banner || !isWhiteList || !account) return null

  return (
    <Container style={style} color={banner.color}>
      <Row gap="8px">
        <Text color={banner.color || theme.primary}>
          <Icon id={banner.icon} size={16} />
        </Text>
        <BannerText>
          {banner.text}{' '}
          <ExternalLink href={banner.redirectUrl || '#'} style={{ color: banner.color || theme.primary }}>
            <Trans>See here</Trans>
          </ExternalLink>
        </BannerText>
      </Row>
    </Container>
  )
}

const Container = styled.div<{ color?: string }>`
  background: ${({ theme, color }) => rgba(color || theme.primary, 0.25)};
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
