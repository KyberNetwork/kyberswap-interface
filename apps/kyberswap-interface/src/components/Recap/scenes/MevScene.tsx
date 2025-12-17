import { memo } from 'react'

import {
  MevContainer,
  MevFlowHighlight,
  MevFlowLine,
  MevOutsmarted,
  MevText,
  MevTextWrapper,
} from 'components/Recap/RecapJourney.styles'

interface MevSceneProps {
  isMevFlowScene: boolean
}

function MevScene({ isMevFlowScene }: MevSceneProps) {
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
    </MevContainer>
  )
}

export default memo(MevScene)
