import { Trans } from '@lingui/macro'
import { Swap as SwapIcon } from 'components/Icons'
import React, { useContext } from 'react'
import { TYPE } from 'theme'
import { Flex } from 'rebass'
import { ThemeContext } from 'styled-components'

export default function PresetsButtons({ setFullRange }: { setFullRange: () => void }) {
  const theme = useContext(ThemeContext)
  return (
    <Flex justifyContent={'end'} style={{ color: theme.primary }}>
      <SwapIcon size={18} rotate={90} />
      <TYPE.body
        fontSize={14}
        marginLeft={'2px'}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          setFullRange()
        }}
      >
        <Trans>Full Price Range</Trans>
      </TYPE.body>
    </Flex>
  )
}
