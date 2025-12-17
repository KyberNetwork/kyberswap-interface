import { memo } from 'react'
import { Flex } from 'rebass'

import {
  TradingStatLabel,
  TradingStatLabel2,
  TradingStatLine,
  TradingStatLine2,
  TradingStatValue,
  TradingStatValue2,
  TradingStatsContainer,
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
    </TradingStatsContainer>
  )
}

export default memo(TradingStatsScene)
