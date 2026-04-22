import { ChainId, type Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useInfiniteQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import {
  TOKEN_CHART_CANDLE_INTERVAL_MS,
  type TokenChartCandle,
  type TokenChartQueryParams,
  type TokenChartTimeFrame,
  getTokenChartFromBucketMs,
  useLazyTokenPriceChartQuery,
} from 'services/tokenChart'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { PRICE_CHART_QUOTE_TOKEN_BY_CHAIN } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import { formatPrice, formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState from 'pages/Earns/PoolDetail/components/PoolChartState'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

import TokenPriceChartCanvas, { type DisplayCandle } from './TokenPriceChartCanvas'

const ChartPanel = styled(Stack)`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.darkBorder};
  border-radius: 12px;
`

const TokenTabsList = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
`

const HeaderMetaText = styled(Text)`
  flex: 0 1 auto;
  min-width: 0;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 150ms ease-in-out;

  :hover {
    color: ${({ theme }) => theme.text};
  }
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

const ToggleIconWrapper = styled.button`
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  transition: background 150ms ease-in-out;
  cursor: pointer;

  :hover {
    background: ${({ theme }) => theme.tableHeader};
  }
`

const PanelChevron = styled(ChevronDown)<{ $expanded: boolean }>`
  color: ${({ theme }) => theme.subText};
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
  transition: transform 150ms ease-in-out;
`

const CHART_TIME_FRAME_OPTIONS = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '24h', value: '1d' },
  { label: '1W', value: '7d' },
] as const

const getCurrencyKey = (currency: Currency) => {
  if (currency.isNative) {
    return `${currency.chainId}-${currency.symbol}-native`
  }
  return currency.wrapped.address.toLowerCase()
}

const mergeTokenChartCandles = (candles: TokenChartCandle[]) =>
  [...candles]
    .sort((a, b) => dayjs(a.bucket).valueOf() - dayjs(b.bucket).valueOf())
    .filter((candle, index, array) => index === 0 || candle.bucket !== array[index - 1]?.bucket)

type TokenPriceChartProps = {
  tokens?: Array<Currency | undefined>
}

