import { memo } from 'react'

import fairflowImage from 'assets/recap/fairflow.png'
import {
  FairflowImage,
  MevContainer,
  MevFlowHighlight,
  MevFlowLine,
  MevOutsmarted,
  MevText,
  MevTextWrapper,
} from 'components/Recap/RecapJourney.styles'

interface MevSceneProps {
  isMevFlowScene: boolean
  isFairflowRewardsScene: boolean
}

function MevScene({ isMevFlowScene, isFairflowRewardsScene }: MevSceneProps) {
  return (
    <MevContainer
      key="mev-combined"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <MevTextWrapper animate={{ y: isMevFlowScene ? -40 : 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <MevText
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          While others
        </MevText>
        <MevText
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        >
          fought MEV bots...
        </MevText>
      </MevTextWrapper>
      <MevFlowLine
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: isMevFlowScene ? 1 : 0, y: isMevFlowScene ? 0 : 30 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ visibility: isMevFlowScene ? 'visible' : 'hidden' }}
      >
        you <MevOutsmarted>outsmarted</MevOutsmarted> the <MevFlowHighlight>FLOW</MevFlowHighlight>
      </MevFlowLine>
      <FairflowImage
        src={fairflowImage}
        alt="FairFlow"
        initial={{ opacity: 1 }}
        animate={{
          opacity: isFairflowRewardsScene ? 0 : [1, 0.65, 0.9, 0.5, 0.3, 0.15, 0.02],
        }}
        transition={
          isFairflowRewardsScene
            ? { duration: 1.5, ease: 'easeOut' } // Slower fade out
            : {
                duration: 4,
                repeat: Infinity,
                ease: [0.4, 0, 0.6, 1], // Smooth cubic-bezier easing
                times: [0, 0.25, 0.5, 0.65, 0.85, 0.9, 1],
              }
        }
      />
    </MevContainer>
  )
}

export default memo(MevScene)
