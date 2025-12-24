import { motion } from 'framer-motion'
import { memo } from 'react'

import {
  BadgeContainer,
  BadgeImage,
  TopPercentContainer,
  TopPercentNickname,
  TopPercentText,
  TopPercentValue,
} from 'components/Recap/RecapJourney.styles'
import { getBadgeImage } from 'components/Recap/utils'

interface TopPercentBadgeSceneProps {
  nickname: string
  top: number
  isBadgeScene: boolean
}

function TopPercentBadgeScene({ nickname, top, isBadgeScene }: TopPercentBadgeSceneProps) {
  return (
    <motion.div
      key="top-percent-badge"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginTop: isBadgeScene ? '-100px' : '0',
      }}
    >
      <TopPercentContainer
        animate={{
          opacity: 1,
          y: isBadgeScene ? -60 : 0,
        }}
        transition={{
          opacity: { duration: 0.8, ease: 'easeOut' },
          y: { duration: 0.6, ease: 'easeOut' },
        }}
      >
        <TopPercentNickname
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          {nickname}
        </TopPercentNickname>
        <TopPercentText>
          In the <TopPercentValue>Top {top}%</TopPercentValue> of KyberSwap Traders
        </TopPercentText>
      </TopPercentContainer>
      <BadgeContainer
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{
          opacity: isBadgeScene ? 1 : 0,
          scale: isBadgeScene ? 1 : 0.5,
          y: isBadgeScene ? 0 : 50,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: '75%',
          pointerEvents: isBadgeScene ? 'auto' : 'none',
        }}
      >
        <BadgeImage src={getBadgeImage(top)} alt="Achievement badge" />
      </BadgeContainer>
    </motion.div>
  )
}

export default memo(TopPercentBadgeScene)
