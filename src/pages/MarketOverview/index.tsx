import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { Star } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import Pagination from 'components/Pagination'
import SearchInput from 'components/SearchInput'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { PoolsPageWrapper } from 'pages/Pools/styleds'

const TableWrapper = styled.div`
  background: ${({ theme }) => rgba(theme.background, 0.8)};
  border-radius: 16px;
  overflow: hidden;
`

const ContentWrapper = styled.div`
  padding: 24px;
`

const Tag = styled.div<{ active: boolean }>`
  background: ${({ theme, active }) => (active ? rgba(theme.primary, 0.2) : theme.tableHeader)};
  border: 1px solid ${({ theme, active }) => (active ? theme.primary : 'transparent')};
  border-radius: 12px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  font-weight: ${({ active }) => (active ? '500' : '400')};
`

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1.2fr 1fr;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  align-items: center;
`

const InnerGrid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 8px 24px;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
`

const tags = ['Defi', 'Gainers', 'Losers', 'Meme', 'AI', 'RWA', 'Game']

export default function MarketOverview() {
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  let tag = searchParams.get('tag') || 'All'
  if (!tags.includes(tag) && tag !== 'All' && tag !== 'Favorite') tag = 'All'

  const [input, setInput] = useState(search)
  const deboundedInput = useDebounce(input, 300)

  useEffect(() => {
    if (search !== deboundedInput) {
      searchParams.set('search', deboundedInput)
      setSearchParams(searchParams)
    }
  }, [deboundedInput, searchParams, setSearchParams, search])

  const onTagClick = (t: string) => {
    searchParams.set('tag', t)
    setSearchParams(searchParams)
  }

  return (
    <PoolsPageWrapper>
      <Flex justifyContent="space-between">
        <Text as="h1" fontSize={20} fontWeight="500">
          <Trans>Market Overview</Trans>
        </Text>
        <SearchInput
          placeholder="Search by token name, symbol or address"
          value={input}
          onChange={val => setInput(val)}
        />
      </Flex>

      <TableWrapper>
        <ContentWrapper>
          <Flex sx={{ gap: '1rem' }} marginBottom="24px">
            <Tag active={tag === 'All'} onClick={() => onTagClick('All')} role="button">
              All
            </Tag>
            <Tag active={tag === 'Favorite'} onClick={() => onTagClick('Favorite')} role="button">
              <Star size={14} />
            </Tag>
            {tags.map(item => (
              <Tag active={item === tag} onClick={() => onTagClick(item)} key={item} role="button">
                {item}
              </Tag>
            ))}
          </Flex>

          <Divider />

          <TableHeader>
            <Text color={theme.subText} fontSize={14} padding="12px" sx={{ borderRight: `1px solid ${theme.border}` }}>
              # Name
            </Text>
            <Box
              sx={{
                borderRight: `1px solid ${theme.border}`,
              }}
            >
              <Flex
                padding="8px 16px"
                sx={{
                  borderBottom: `1px solid ${theme.border}`,
                  fontSize: '14px',
                }}
              >
                On-chain Price
              </Flex>
              <InnerGrid>
                {' '}
                <Text textAlign="right">Price</Text>
                <Text textAlign="right">1h</Text>
                <Text textAlign="right">24h</Text>
                <Text textAlign="right">7D</Text>
              </InnerGrid>
            </Box>

            <Box
              sx={{
                borderRight: `1px solid ${theme.border}`,
              }}
            >
              <Text
                textAlign="center"
                fontSize="14px"
                padding="8px 16px"
                sx={{
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                Martket Overview <InfoHelper text="Marketcap & 24h volume data sourced from Coingecko" />
              </Text>

              <InnerGrid sx={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Text textAlign="right">24h Volume</Text>
                <Text textAlign="right">Market cap</Text>
              </InnerGrid>
            </Box>
          </TableHeader>
        </ContentWrapper>
        <Pagination
          onPageChange={(newPage: number) => {
            // TODO
            console.log(newPage)
          }}
          totalCount={100}
          currentPage={1}
          pageSize={10}
        />
      </TableWrapper>
    </PoolsPageWrapper>
  )
}
