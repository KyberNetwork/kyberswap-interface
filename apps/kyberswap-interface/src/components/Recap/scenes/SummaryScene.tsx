import { motion } from 'framer-motion'
import { memo } from 'react'

import {
  SummaryBadge,
  SummaryContainer,
  SummaryFavoriteChainIcon,
  SummaryFavoriteIcon,
  SummaryFavoriteIconWrapper,
  SummaryFavoriteItem,
  SummaryFavoriteLabel,
  SummaryFavoriteValue,
  SummaryFavoritesRow,
  SummaryFooter,
  SummaryFooterLink,
  SummaryMainRow,
  SummaryNickname,
  SummaryRewardsLabel,
  SummaryRewardsSection,
  SummaryRewardsValue,
  SummaryStatLabel,
  SummaryStatValue,
  SummaryStatsColumn,
  SummaryStatsRow,
  SummaryTopBadge,
  SummaryTradesLabel,
  SummaryTradesValue,
} from 'components/Recap/RecapJourney.styles'
import { TopChain, TopToken } from 'components/Recap/types'
import { formatTradingVolume, getBadgeImage } from 'components/Recap/utils'
import { formatDisplayNumber } from 'utils/numbers'

interface SummarySceneProps {
  nickname: string
  tradingVolume: number
  txCount: number
  top: number
  topChains: TopChain[]
  topTokens: TopToken[]
  totalRewards: number
}

function SummaryScene({
  nickname,
  tradingVolume,
  txCount,
  top,
  topChains,
  topTokens,
  totalRewards,
}: SummarySceneProps) {
  return (
    <SummaryContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SummaryNickname>{nickname}</SummaryNickname>
      </motion.div>

      <SummaryMainRow>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SummaryBadge src={getBadgeImage(top)} alt="Badge" />
        </motion.div>

        <SummaryStatsColumn>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <SummaryStatsRow>
              <SummaryStatLabel>Total Volume</SummaryStatLabel>
              <div />
              <SummaryStatValue>{formatTradingVolume(tradingVolume)}</SummaryStatValue>
              <SummaryTradesValue>{txCount.toLocaleString()}</SummaryTradesValue>
              <SummaryTopBadge>Top {top.toFixed(2)}%</SummaryTopBadge>
              <SummaryTradesLabel>Trades</SummaryTradesLabel>
            </SummaryStatsRow>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <SummaryFavoritesRow>
              <SummaryFavoriteItem>
                <SummaryFavoriteLabel>Favorite Asset</SummaryFavoriteLabel>
                <SummaryFavoriteValue>
                  {topTokens[0] && (
                    <>
                      <SummaryFavoriteIconWrapper>
                        <SummaryFavoriteIcon src={topTokens[0].logo} alt={topTokens[0].symbol} />
                        <SummaryFavoriteChainIcon src={topTokens[0].chainLogo} alt="chain" />
                      </SummaryFavoriteIconWrapper>
                      {topTokens[0].symbol}
                    </>
                  )}
                </SummaryFavoriteValue>
              </SummaryFavoriteItem>
              <SummaryFavoriteItem>
                <SummaryFavoriteLabel>Favorite Chain</SummaryFavoriteLabel>
                <SummaryFavoriteValue>
                  {topChains[0] && (
                    <>
                      <SummaryFavoriteIcon src={topChains[0].icon} alt={topChains[0].name} />
                      {topChains[0].name}
                    </>
                  )}
                </SummaryFavoriteValue>
              </SummaryFavoriteItem>
            </SummaryFavoritesRow>
          </motion.div>

          {totalRewards > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <SummaryRewardsSection>
                <SummaryRewardsValue>
                  {formatDisplayNumber(totalRewards, {
                    significantDigits: totalRewards > 1000 ? 6 : 4,
                    style: 'currency',
                  })}
                </SummaryRewardsValue>
                <SummaryRewardsLabel>FairFlow Rewards</SummaryRewardsLabel>
              </SummaryRewardsSection>
            </motion.div>
          )}
        </SummaryStatsColumn>
      </SummaryMainRow>

      <SummaryFooter
        as={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        Watch your 2025 Journey 👇 <SummaryFooterLink>kyberswap.com/2025-journey</SummaryFooterLink>
      </SummaryFooter>
    </SummaryContainer>
  )
}

export default memo(SummaryScene)