const TokenPriceChart = ({ tokens }: TokenPriceChartProps) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const chainId = tokens?.find(Boolean)?.chainId || ChainId.MAINNET

  const filteredTokens = useMemo(() => {
    return (tokens ?? []).reduce<Currency[]>((result, token) => {
      if (!token) return result

      const currencyKey = getCurrencyKey(token)
      const quoteStableToken = PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[token.chainId]
      const quoteStableTokenKey = quoteStableToken ? getCurrencyKey(quoteStableToken) : ''
      if (currencyKey === quoteStableTokenKey) return result

      return result.concat(token)
    }, [])
  }, [tokens])

  const [timeFrame, setTimeFrame] = useState<TokenChartTimeFrame>('1d')
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(!upToSmall)

  const resolvedActiveTabIndex = activeTabIndex < filteredTokens.length ? activeTabIndex : 0
  const activeToken = filteredTokens[resolvedActiveTabIndex] ?? filteredTokens[0]
  const activeTokenAddress = activeToken?.wrapped.address.toLowerCase()

  const stableToken = PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[chainId]
  const stableAddress = stableToken?.wrapped.address.toLowerCase()
  const fromBucketMs = useMemo(() => getTokenChartFromBucketMs({ timeFrame }), [timeFrame])
  const chartRequestKey = `${chainId}:${activeTokenAddress}:${stableAddress}:${timeFrame}`

  useEffect(() => {
    setActiveTabIndex(0)
  }, [filteredTokens.length])

  useEffect(() => {
    setIsExpanded(!upToSmall)
  }, [upToSmall])

  const [fetchTokenChart] = useLazyTokenPriceChartQuery()

  const initialQueryParams: TokenChartQueryParams = {
    chainId,
    tokenAddress: activeTokenAddress as string,
    stableAddress,
    quoteAddress: stableAddress,
    timeFrame,
    fromBucketMs,
  }

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['token-price-chart', chartRequestKey, fromBucketMs],
    enabled: Boolean(activeTokenAddress && stableAddress),
    initialPageParam: initialQueryParams,
    queryFn: async ({ pageParam }) => fetchTokenChart(pageParam).unwrap(),
    getNextPageParam: lastPage => {
      if (!lastPage.candles.length) return undefined

      const lastPagePeriodStartMs = lastPage.summary?.periodStartMs
      if (!lastPagePeriodStartMs) return undefined

      const toBucketMs = lastPagePeriodStartMs - TOKEN_CHART_CANDLE_INTERVAL_MS[timeFrame]

      return {
        ...initialQueryParams,
        fromBucketMs: getTokenChartFromBucketMs({ toBucketMs, timeFrame }),
        toBucketMs,
      }
    },
  })

  const handleLoadMore = async () => {
    if (!hasNextPage || isFetchingNextPage) return
    await fetchNextPage()
  }

  const accumulatedCandles = useMemo(
    () => mergeTokenChartCandles(infiniteData?.pages.flatMap(page => page.candles) ?? []),
    [infiniteData?.pages],
  )
  const chartData = useMemo<DisplayCandle[]>(
    () =>
      accumulatedCandles.map(candle => ({
        ...candle,
        time: dayjs(candle.bucket).unix(),
        volume: candle.volume ?? 0,
      })),
    [accumulatedCandles],
  )

  const latestPageData = infiniteData?.pages[0]
  const currentPrice = latestPageData?.latestPrice ?? 0
  const priceChange = latestPageData?.change24h ?? 0
  const priceChangeColor = priceChange >= 0 ? theme.primary : theme.red

  if (!activeToken || !stableToken) return null

  const settlementPriceTooltip = (
    <Stack gap={8} align="flex-start">
      <Text color={theme.subText} fontSize={14}>
        <Trans>
          Prices are tracked by KyberSwap from on-chain settlement data, tracked and calculated by KyberSwap, from
          actual on-chain swap events across supported DEX liquidity sources — not aggregated feeds or oracle data.
          Values may differ from prices on other platforms.
        </Trans>
      </Text>
      <ExternalLink href="https://docs.kyberswap.com">
        <Trans>Learn more about KyberSwap Settlement Prices</Trans>
      </ExternalLink>
    </Stack>
  )

  return (
    <ChartPanel gap={0}>
      <HStack align="center" gap={12} pr={16}>
        <TokenTabsList role="tablist">
          {filteredTokens.map((token, index) => {
            const isActive = index === resolvedActiveTabIndex
            return (
              <TabButton
                $active={isActive}
                $isLast={index === filteredTokens.length - 1}
                key={getCurrencyKey(token)}
                onClick={() => {
                  setActiveTabIndex(index)
                  setIsExpanded(true)
                }}
              >
                <CurrencyLogo currency={token} size="20px" />
                <Text color="inherit" fontSize={16} fontWeight={500}>
                  {token.symbol}/{stableToken?.symbol}
                </Text>
              </TabButton>
            )
          })}
        </TokenTabsList>

        {!upToSmall && (
          <MouseoverTooltip placement="top" text={settlementPriceTooltip} width="360px">
            <HeaderMetaText>{t`Powered by KyberSwap Settlement Prices`}</HeaderMetaText>
          </MouseoverTooltip>
        )}

        {upToSmall && (
          <ToggleIconWrapper onClick={() => setIsExpanded(expanded => !expanded)} type="button">
            <PanelChevron $expanded={isExpanded} size={18} />
          </ToggleIconWrapper>
        )}
      </HStack>

      {isExpanded && (
        <Stack p={16} sx={{ borderTop: `1px solid ${theme.darkBorder}` }}>
          <Stack gap={12}>
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
                        {priceChange >= 0 ? '▲' : '▼'}
                      </Text>
                    </HStack>
                    <Text color={theme.subText} fontSize={14}>
                      (24h)
                    </Text>
                  </HStack>
                )}
              </Stack>

              <SegmentedControl
                onChange={setTimeFrame}
                options={CHART_TIME_FRAME_OPTIONS}
                size="sm"
                value={timeFrame}
              />
            </HStack>

            <PoolChartState
              emptyMessage={
                activeToken ? 'Chart unavailable for this pair.' : 'Select a token to view the price chart.'
              }
              errorMessage="Unable to load token price."
              height={chartHeight}
              isEmpty={chartData.length === 0}
              isError={isError}
              isLoading={isLoading}
              skeletonType="candle"
            >
              <TokenPriceChartCanvas
                key={`${activeTokenAddress}:${stableAddress}:${timeFrame}`}
                chartData={chartData}
                canLoadMore={hasNextPage}
                onLoadMore={handleLoadMore}
                timeFrame={timeFrame}
              />
            </PoolChartState>

            {upToSmall && (
              <MouseoverTooltip placement="top" text={settlementPriceTooltip} width="280px">
                <HeaderMetaText>{t`Settlement Prices`}</HeaderMetaText>
              </MouseoverTooltip>
            )}
          </Stack>
        </Stack>
      )}
    </ChartPanel>
  )
}

export default TokenPriceChart
