import { motion } from 'framer-motion'
import { memo } from 'react'

import {
  BarChartContainer,
  BarChartWrapper,
  ChartBar,
  LabelText,
  StatsContainer,
  StatsText,
  UsersText,
  VolumeText,
} from 'components/Recap/RecapJourney.styles'
import { formatUsers, formatVolume } from 'components/Recap/utils'

interface StatsSceneProps {
  totalVolume: number
  totalUsers: number
}

// Bar heights (percentage of max height) - increasing trend
const BAR_HEIGHTS = [20, 35, 28, 40, 55, 48, 65, 75, 100]

// Different shades of primary color for bars
const BAR_COLORS = [
  'rgba(49, 203, 158, 0.6)', // lighter
  'rgba(49, 203, 158, 0.7)',
  'rgba(49, 203, 158, 0.6)',
  'rgba(49, 203, 158, 0.65)',
  'rgba(49, 203, 158, 0.8)', // brighter
  'rgba(49, 203, 158, 0.7)',
  'rgba(49, 203, 158, 0.8)',
  'rgba(49, 203, 158, 0.75)',
  'rgba(49, 203, 158, 0.9)', // brightest
]

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

      {/* Bar Chart */}
      <BarChartWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 0.5 }}>
        <BarChartContainer>
          {BAR_HEIGHTS.map((height, index) => {
            // Vary delay: smaller stagger (0.03s) so multiple bars appear together
            const baseDelay = 1.8 + index * 0.03
            // Vary duration: each bar has slightly different speed (0.5s to 0.8s)
            const duration = 0.5 + (index % 3) * 0.15
            // Vary easing: mix of bounce and smooth for natural feel
            const easing = index % 2 === 0 ? [0.34, 1.56, 0.64, 1] : [0.25, 0.46, 0.45, 0.94]

            return (
              <ChartBar
                key={index}
                $height={height}
                $color={BAR_COLORS[index]}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{
                  delay: baseDelay,
                  duration: duration,
                  ease: easing,
                }}
                style={{ transformOrigin: 'bottom' }}
              />
            )
          })}
        </BarChartContainer>
      </BarChartWrapper>
    </StatsContainer>
  )
}

export default memo(StatsScene)
