import { memo } from 'react'
import { Flex } from 'rebass'

import candleChart from 'assets/recap/candle-chart.svg'
import {
  CandlestickChartImage,
  CandlestickChartWrapper,
  TradingStatLabel,
  TradingStatLabel2,
  TradingStatLine,
  TradingStatLine2,
  TradingStatValue,
  TradingStatValue2,
  TradingStatsContainer,
  TradingStatsTextWrapper,
} from 'components/Recap/RecapJourney.styles'
import { formatTradingVolume } from 'components/Recap/utils'

interface TradingStatsSceneProps {
  tradingVolume: number
  txCount: number
}

function TradingStatsScene({ tradingVolume, txCount }: TradingStatsSceneProps) {
  return (
    <TradingStatsContainer
      key="trading-stats"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <TradingStatsTextWrapper>
        <TradingStatLine
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <TradingStatLabel>You moved</TradingStatLabel>
          <TradingStatValue>{formatTradingVolume(tradingVolume)}</TradingStatValue>
        </TradingStatLine>
        <TradingStatLine2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7, ease: 'easeOut' }}
        >
          <Flex alignItems="flex-end" sx={{ gap: '6px' }}>
            <TradingStatLabel>Executed</TradingStatLabel>
            <TradingStatValue2>{txCount.toLocaleString()}</TradingStatValue2>
          </Flex>
          <TradingStatLabel2>specific trades</TradingStatLabel2>
        </TradingStatLine2>
      </TradingStatsTextWrapper>

      {/* Candlestick Chart - at bottom */}
      <CandlestickChartWrapper
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1.2, ease: 'easeOut' }}
      >
        <CandlestickChartImage
          src={candleChart}
          alt="Candlestick Chart"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1.4, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'bottom' }}
        />
      </CandlestickChartWrapper>
    </TradingStatsContainer>
  )
}

export default memo(TradingStatsScene)
