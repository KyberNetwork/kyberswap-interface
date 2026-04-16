import { type Currency } from '@kyberswap/ks-sdk-core'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { type TokenChartTimeFrame, useTokenPriceChartQuery } from 'services/tokenChart'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import { PRICE_CHART_QUOTE_TOKEN_BY_CHAIN } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import { formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState from 'pages/Earns/PoolDetail/components/PoolChartState'
import { MEDIA_WIDTHS } from 'theme'

import TokenPriceChartCanvas, { type DisplayCandle } from './TokenPriceChartCanvas'

const ChartPanel = styled(Stack)`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.darkBorder};
  border-radius: 12px;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  border-bottom: 1px solid ${({ theme }) => theme.darkBorder};
`

const TabButton = styled.button<{ $active: boolean; $isLast: boolean }>`
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: 0;
  border-right: ${({ theme, $isLast }) => ($isLast ? '0' : `1px solid ${theme.darkBorder}`)};
  background: ${({ theme, $active }) => ($active ? rgba(theme.primary, 0.14) : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: inset 0 -2px 0 ${({ theme, $active }) => ($active ? theme.primary : 'transparent')};

  :hover {
    color: ${({ theme, $active }) => ($active ? theme.primary : theme.text)};
    background: ${({ theme, $active }) => ($active ? rgba(theme.primary, 0.14) : theme.tableHeader)};
  }
`

const CHART_TIME_FRAME_OPTIONS = [
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '7d' },
] as const

const DEFAULT_WINDOW_BY_TIME_FRAME: Record<TokenChartTimeFrame, number> = {
  '5m': 60 * 60 * 1000, // 1 hour
  '15m': 4 * 60 * 60 * 1000, // 4 hours
  '1h': 7 * 24 * 60 * 60 * 1000, // 7 days
  '4h': 30 * 24 * 60 * 60 * 1000, // 30 days
  '1d': 90 * 24 * 60 * 60 * 1000, // 90 days
  '7d': 180 * 24 * 60 * 60 * 1000, // 180 days
}

const getCurrencyKey = (currency: Currency) => {
  if (currency.isNative) {
    return `${currency.chainId}-${currency.symbol}-native`
  }
  return currency.wrapped.address.toLowerCase()
}

type TokenPriceChartProps = {
  tokens?: Array<Currency | undefined>
}

const TokenPriceChart = ({ tokens }: TokenPriceChartProps) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const [timeFrame, setTimeFrame] = useState<TokenChartTimeFrame>('1d')
  const [activeTokenKey, setActiveTokenKey] = useState('')

  const tokenTabs = useMemo(() => {
    return (tokens ?? []).reduce<Array<{ key: string; token: Currency }>>((result, token) => {
      if (!token) return result

      const currencyKey = getCurrencyKey(token)
      const quoteStableToken = PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[token.chainId]
      const quoteStableTokenKey = quoteStableToken ? getCurrencyKey(quoteStableToken) : ''
      if (currencyKey === quoteStableTokenKey) return result

      return result.concat({ key: currencyKey, token })
    }, [])
  }, [tokens])

  const resolvedActiveTokenKey = tokenTabs.find(tab => tab.key === activeTokenKey)?.key ?? tokenTabs[0]?.key

  const activeToken = useMemo(
    () => tokenTabs.find(tab => tab.key === resolvedActiveTokenKey)?.token || tokenTabs[0]?.token,
    [resolvedActiveTokenKey, tokenTabs],
  )
  const activeTokenAddress = activeToken?.wrapped.address.toLowerCase()

  const chainId = activeToken?.chainId
  const isChartSupported = chainId ? Boolean(PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[chainId]) : false
  const stableToken = isChartSupported ? PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[chainId] : undefined
  const stableAddress = stableToken?.wrapped.address.toLowerCase()
  const fromBucketMs = useMemo(() => Date.now() - DEFAULT_WINDOW_BY_TIME_FRAME[timeFrame], [timeFrame])

  const {
    data: priceData,
    isError,
    isLoading,
  } = useTokenPriceChartQuery(
    {
      chainId,
      tokenAddress: activeTokenAddress,
      stableAddress,
      quoteAddress: stableAddress,
      timeFrame,
      fromBucketMs,
    },
    { skip: !(isChartSupported && activeToken && stableToken) },
  )

  const chartData = useMemo<DisplayCandle[]>(
    () => (priceData?.candles ?? []).map(candle => ({ time: candle.ts, ...candle })),
    [priceData?.candles],
  )

  const currentPrice = priceData?.currentPrice
  const priceChange = priceData?.priceChange
  const priceChangeColor = priceChange === undefined || priceChange >= 0 ? theme.primary : theme.red

  if (!isChartSupported || !tokenTabs?.length) return null

  return (
    <ChartPanel gap={0}>
      <PanelHeader role="tablist">
        {tokenTabs.map((tab, index) => {
          const isActive = tab.key === resolvedActiveTokenKey
          return (
            <TabButton
              $active={isActive}
              $isLast={index === tokenTabs.length - 1}
              key={tab.key}
              onClick={() => setActiveTokenKey(tab.key)}
            >
              <CurrencyLogo currency={tab.token} size="20px" />
              <Text color="inherit" fontSize={16} fontWeight={500}>
                {tab.token.symbol}/{stableToken?.symbol}
              </Text>
            </TabButton>
          )
        })}
      </PanelHeader>

      <Stack p={16} gap={12}>
        <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
          <Stack>
            {currentPrice !== undefined && (
              <HStack align="baseline" gap={8} wrap="wrap">
                <Text color={theme.text} fontSize={20} fontWeight={500}>
                  {formatPrice(currentPrice)}
                </Text>

                <HStack align="center" gap={4}>
                  <Text color={priceChangeColor} fontSize={14} fontWeight={500}>
                    {formatSignedPercent(priceChange)}
                  </Text>
                  <Text color={priceChangeColor} fontSize={10}>
                    {priceChange === undefined || priceChange >= 0 ? '▲' : '▼'}
                  </Text>
                </HStack>
                <Text color={theme.subText} fontSize={14}>
                  (24h)
                </Text>
              </HStack>
            )}
          </Stack>

          <SegmentedControl onChange={setTimeFrame} options={CHART_TIME_FRAME_OPTIONS} size="sm" value={timeFrame} />
        </HStack>

        <PoolChartState
          emptyMessage={activeToken ? 'Chart unavailable for this pair.' : 'Select a token to view the price chart.'}
          errorMessage="Unable to load token price."
          height={chartHeight}
          isEmpty={chartData.length === 0}
          isError={isError}
          isLoading={isLoading}
          skeletonType="candle"
        >
          <TokenPriceChartCanvas
            key={`${activeTokenAddress}:${stableAddress}`}
            chartData={chartData}
            timeFrame={timeFrame}
          />
        </PoolChartState>
      </Stack>
    </ChartPanel>
  )
}

export default TokenPriceChart
