import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { t, Trans } from '@lingui/macro'
import { SwapPoolTabs } from 'components/NavigationTabs'
import { DataCard, CardNoise, CardBGImage } from 'components/earn/styled'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import { PositionDetails } from 'types/position'
import PositionListItem from './PositionListItem'
import Loader from 'components/Loader'
import { Tab, TitleRow } from 'pages/Pool'
import Search from 'components/Search'
import useDebounce from 'hooks/useDebounce'

export const PageWrapper = styled(AutoColumn)`
  padding: 32px 0 100px;
  width: 100%;
  max-width: 1224px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
  max-width: 664px;
`}
  ${({ theme }) => theme.mediaWidth.upToSmall`
  padding: 12px 0 100px;
  max-width: 350px;
`};
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const InstructionText = styled.div`
  width: 100%;
  padding: 16px 20px;
  background-color: ${({ theme }) => theme.bg17};
  text-align: center;
  border-radius: 5px;
  font-size: 14px;
  line-height: 1.5;
`

const PositionCardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(392px, auto) minmax(392px, auto) minmax(392px, auto);
  gap: 24px;
  max-width: 1224px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
  grid-template-columns: 1fr 1fr;
  max-width: 664px;
`}
  ${({ theme }) => theme.mediaWidth.upToSmall`
  grid-template-columns: 1fr;
  max-width: 350px;
`};
`

interface AddressSymbolMapInterface {
  [key: string]: string
}

export default function ProAmmPool() {
  const { account } = useActiveWeb3React()
  const tokenAddressSymbolMap = useRef<AddressSymbolMapInterface>({})
  const { positions, loading: positionsLoading } = useProAmmPositions(account)
  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []],
  ) ?? [[], []]

  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.trim().toLowerCase(), 300)
  const filteredPositions = [...openPositions, ...closedPositions].filter(position => {
    return (
      debouncedSearchText.trim().length === 0 ||
      (!!tokenAddressSymbolMap.current[position.token0.toLowerCase()] &&
        tokenAddressSymbolMap.current[position.token0.toLowerCase()].includes(debouncedSearchText)) ||
      (!!tokenAddressSymbolMap.current[position.token1.toLowerCase()] &&
        tokenAddressSymbolMap.current[position.token1.toLowerCase()].includes(debouncedSearchText))
    )
  })
  return (
    <>
      <SwapPoolTabs active={'pool'} />
      <VoteCard>
        <CardBGImage />
        <CardNoise />
        <CardBGImage />
        <CardNoise />
      </VoteCard>
      <AutoColumn gap="lg" justify="center">
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
              searchValue={searchText}
              onSearch={setSearchText}
              placeholder={t`Search by token or pool address`}
            />
          </TitleRow>

          {/* <Flex justifyContent="space-between">
            <TYPE.mediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
              <Trans>My Liquidity Pools</Trans>
            </TYPE.mediumHeader>

            <ButtonPrimary as={Link} to="/proamm/add" width="max-content" height="48px">
              <Trans>Add Liquidity</Trans>
            </ButtonPrimary>
          </Flex> */}
          {positionsLoading ? (
            <Loader />
          ) : filteredPositions && filteredPositions.length > 0 ? (
            <PositionCardGrid>
              {filteredPositions.map(p => {
                return <PositionListItem refe={tokenAddressSymbolMap} key={p.tokenId.toString()} positionDetails={p} />
              })}
            </PositionCardGrid>
          ) : (
            <>No liquidity found</>
          )}
        </AutoColumn>
      </AutoColumn>
    </>
  )
}
