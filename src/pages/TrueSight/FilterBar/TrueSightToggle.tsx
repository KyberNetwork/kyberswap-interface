import React from 'react'
import FilterBarToggle, { ToggleProps } from 'components/Toggle/FilterBarToggle'
import { Flex, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'

const TrueSightToggle = ({ isActive, toggle }: ToggleProps) => {
  const theme = useTheme()

  return (
    <Flex alignItems="center" style={{ gap: '8px' }}>
      <FilterBarToggle isActive={isActive} toggle={toggle} />
      <Text fontSize="14px" color={theme.subText} fontWeight={500}>
        <Trans>TrueSight</Trans>
      </Text>
    </Flex>
  )
}

export default TrueSightToggle
