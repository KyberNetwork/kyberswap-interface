import { Currency } from '@kyberswap/ks-sdk-core'
import { transparentize } from 'polished'
import { memo, useMemo } from 'react'
import { ArrowRight } from 'react-feather'
import { useNavigate } from 'react-router'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import bannerBackground from 'assets/images/truesight-v2/banner-background.png'
import Column from 'components/Column'
import ApeIcon from 'components/Icons/ApeIcon'
import Row, { RowBetween, RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import KyberScoreMeter from 'pages/TrueSightV2/components/KyberScoreMeter'
import { NETWORK_TO_CHAINID } from 'pages/TrueSightV2/constants'
import { SUPPORTED_NETWORK_KYBERAI } from 'pages/TrueSightV2/constants/index'
import { useTokenDetailQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { ITokenOverview } from 'pages/TrueSightV2/types'
import { calculateValueToColor } from 'pages/TrueSightV2/utils'
import { useIsWhiteListKyberAI } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'

const TrendingSoonTokenBanner = ({
  currencyIn,
  currencyOut,
}: {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}) => {
  const { chainId, account } = useActiveWeb3React()
  const { isWhiteList } = useIsWhiteListKyberAI()
  const navigate = useNavigate()
  const chain = Object.keys(NETWORK_TO_CHAINID).find(i => NETWORK_TO_CHAINID[i] === chainId)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()

  const token0 = currencyIn?.wrapped
  const token1 = currencyOut?.wrapped

  const { data: tokenInputOverview, isFetching: fetching0 } = useTokenDetailQuery(
    { address: token0?.address, chain },
    { skip: !token0?.address || !account || !isWhiteList, refetchOnMountOrArgChange: true },
  )

  const { data: tokenOutputOverview, isFetching: fetching1 } = useTokenDetailQuery(
    { address: token1?.address, chain },
    { skip: !token1?.address || !account || !isWhiteList, refetchOnMountOrArgChange: true },
  )

  const { data: tokenNativeOverview, isFetching: fetching2 } = useTokenDetailQuery(
    { address: NativeCurrencies[chainId].wrapped.address, chain },
    { skip: !account || !isWhiteList, refetchOnMountOrArgChange: true },
  )

  const isFetching = fetching0 || fetching1 || fetching2

  const token: ITokenOverview | undefined = useMemo(() => {
    if (isFetching) return undefined

    const token =
      tokenInputOverview?.kyberScore && tokenInputOverview.kyberScore.label !== ''
        ? tokenInputOverview
        : tokenOutputOverview?.kyberScore && tokenOutputOverview.kyberScore.label !== ''
        ? tokenOutputOverview
        : tokenNativeOverview?.kyberScore && tokenNativeOverview.kyberScore.label !== ''
        ? tokenNativeOverview
        : undefined

    return token
  }, [isFetching, tokenInputOverview, tokenOutputOverview, tokenNativeOverview])

  if (!token || !isWhiteList || !account) return null

  const color = calculateValueToColor(token?.kyberScore?.score || 0, theme)
  return (
    <Wrapper>
      {above768 ? (
        <Container color={color}>
          <RowFit gap="8px">
            <img src={token?.logo} width="32" height="32" style={{ borderRadius: '50%' }} />
            <Column gap="4px">
              <Text color={theme.text}>{token?.symbol?.toUpperCase() || '--'} seems to be</Text>
              <Text color={color} fontWeight={600}>
                {token?.kyberScore.label || '--'}
              </Text>
            </Column>
          </RowFit>
          <SkewKyberScoreWrapper>
            <KyberScoreMeter value={33} noAnimation fontSize="18px" hiddenValue style={{ height: '32px' }} />
            <RowFit fontSize="10px" gap="4px">
              <ApeIcon size={14} /> KyberScore
            </RowFit>
          </SkewKyberScoreWrapper>
          <Column gap="4px" padding="0 26px">
            <Text fontSize="12px">
              Want to know the <b style={{ color: theme.text }}>KyberScore</b> for{' '}
              {token?.symbol?.toUpperCase() || 'KNC'}?
            </Text>
            <RowFit fontSize="12px" gap="4px">
              Explore with <span style={{ color: theme.primary }}>KyberAI</span> here!{' '}
              <ArrowRight
                size={14}
                stroke={theme.primary}
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  navigate(APP_PATHS.KYBERAI_EXPLORE + '/' + SUPPORTED_NETWORK_KYBERAI[chainId] + '/' + token?.address)
                }
              />
            </RowFit>
          </Column>
          <div style={{ width: '100px' }}></div>
        </Container>
      ) : (
        <MobileContainer>
          <RowBetween>
            <RowFit gap="8px">
              <img src={token?.logo} width="32" height="32" style={{ borderRadius: '50%' }} />
              <Column gap="4px">
                <Text color={theme.text}>{token?.symbol?.toUpperCase() || '--'} seems to be</Text>
                <Text color={color} fontWeight={600}>
                  {token?.kyberScore.label || '--'}
                </Text>
              </Column>
            </RowFit>
            <SkewKyberScoreWrapper style={{ width: '120x', height: '74px' }}>
              <KyberScoreMeter value={33} noAnimation fontSize="14px" hiddenValue style={{ height: '36px' }} />
              <RowFit fontSize="10px" gap="4px">
                <ApeIcon size={14} /> KyberScore
              </RowFit>
            </SkewKyberScoreWrapper>
          </RowBetween>
          <Row fontSize="12px" gap="4px" justify="center">
            Explore with <span style={{ color: theme.primary }}>KyberAI</span> here!{' '}
            <ArrowRight
              size={14}
              stroke={theme.primary}
              style={{ cursor: 'pointer' }}
              onClick={() =>
                navigate(APP_PATHS.KYBERAI_EXPLORE + '/' + SUPPORTED_NETWORK_KYBERAI[chainId] + '/' + token?.address)
              }
            />
          </Row>
        </MobileContainer>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  overflow: hidden;
  border-radius: 24px;
  margin-bottom: 16px;
`

const Container = styled.div<{ color?: string }>`
  height: 84px;
  padding: 16px;
  background: ${({ color, theme }) =>
    `linear-gradient(90deg, ${transparentize(0.8, color || theme.text)} 0%, rgba(40, 40, 40, 0.2) 100%)`};
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  min-width: 700px;
  white-space: nowrap;
  :after {
    content: ' ';
    background: url(${bannerBackground});
    background-size: 140%;
    background-position: 110% 15%;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 310px;
  }
`

const MobileContainer = styled.div<{ color?: string }>`
  padding: 16px;
  background: ${({ color, theme }) =>
    `linear-gradient(90deg, ${transparentize(0.8, color || theme.text)} 0%, rgba(40, 40, 40, 0.2) 100%)`};
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SkewKyberScoreWrapper = styled.div`
  transform: skewX(-7deg) translateZ(0);
  filter: blur(0px);
  background: linear-gradient(277.16deg, #ffffff27 -83.03%, rgba(255, 255, 255, 0) 132.01%);
  border: 0.5px solid ${({ theme }) => theme.border + '80'};
  border-radius: 12px;
  height: 62px;
  width: 100px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.12);
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

export default memo(TrendingSoonTokenBanner)
