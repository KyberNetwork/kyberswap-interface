import { Trans } from '@lingui/macro'
import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import { Swap as SwapIcon } from 'components/Icons'
import React, { useContext } from 'react'
import { StyledInternalLink, theme, TYPE } from 'theme'
import { Flex } from 'rebass'
import styled, { ThemeContext } from 'styled-components'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '8px',
  $borderRadius: '8px'
}))`
  color: ${({ theme }) => theme.text};
  flex: 1;
`

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
