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
    { type: KyberAIListType.BULLISH, page: 1, pageSize: 5, keywords: token0?.address },
    { skip: !token0?.address, refetchOnMountOrArgChange: true },
  )
  const { data: bullish1, isFetching: fetching1 } = useTokenListQuery(
    { type: KyberAIListType.BULLISH, page: 1, pageSize: 5, keywords: token1?.address },
    { skip: !token1?.address, refetchOnMountOrArgChange: true },
  )
  const { data: bearish0, isFetching: fetching2 } = useTokenListQuery(
    { type: KyberAIListType.BEARISH, page: 1, pageSize: 5, keywords: token0?.address },
    { skip: !token0?.address, refetchOnMountOrArgChange: true },
  )
  const { data: bearish1, isFetching: fetching3 } = useTokenListQuery(
    { type: KyberAIListType.BEARISH, page: 1, pageSize: 5, keywords: token1?.address },
    { skip: !token1?.address, refetchOnMountOrArgChange: true },
  )

  const isFetching = fetching0 && fetching1 && fetching2 && fetching3

  const banner: { icon: string; text: string; redirectUrl?: string } | undefined = useMemo(() => {
    if (!token0 || !token1 || isFetching) return undefined

    const token0Bullish = bullish0 && bullish0.data.length === 1
    const token1Bullish = bullish1 && bullish1.data.length === 1
    const token0Bearish = bearish0 && bearish0.data.length === 1
    const token1Bearish = bearish1 && bearish1.data.length === 1
    const chain = Object.keys(NETWORK_TO_CHAINID).find(i => NETWORK_TO_CHAINID[i] === chainId)
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
      }
    }
    if (token0Bullish && token1Bearish) {
      return { icon: 'bearish', text: t`${token0Symbol} seems bullish while ${token1Symbol} seems bearish right now.` }
    }
    if (token1Bullish && token0Bearish) {
      return { icon: 'bearish', text: t`${token1Symbol} seems bullish while ${token0Symbol} seems bearish right now.` }
    }
    if (token0Bullish) {
      const token = bullish0.data[0].tokens.find(t => t.chain === chain)
      return {
        icon: 'bullish',
        text: t`${token0Symbol} seems bullish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_EXPLORE + `/${chain}/${token?.address}`,
      }
    }
    if (token1Bullish) {
      const token = bullish1.data[0].tokens.find(t => t.chain === chain)
      return {
        icon: 'bullish',
        text: t`${token1Symbol} seems bullish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_EXPLORE + `/${chain}/${token?.address}`,
      }
    }
    if (token0Bearish) {
      const token = bearish0.data[0].tokens.find(t => t.chain === chain)
      return {
        icon: 'bearish',
        text: t`${token0Symbol} seems bearish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_EXPLORE + `/${chain}/${token?.address}`,
      }
    }
    if (token1Bearish) {
      const token = bearish1.data[0].tokens.find(t => t.chain === chain)
      return {
        icon: 'bearish',
        text: t`${token1Symbol} seems bearish right now.`,
        redirectUrl: window.location.origin + APP_PATHS.KYBERAI_EXPLORE + `/${chain}/${token?.address}`,
      }
    }
    return undefined
  }, [bullish0, bullish1, bearish0, bearish1, token0Symbol, token1Symbol, token0, token1, isFetching, chainId])

  if (!banner) return null

  return (
    <Container style={style}>
      <Row gap="8px">
        <Text color={theme.primary}>
          <Icon id={banner.icon} size={16} />
        </Text>
        <BannerText>
          {banner.text}{' '}
          <ExternalLink href={banner.redirectUrl || '#'}>
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
