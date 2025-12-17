import { motion } from 'framer-motion'
import { memo } from 'react'

import { LabelText, StatsContainer, StatsText, UsersText, VolumeText } from 'components/Recap/RecapJourney.styles'
import { formatUsers, formatVolume } from 'components/Recap/utils'

interface StatsSceneProps {
  totalVolume: number
  totalUsers: number
}

function StatsScene({ totalVolume, totalUsers }: StatsSceneProps) {
  return (
    <StatsContainer
      key="stats"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <StatsText
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        You helped power KyberSwap to
      </StatsText>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.7, ease: 'easeOut' }}
      >
        <VolumeText>{formatVolume(totalVolume)}</VolumeText>
        <LabelText>volume</LabelText>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.8, duration: 0.7, ease: 'easeOut' }}
      >
        <LabelText>&</LabelText>
        <UsersText>{formatUsers(totalUsers)}</UsersText>
        <LabelText>users</LabelText>
      </motion.div>
    </StatsContainer>
  )
}

export default memo(StatsScene)
