import React, { useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import { t } from '@lingui/macro'
import Search from 'components/Search'
import styled from 'styled-components'
import CurrencyLogo from 'components/CurrencyLogo'
import { ETHER } from '@dynamic-amm/sdk'
import useTheme from 'hooks/useTheme'

const FoundTokensContainer = styled(Flex)`
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

const TokenNameSearch = () => {
  const theme = useTheme()

  const [searchValue, setSearchValue] = useState('')

  return (
    <Box style={{ position: 'relative' }}>
      <Search
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        placeholder={t`Search by token name`}
        minWidth="260px"
      />
      <FoundTokensContainer>
        <Flex alignItems="center" style={{ gap: '4px' }}>
          <CurrencyLogo currency={ETHER} size="16px" />
          <Text fontSize="12px" color={theme.subText}>
            Baby Floki Billionaire (BabyFB)
          </Text>
        </Flex>
      </FoundTokensContainer>
    </Box>
  )
}

export default TokenNameSearch
