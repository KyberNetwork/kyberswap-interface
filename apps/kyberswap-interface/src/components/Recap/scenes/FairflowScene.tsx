import { memo } from 'react'

import kemLmIcon from 'assets/svg/kyber/kemLm.svg'
import {
  FairflowContainer,
  FairflowEarned,
  FairflowHighlight,
  FairflowRewardLabel,
  FairflowRewardLine,
  FairflowRewardValue,
  FairflowSubtext,
  FairflowTitle,
  KemLmIcon,
} from 'components/Recap/RecapJourney.styles'

interface FairflowSceneProps {
  totalRewards: number
}

function FairflowScene({ totalRewards }: FairflowSceneProps) {
  return (
    <FairflowContainer
      key="fairflow-combined"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <FairflowTitle
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        Your <FairflowHighlight>FairFlow</FairflowHighlight> positions
      </FairflowTitle>
      <FairflowEarned
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
      >
        earned
      </FairflowEarned>
      <FairflowRewardLine
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <KemLmIcon src={kemLmIcon} alt="reward" />
        <FairflowRewardValue>${totalRewards.toLocaleString()}</FairflowRewardValue>
        <FairflowRewardLabel>in Rewards</FairflowRewardLabel>
      </FairflowRewardLine>
      <FairflowSubtext
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
      >
        Equilibrium Gain + Liquidity Mining
      </FairflowSubtext>
    </FairflowContainer>
  )
}

export default memo(FairflowScene)
