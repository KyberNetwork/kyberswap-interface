import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react'
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

const TimeFrameButton = styled.div<{ active?: boolean }>`
  cursor: pointer;
  width: 26px;
  height: 24px;
  border-radius: 4px;
  line-height: 24px;
  margin-right: 5px;
  text-align: center;
  color: #a7b6bd;
  font-size: 12px;
  font-weight: 500;
  ${props => props.active && `background-color: #31CB9E; color: #3A3A3A;`}
`

const ShareButton = styled.div`
  display: flex;
  font-size: 12px;
  align-item: center;
  justify-content: center;
  cursor: pointer;

  svg {
    margin-right: 6px;
    circle {
      fill: white;
    }
  }
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

function LiveChart({ currencies }: { currencies: { [field in Field]?: Currency } }) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  const tokens = useMemo(
    () => [currencies[Field.INPUT], currencies[Field.OUTPUT]].map(currency => wrappedCurrency(currency, chainId)),
    [chainId, currencies]
  )
  const [hoverValue, setHoverValue] = useState(0)
  const [timeFrame, setTimeFrame] = useState<LiveDataTimeframeEnum>(LiveDataTimeframeEnum.DAY)
  const [isReversed, setIsReversed] = useState(false)
  const chartData = useLiveChartData(tokens, timeFrame)
  const formattedData = !isReversed
    ? chartData
    : chartData.map((item: any) => {
        return { ...item, value: 1 / item.value }
      })

  const showingValue = hoverValue || formattedData[formattedData.length - 1]?.value || 0
  const { chartColor, different, differentPercent } = getDifferentValues(formattedData, showingValue)

  const getTimeFrameText = () => {
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
  console.log(formattedData)
  return (
    <Box paddingTop={30}>
      <Flex justifyContent="space-between" alignItems="center">
        <Flex>
          <DoubleCurrencyLogo
            currency0={!isReversed ? currencies[Field.INPUT] : currencies[Field.OUTPUT]}
            currency1={!isReversed ? currencies[Field.OUTPUT] : currencies[Field.INPUT]}
            size={24}
            margin={true}
          />
          <Text fontSize={20} color={theme.subText}>
            {`${currencies[!isReversed ? Field.INPUT : Field.OUTPUT]?.symbol}/${
              currencies[!isReversed ? Field.OUTPUT : Field.INPUT]?.symbol
            }`}{' '}
            <Repeat size={14} onClick={() => setIsReversed(r => !r)} />
          </Text>
        </Flex>
        <ShareButton>
          <Share2 size={16} />
          Share
        </ShareButton>
      </Flex>
      <Flex justifyContent="space-between" alignItems="flex-start" marginTop={20}>
        <Flex flexDirection="column" alignItems="flex-start">
          <AnimatingNumber value={showingValue} symbol={currencies[!isReversed ? Field.OUTPUT : Field.INPUT]?.symbol} />
          <Flex>
            <Text fontSize={12} color={different >= 0 ? '#31CB9E' : '#FF537B'} marginRight="5px">
              {different} ({differentPercent}%)
            </Text>
            <Text fontSize={12} color="#6C7284">
              {getTimeFrameText()}
            </Text>
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

      <LineChart data={formattedData} setHoverValue={setHoverValue} color={chartColor} />
    </Box>
  )
}

export default LiveChart
