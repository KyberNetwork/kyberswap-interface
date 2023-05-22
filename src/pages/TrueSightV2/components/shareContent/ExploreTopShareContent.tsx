import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { Text } from 'rebass'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import styled, { useTheme } from 'styled-components'

import Column from 'components/Column'
import Row, { RowFit } from 'components/Row'
import { useTokenListQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { ITokenOverview, KyberAIListType } from 'pages/TrueSightV2/types'
import { calculateValueToColor, formatTokenPrice } from 'pages/TrueSightV2/utils'

import ChevronIcon from '../ChevronIcon'
import KyberScoreMeter from '../KyberScoreMeter'
import KyberScoreChart from '../chart/KyberScoreChart'

const CardWrapper = styled.div`
  background: linear-gradient(120.45deg, rgba(255, 255, 255, 0.14) -4.63%, rgba(27, 136, 104, 0) 105.53%);
  border-radius: 20px;
  padding: 28px;
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`
export default function ExploreShareContent({ token }: { token?: ITokenOverview }) {
  const theme = useTheme()
  const { data } = useTokenListQuery(
    { type: KyberAIListType.ALL, page: 1, pageSize: 5, keywords: token?.address },
    { skip: !token?.address, refetchOnMountOrArgChange: true },
  )
  if (!token) return null
  const latestKyberscore = token.kyberScore?.ks3d && token.kyberScore.ks3d[token.kyberScore.ks3d.length - 1]
  const last7daysPrice = data?.data[0]?.['7daysprice']
  const formattedData = last7daysPrice ? [...last7daysPrice].sort((a, b) => a.timestamp - b.timestamp).slice(1, 8) : []
  const priceChangeColor = token && token.price24hChangePercent > 0 ? theme.primary : theme.red
  return (
    <Row align="stretch" justify="stretch" gap="36px">
      <CardWrapper>
        <Column flex={0} gap="12px">
          <Text color={theme.text} fontSize="14px" lineHeight="20px" marginBottom="12px" fontWeight={500}>
            <Trans>Price</Trans>
          </Text>
          <RowFit gap="8px">
            <Text fontSize={28} lineHeight="32px" color={theme.text}>
              {'$' + formatTokenPrice(token?.price || 0)}
            </Text>
            <Text
              color={token && token.price24hChangePercent > 0 ? theme.primary : theme.red}
              fontSize="12px"
              backgroundColor={rgba(token && token.price24hChangePercent > 0 ? theme.primary : theme.red, 0.2)}
              display="inline"
              padding="4px 8px"
              style={{ borderRadius: '16px' }}
            >
              <RowFit gap="2px">
                <ChevronIcon
                  rotate={token && token.price24hChangePercent > 0 ? '180deg' : '0deg'}
                  color={priceChangeColor}
                />
                {token?.price24hChangePercent ? Math.abs(token.price24hChangePercent).toFixed(2) : 0}%
              </RowFit>
            </Text>
          </RowFit>
          <Row color={priceChangeColor} fontSize={12} lineHeight="16px">
            <ChevronIcon
              rotate={token && token.price24hChangePercent > 0 ? '180deg' : '0deg'}
              color={priceChangeColor}
            />
            {token && '$' + formatTokenPrice(Math.abs(token.price24hChangePercent * token.price) / 100, 2)}
          </Row>
        </Column>
        <Column style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ left: 10, right: 15 }}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.primary} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeWidth={1} stroke={rgba(theme.border, 0.5)} />
              <XAxis
                fontSize={9}
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.subText, fontWeight: 400 }}
                tickFormatter={value => dayjs(value * 1000).format('MMM DD')}
                allowDataOverflow
                tickCount={7}
                minTickGap={1}
              />
              <YAxis
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.subText, fontWeight: 400 }}
                width={40}
                tickCount={7}
                tickFormatter={value => '$' + formatTokenPrice(value)}
                domain={[(dataMin: number) => 0.99 * dataMin, (dataMax: number) => 1.005 * dataMax]}
              />
              <Area
                type="linear"
                dataKey="value"
                stroke={theme.primary}
                fill="url(#colorUv)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Column>
      </CardWrapper>
      <CardWrapper>
        <Column width="100%" height="100%" gap="16px" style={{ justifyContent: 'space-between' }}>
          <Text>
            <Trans>
              Calculated at{' '}
              {latestKyberscore ? dayjs(latestKyberscore?.created_at * 1000).format('HH:mm A, MMM DD') : ''} when price
              was {latestKyberscore ? '$' + formatTokenPrice(latestKyberscore.price) : '--'}
            </Trans>
          </Text>
          <KyberScoreMeter
            value={latestKyberscore?.kyber_score || 0}
            style={{ width: '264px', height: '160px', alignSelf: 'center' }}
            noAnimation={true}
          />
          <Row justify="center">
            <Text color={theme.text} fontSize="24px" lineHeight="28px">
              <Trans>
                {token?.symbol?.toUpperCase()} seems to be{' '}
                <span style={{ color: calculateValueToColor(latestKyberscore?.kyber_score || 0, theme) }}>
                  {latestKyberscore ? latestKyberscore.tag : ''}
                </span>
              </Trans>
            </Text>
          </Row>
          <Row marginTop="12px">
            <Text>
              <Trans>Last 3D Kyberscores</Trans>
            </Text>
          </Row>
          <Row justify="center">
            <KyberScoreChart index={1} data={token?.kyberScore?.ks3d} width="100%" height="46px" noAnimation={true} />
          </Row>
        </Column>
      </CardWrapper>
    </Row>
  )
}
