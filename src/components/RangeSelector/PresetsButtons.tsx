import { Trans } from '@lingui/macro'
import { Swap as SwapIcon } from 'components/Icons'
import useTheme from 'hooks/useTheme'
import React from 'react'
import { Flex } from 'rebass'
import { TYPE } from 'theme'

export default function PresetsButtons({ setFullRange }: { setFullRange: () => void }) {
  const theme = useTheme()
  return (
    <Flex
      justifyContent={'end'}
      style={{ color: theme.primary, cursor: 'pointer' }}
      alignItems={'center'}
      role="button"
      onClick={setFullRange}
    >
      <div style={{ transform: 'rotate(90deg)' }}>
        <SwapIcon size={18} />
      </div>
      <TYPE.body fontSize={14} marginLeft={'8px'} color={theme.primary}>
        <Trans>Full Price Range</Trans>
      </TYPE.body>
    </Flex>
  )
}
