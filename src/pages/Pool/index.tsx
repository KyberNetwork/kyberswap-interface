import React, { useContext, useMemo, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text, Flex } from 'rebass'
import { t, Trans } from '@lingui/macro'

import { Pair, JSBI, Token, TokenAmount } from '@dynamic-amm/sdk'
import { SwapPoolTabs } from 'components/NavigationTabs'
import FullPositionCard from 'components/PositionCard'
import { DataCard, CardNoise, CardBGImage } from 'components/earn/styled'
import Card from 'components/Card'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { StyledInternalLink, TYPE } from '../../theme'
import { useActiveWeb3React } from 'hooks'
import { usePairsByAddress, usePairByAddress } from 'data/Reserves'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { useToV2LiquidityTokens, useLiquidityPositionTokenPairs } from 'state/user/hooks'
import { UserLiquidityPosition, useUserLiquidityPositions } from 'state/pools/hooks'
import useDebounce from 'hooks/useDebounce'
import Search from 'components/Search'
import { useFarmsData } from 'state/farms/hooks'
import { Farm } from 'state/farms/types'
import { useToken } from 'hooks/Tokens'
import LocalLoader from 'components/LocalLoader'

const Tab = styled.div<{ active: boolean }>`
  padding: 4px 0;
  color: ${({ active, theme }) => (active ? theme.text : theme.subText)};
  border-bottom: 2px solid ${({ active, theme }) => (!active ? 'transparent' : theme.primary)};
  font-weight: ${props => (props.active ? '500' : '400')};
  cursor: pointer;
  :hover {
    color: ${props => props.theme.text};
  }
`

export const PageWrapper = styled(AutoColumn)`
  padding: 16px 0 100px;
  width: 100%;
  max-width: 1128px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 12px 12px 100px;
    max-width: 744px;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px 12px 100px;
    max-width: 360px;
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
  border-radius: 5px;
  font-size: 14px;
  line-height: 1.5;
`

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 1rem;
    width: 100%;
    flex-direction: column;
  `};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const PositionCardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(360px, auto) minmax(360px, auto) minmax(360px, auto);
  gap: 24px;
  max-width: 1128px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1fr;
    max-width: 744px;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
    max-width: 360px;
  `};
