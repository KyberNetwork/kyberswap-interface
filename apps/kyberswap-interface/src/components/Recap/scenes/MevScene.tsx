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
          opacity: isFairflowRewardsScene ? 0 : [1, 0.65, 0.9, 0.75, 0.55, 0.4, 0.25, 0.15, 0.08, 0.03, 0],
        }}
        transition={
          isFairflowRewardsScene
            ? { duration: 1.5, ease: 'easeOut' }
            : {
                duration: 5,
                repeat: Infinity,
                ease: [0.25, 0.1, 0.25, 1],
                times: [0, 0.15, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.88, 0.94, 1],
              }
        }
      />
    </MevContainer>
  )
}

export default memo(MevScene)
