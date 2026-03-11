import { memo } from 'react'

import { MarkContainer, MarkHighlight, MarkText } from 'components/Recap/RecapJourney.styles'

function MarkScene() {
  return (
    <MarkContainer
      key="mark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <MarkText
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        You made your <MarkHighlight>MARK</MarkHighlight> on the market
      </MarkText>
    </MarkContainer>
  )
}

export default memo(MarkScene)
