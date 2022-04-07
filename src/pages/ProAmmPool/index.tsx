import React, { useRef } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { t, Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import { PositionDetails } from 'types/position'
import PositionListItem from './PositionListItem'
import Loader from 'components/Loader'
import { Tab, TitleRow, PositionCardGrid, PageWrapper, InstructionText } from 'pages/Pool'
import Search from 'components/Search'
import useDebounce from 'hooks/useDebounce'
import { useUserProMMPositions } from 'state/prommPools/hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory, useLocation } from 'react-router-dom'
import { Info } from 'react-feather'
import { StyledInternalLink } from 'theme'
import useTheme from 'hooks/useTheme'

interface AddressSymbolMapInterface {
  [key: string]: string
}

export default function ProAmmPool() {
  const { account } = useActiveWeb3React()
  const tokenAddressSymbolMap = useRef<AddressSymbolMapInterface>({})
  const { positions, loading: positionsLoading } = useProAmmPositions(account)

  const { positions: userPositionsFromSubgraph } = useUserProMMPositions()

  const enrichedPostions = positions?.map(p => {
    const subgraphPostion = userPositionsFromSubgraph.find(ps => ps.tokenId === p.tokenId.toString())
    return {
      ...p,
      valueUSD: subgraphPostion?.valueUSD || 0,
      address: subgraphPostion?.address,
    }
  })

  const [openPositions, closedPositions] = enrichedPostions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []],
  ) ?? [[], []]

  const theme = useTheme()

  const qs = useParsedQueryString()
  const searchValueInQs: string = (qs.search as string) ?? ''

  const history = useHistory()
  const location = useLocation()

  const tab = (qs.tab as string) || 'promm'

  const onSearch = (search: string) => {
    history.replace(location.pathname + '?search=' + search + '&tab=' + tab)
  }

  const debouncedSearchText = useDebounce(searchValueInQs.trim().toLowerCase(), 300)

  const filteredPositions = [...openPositions, ...closedPositions].filter(position => {
    return (
      debouncedSearchText.trim().length === 0 ||
      (!!tokenAddressSymbolMap.current[position.token0.toLowerCase()] &&
        tokenAddressSymbolMap.current[position.token0.toLowerCase()].includes(debouncedSearchText)) ||
      (!!tokenAddressSymbolMap.current[position.token1.toLowerCase()] &&
        tokenAddressSymbolMap.current[position.token1.toLowerCase()].includes(debouncedSearchText)) ||
      position?.address === debouncedSearchText
    )
  })

  return (
    <>
      <PageWrapper style={{ padding: 0, marginTop: '24px' }}>
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <AutoRow>
            <InstructionText>
              <Trans>Here you can view all your liquidity positions and add/remove more liquidity.</Trans>
            </InstructionText>
          </AutoRow>
          <TitleRow>
            <Flex justifyContent="space-between" flex={1} alignItems="center">
              <Flex sx={{ gap: '1.5rem' }} alignItems="center">
                <Tab active={true} role="button">
                  Pools
                </Tab>
              </Flex>
            </Flex>
            <Search
              minWidth="254px"
              searchValue={searchValueInQs}
              onSearch={onSearch}
              placeholder={t`Search by token or pool address`}
            />
          </TitleRow>

          {positionsLoading ? (
            <Loader />
          ) : filteredPositions && filteredPositions.length > 0 ? (
            <PositionCardGrid>
              {filteredPositions.map(p => {
                return <PositionListItem refe={tokenAddressSymbolMap} key={p.tokenId.toString()} positionDetails={p} />
              })}
            </PositionCardGrid>
          ) : (
            <Flex flexDirection="column" alignItems="center" marginTop="60px">
              <Info size={48} color={theme.subText} />
              <Text fontSize={16} lineHeight={1.5} color={theme.subText} textAlign="center" marginTop="1rem">
                <Trans>
                  No liquidity found. Check out our{' '}
                  <StyledInternalLink to="/pools?tab=promm">Pools.</StyledInternalLink>
                </Trans>
              </Text>
            </Flex>
          )}
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
