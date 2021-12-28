import React, { useState, useContext, useEffect, useMemo } from 'react'
import LineChart from './LineChart'
import AnimatingNumber from './AnimatingNumber'
import styled, { ThemeContext } from 'styled-components'
import { Box, Flex, Text } from 'rebass'
import { Repeat, Share2 } from 'react-feather'
import { Currency } from '@dynamic-amm/sdk'
import { Field } from 'state/swap/actions'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { useActiveWeb3React } from 'hooks'
import useLiveChartData, { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
import { isMobile } from 'react-device-detect'
import WarningIcon from './WarningIcon'
import { useCurrencyConvertedToNative } from 'utils/dmm'

const LiveChartWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  ${!isMobile &&
    `@media only screen and (min-width: 768px) {
    padding-top: 30px;
    width: 580px;
    height: auto;
  }`}
`
const TimeFrameButton = styled.div<{ active?: boolean }>`
  cursor: pointer;
  width: 26px;
  height: 24px;
  border-radius: 4px;
  line-height: 24px;
  margin-right: 5px;
  text-align: center;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg12};
  ${({ theme, active }) => active && `background-color: ${theme.primary}; color: ${theme.white}`}
`

const getDifferentValues = (chartData: any, hoverValue: number) => {
  if (chartData && chartData.length > 0) {
    const firstValue = chartData[0].value
    const lastValue = chartData[chartData.length - 1].value

    return {
      chartColor: lastValue - firstValue >= 0 ? '#31CB9E' : '#FF537B',
      different: (hoverValue - lastValue).toPrecision(6),
      differentPercent: (((hoverValue - lastValue) / lastValue) * 100).toFixed(2)
    }
  }
  return {
    chartColor: '#31CB9E',
    different: 0,
    differentPercent: 0
  }
}

const getTimeFrameText = (timeFrame: LiveDataTimeframeEnum) => {
  switch (timeFrame) {
    case LiveDataTimeframeEnum.HOUR:
      return 'Past hour'
    case LiveDataTimeframeEnum.DAY:
      return 'Past 24 hours'
    case LiveDataTimeframeEnum.WEEK:
      return 'Past Week'
    case LiveDataTimeframeEnum.MONTH:
      return 'Past Month'
    case LiveDataTimeframeEnum.YEAR:
      return 'Past Year'
  }
}

function LiveChart({
  currencies,
  onRotateClick
}: {
  currencies: { [field in Field]?: Currency }
  onRotateClick?: () => void
}) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  const nativeInputCurrency = useCurrencyConvertedToNative(currencies[Field.INPUT] || undefined)
  const nativeOutputCurrency = useCurrencyConvertedToNative(currencies[Field.OUTPUT] || undefined)
  const tokens = useMemo(
    () => [nativeInputCurrency, nativeOutputCurrency].map(currency => wrappedCurrency(currency, chainId)),
    [chainId, currencies]
  )
  const [hoverValue, setHoverValue] = useState(0)
  const [timeFrame, setTimeFrame] = useState<LiveDataTimeframeEnum>(LiveDataTimeframeEnum.DAY)
  const { data: chartData, error } = useLiveChartData(tokens, timeFrame)

  useEffect(() => setHoverValue(0), [chartData])

  const showingValue = hoverValue || chartData[chartData.length - 1]?.value || 0

  const { chartColor, different, differentPercent } = getDifferentValues(chartData, showingValue)

  return (
    <LiveChartWrapper>
      <Flex justifyContent="space-between" alignItems="center">
        <Flex>
          <DoubleCurrencyLogo
            currency0={nativeInputCurrency}
            currency1={nativeOutputCurrency}
            size={24}
            margin={true}
          />
          <Text fontSize={20} color={theme.subText}>
            {`${nativeInputCurrency?.symbol}/${nativeOutputCurrency?.symbol}`}{' '}
            <Repeat size={14} cursor={'pointer'} onClick={onRotateClick} />
          </Text>
        </Flex>
      </Flex>
      <Flex justifyContent="space-between" alignItems="flex-start" marginTop={20}>
        <Flex flexDirection="column" alignItems="flex-start">
          {error ? (
            <Text fontSize={32} color={theme.subText}>
              --
            </Text>
          ) : (
            <AnimatingNumber value={showingValue} symbol={nativeOutputCurrency?.symbol} />
          )}
          <Flex marginTop="8px">
            {error ? (
              <Text fontSize={12} color={theme.disableText}>
                --
              </Text>
            ) : (
              <>
                <Text fontSize={12} color={different >= 0 ? '#31CB9E' : '#FF537B'} marginRight="5px">
                  {different} ({differentPercent}%)
                </Text>
                <Text fontSize={12} color={theme.disableText}>
                  {getTimeFrameText(timeFrame)}
                </Text>
              </>
            )}
          </Flex>
        </Flex>
        <Flex>
          {[
            LiveDataTimeframeEnum.HOUR,
            LiveDataTimeframeEnum.DAY,
            LiveDataTimeframeEnum.WEEK,
            LiveDataTimeframeEnum.MONTH,
            LiveDataTimeframeEnum.YEAR
          ].map(item => {
            return (
              <TimeFrameButton key={item} onClick={() => setTimeFrame(item)} active={timeFrame === item}>
                {item}
              </TimeFrameButton>
            )
          })}
        </Flex>
      </Flex>
      <div style={{ flex: 1, marginTop: '20px' }}>
        {error ? (
          <Flex
            minHeight={'300px'}
            flexDirection={'column'}
            alignItems={'center'}
            justifyContent={'center'}
            color={theme.disableText}
            style={{ gap: '16px' }}
          >
            <WarningIcon />
            <Text fontSize={16}>There was an error with the chart. Try again later</Text>
          </Flex>
        ) : (
          <LineChart data={chartData} setHoverValue={setHoverValue} color={chartColor} timeFrame={timeFrame} />
        )}
      </div>
    </LiveChartWrapper>
  )
}

export default React.memo(LiveChart)