`

export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  const liquidityPositionTokenPairs = useLiquidityPositionTokenPairs()
  const { loading: loadingUserLiquidityPositions, data: userLiquidityPositions } = useUserLiquidityPositions(account)

  const { data: farms, loading: farmLoading } = useFarmsData()

  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.trim().toLowerCase(), 300)

  const userFarms = Object.values(farms)
    .flat()
    .filter(farm => JSBI.greaterThan(JSBI.BigInt(farm.userData?.stakedBalance || 0), JSBI.BigInt(0)))

  const tokenPairsWithLiquidityTokens = useToV2LiquidityTokens(liquidityPositionTokenPairs)

  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityTokens), [
    tokenPairsWithLiquidityTokens
  ])

  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens.flatMap(x => x)
  )

  const liquidityTokensWithBalances = useMemo(
    () =>
      liquidityTokens.reduce<{ liquidityToken: Token; tokens: [Token, Token] }[]>((acc, lpTokens, index) => {
        lpTokens
          .filter((lp: Token) => v2PairsBalances[lp.address]?.greaterThan('0'))
          .forEach((lp: Token) => {
            acc.push({ liquidityToken: lp, tokens: tokenPairsWithLiquidityTokens[index].tokens })
          })
        return acc
      }, []),
    [tokenPairsWithLiquidityTokens, liquidityTokens, v2PairsBalances]
  )

  const v2Pairs = usePairsByAddress(
    liquidityTokensWithBalances.map(({ liquidityToken, tokens }) => ({
      address: liquidityToken.address,
      currencies: tokens
    }))
  )
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some(V2Pair => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  // // remove any pairs that also are included in pairs with stake in mining pool
  const v2PairsWithoutStakedAmount = allV2PairsWithLiquidity
    .filter(v2Pair => {
      return debouncedSearchText
        ? v2Pair.token0.symbol?.toLowerCase().includes(debouncedSearchText) ||
            v2Pair.token1.symbol?.toLowerCase().includes(debouncedSearchText) ||
            v2Pair.address.toLowerCase() === debouncedSearchText
        : true
    })
    .filter(v2Pair => !userFarms.map(farm => farm.id.toLowerCase()).includes(v2Pair.address.toLowerCase()))

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = {}

  userLiquidityPositions?.liquidityPositions.forEach((position: UserLiquidityPosition) => {
    transformedUserLiquidityPositions[position.pool.id] = position
  })

  const [showStaked, setShowStaked] = useState(false)

  return (
    <>
      <PageWrapper>
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
                <Trans>Here you can view all your liquidity and staked balances</Trans>
              </InstructionText>
            </AutoRow>

            <Text fontSize="20px" fontWeight={500}>
              <Trans>My Pools</Trans>
            </Text>

            <TitleRow>
              <Flex sx={{ gap: '1.5rem' }} alignItems="center">
                <Tab active={!showStaked} onClick={() => setShowStaked(false)} role="button">
                  Pools
                </Tab>
                <Tab active={showStaked} onClick={() => setShowStaked(true)} role="button">
                  Staked Pools
                </Tab>
              </Flex>
              <Search
                searchValue={searchText}
                setSearchValue={setSearchText}
                placeholder={t`Search by tokens or pool address`}
              />
            </TitleRow>

            {!account ? (
              <Card padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  <Trans>Connect to a wallet to view your liquidity.</Trans>
                </TYPE.body>
              </Card>
            ) : (v2IsLoading || loadingUserLiquidityPositions || farmLoading) &&
              !v2PairsWithoutStakedAmount.length &&
              !userFarms.length ? (
              <LocalLoader />
            ) : !showStaked ? (
              v2PairsWithoutStakedAmount?.length > 0 ? (
                <PositionCardGrid>
                  {v2PairsWithoutStakedAmount.map(v2Pair => (
                    <FullPositionCard
                      key={v2Pair.liquidityToken.address}
                      pair={v2Pair}
                      myLiquidity={transformedUserLiquidityPositions[v2Pair.address.toLowerCase()]}
                    />
                  ))}
                </PositionCardGrid>
              ) : (
                <EmptyProposals>
                  <TYPE.body color={theme.text3} textAlign="center">
                    <Trans>No liquidity found.</Trans>
                  </TYPE.body>
                </EmptyProposals>
              )
            ) : showStaked && !!userFarms.length ? (
              <PositionCardGrid>
                {userFarms
                  .filter(
                    farm =>
                      farm.token0.symbol.toLowerCase().includes(debouncedSearchText) ||
                      farm.token1.symbol.toLowerCase().includes(debouncedSearchText)
                  )
                  .map(farm => (
                    <StakedPool
                      farm={farm}
                      key={farm.id}
                      userLiquidityPositions={userLiquidityPositions?.liquidityPositions}
                    />
                  ))}
              </PositionCardGrid>
            ) : (
              <Text fontSize={24} textAlign="center" marginTop="60px">
                <Trans>
                  Currently, you haven’t staked any liquidity. Please check out our{' '}
                  <StyledInternalLink to="/farms">Farms.</StyledInternalLink>
                </Trans>
              </Text>
            )}

            <AutoColumn justify={'center'} gap="md">
              <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }} marginTop="24px">
                {t`Don't see a pool you joined?`}{' '}
                <StyledInternalLink id="import-pool-link" to={'/find'}>
                  <Trans>Import it.</Trans>
                </StyledInternalLink>
              </Text>
            </AutoColumn>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

const PreloadCard = styled.div`
  width: 100%;
  height: 394px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
`

const StakedPool = ({
  farm,
  userLiquidityPositions
}: {
  farm: Farm
  userLiquidityPositions?: UserLiquidityPosition[]
}) => {
  const token0 = useToken(farm.token0?.id) || undefined
  const token1 = useToken(farm.token1?.id) || undefined

  const pair = usePairByAddress(token0, token1, farm.id)[1]

  if (!pair) return <PreloadCard />

  return (
    <FullPositionCard
      pair={pair}
      stakedBalance={new TokenAmount(pair.liquidityToken, farm.userData?.stakedBalance || '0')}
      myLiquidity={userLiquidityPositions?.find(position => position.pool.id === pair.address)}
    />
  )
}
