import { memo } from 'react'

import { CapitalFlowContainer, CapitalFlowText, CapitalHighlight } from 'components/Recap/RecapJourney.styles'

function CapitalFlowScene() {
  return (
    <CapitalFlowContainer
      key="capital-flow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <CapitalFlowText
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        Here&apos;s where your
      </CapitalFlowText>
      <CapitalHighlight
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        capital
      </CapitalHighlight>
      <CapitalFlowText
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
      >
        truly flowed.
      </CapitalFlowText>
    </CapitalFlowContainer>
  )
}

export default memo(CapitalFlowScene)
