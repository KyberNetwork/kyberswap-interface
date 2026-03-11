import { memo } from 'react'

import { FireworkContentWrapper, FlowText, Year2025, YearOfFlow } from 'components/Recap/RecapJourney.styles'
import { Scene } from 'components/Recap/types'

interface FireworkSceneProps {
  scene: Scene
}

function FireworkScene({ scene }: FireworkSceneProps) {
  const isYearOfFlow = scene === 'year-of-flow'

  return (
    <FireworkContentWrapper>
      <Year2025
        key="2025"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        2025
      </Year2025>
      <YearOfFlow
        key="year-of-flow"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isYearOfFlow ? 1 : 0,
          y: isYearOfFlow ? 0 : 20,
        }}
        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        style={{ visibility: isYearOfFlow ? 'visible' : 'hidden' }}
      >
        Year of the <FlowText>FLOW</FlowText>
      </YearOfFlow>
    </FireworkContentWrapper>
  )
}

export default memo(FireworkScene)
