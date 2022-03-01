import React, { CSSProperties, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import { t } from '@lingui/macro'
import Search from 'components/Search'
import styled from 'styled-components'
import CurrencyLogo from 'components/CurrencyLogo'
import { Currency, ETHER } from '@dynamic-amm/sdk'
import useTheme from 'hooks/useTheme'

const OptionsContainer = styled(Flex)`
  display: none !important;
  position: absolute;
  bottom: -4px;
  left: 0;
  border-radius: 4px;
  flex-direction: column;
  background: ${({ theme }) => theme.tableHeader};
  z-index: 1;
  width: 100%;
  transform: translateY(100%);
  cursor: pointer;

  & > * {
    padding: 12px;

    &:hover {
      background: ${({ theme }) => theme.background};
    }
  }
`

interface TrueSightSearchBoxProps {
  minWidth?: string
  style?: CSSProperties
  placeholder: string
  options: string[] | Currency[]
  renderOption: (option: string | Currency) => JSX.Element | null
}

export default function TrueSightSearchBox({
  minWidth,
  style,
  placeholder,
  options,
  renderOption
}: TrueSightSearchBoxProps) {
  const theme = useTheme()

  const [searchValue, setSearchValue] = useState('')

  return (
    <Box style={{ position: 'relative', ...style }}>
      <Search searchValue={searchValue} setSearchValue={setSearchValue} placeholder={placeholder} minWidth={minWidth} />
      <OptionsContainer>
        <Flex alignItems="center" style={{ gap: '4px' }}>
          <CurrencyLogo currency={ETHER} size="16px" />
          <Text fontSize="12px" color={theme.subText}>
            Baby Floki Billionaire (BabyFB)
          </Text>
        </Flex>
      </OptionsContainer>
    </Box>
  )
}
