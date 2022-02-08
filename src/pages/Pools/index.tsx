import React, { useCallback, useMemo, useState } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { Currency, Pair } from '@dynamic-amm/sdk'
import { ButtonPrimary } from 'components/Button'
import PoolsCurrencyInputPanel from 'components/PoolsCurrencyInputPanel'
import Panel from 'components/Panel'
import PoolList from 'components/PoolList'
import Search from 'components/Search'
import LocalLoader from 'components/LocalLoader'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { useETHPrice } from 'state/application/hooks'
import { useDerivedPairInfoFromOneOrTwoCurrencies } from 'state/pair/hooks'
import { useBulkPoolData, useResetPools, useUserLiquidityPositions } from 'state/pools/hooks'
import { Field } from 'state/pair/actions'
import { currencyId } from 'utils/currencyId'
import { CurrencyWrapper, PageWrapper, SearchWrapper, SelectPairInstructionWrapper, ToolbarWrapper } from './styleds'
import InstructionAndGlobalData from 'pages/Pools/InstructionAndGlobalData'
import FarmingPoolsMarquee from 'pages/Pools/FarmingPoolsMarquee'
import useTheme from 'hooks/useTheme'
import FarmingPoolsToggle from 'components/Toggle/FarmingPoolsToggle'
import { useActiveAndUniqueFarmsData } from 'state/farms/hooks'

const Pools = ({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) => {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const [searchValue, setSearchValue] = useState('')
  const above1000 = useMedia('(min-width: 1000px)')
  const [isShowOnlyActiveFarmPools, setIsShowOnlyActiveFarmPools] = useState(false)

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const { currencies, pairs } = useDerivedPairInfoFromOneOrTwoCurrencies(currencyA ?? undefined, currencyB ?? undefined)
  const { data: uniqueAndActiveFarms } = useActiveAndUniqueFarmsData()
  const uniqueAndActiveFarmAddresses = uniqueAndActiveFarms.map(farm => farm.id)
  const activeFarmPairs = pairs.filter(pairData => {
    const pair = pairData[1]
    return !!(pair && uniqueAndActiveFarmAddresses.includes(pair.address.toLowerCase()))
  })
  const displayPairs = isShowOnlyActiveFarmPools ? activeFarmPairs : pairs

  const ethPrice = useETHPrice()

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA, chainId)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/pools/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/pools/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA, chainId]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB, chainId)
      if (currencyIdA === newCurrencyIdB) {
        history.push(`/pools/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/pools/${currencyIdA}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB, chainId]
  )

  const validAndFilteredPairs: Pair[] = useMemo(
    () =>
      displayPairs
        .map(([_, pair]) => pair)
        .filter(pair => pair !== null)
        .filter(pair => {
          if (searchValue) {
            const searchValueLowerCase = searchValue.toLowerCase()
            const isMatchAddress = pair?.address.toLowerCase().includes(searchValueLowerCase)
            const isMatchTokenName =
              pair?.token0.symbol?.toLowerCase().includes(searchValueLowerCase) ||
              pair?.token1.symbol?.toLowerCase().includes(searchValueLowerCase)
            return isMatchAddress || isMatchTokenName
          }

          return true
        }) as Pair[],
    [displayPairs, searchValue]
  )

  // format as array of addresses
  const pairAddresses = useMemo(() => validAndFilteredPairs.map(pool => pool.address.toLowerCase()), [
    validAndFilteredPairs
  ])

  useResetPools(currencyA ?? undefined, currencyB ?? undefined)

  // get data for every pool in list
  const { loading: loadingPoolsData, data: poolsData } = useBulkPoolData(pairAddresses, ethPrice.currentPrice)

  const userLiquidityPositionsQueryResult = useUserLiquidityPositions(account)
  const loadingUserLiquidityPositions = !account ? false : userLiquidityPositionsQueryResult.loading
  const userLiquidityPositions = !account ? { liquidityPositions: [] } : userLiquidityPositionsQueryResult.data

  return (
    <>
      <PageWrapper>
        <InstructionAndGlobalData />

        {above1000 ? (
          <ToolbarWrapper>
            <Text fontSize="20px" fontWeight={500}>
              <Trans>Provide Liquidity</Trans>
            </Text>
            <SearchWrapper>
              <ButtonPrimary
                padding="10px 12px"
                as={Link}
                to={`/create/${currencyIdA === '' ? undefined : currencyIdA}/${
                  currencyIdB === '' ? undefined : currencyIdB
                }`}
                style={{ float: 'right', borderRadius: '4px', fontSize: '14px' }}
              >
                <Trans>+ Create New Pool</Trans>
              </ButtonPrimary>
            </SearchWrapper>
          </ToolbarWrapper>
        ) : (
          <ToolbarWrapper>
            <Text fontSize="20px" fontWeight={500}>
              <Trans>Provide Liquidity</Trans>
            </Text>
            <SearchWrapper>
              <ButtonPrimary
                padding="10px 12px"
                as={Link}
                to={`/create/${currencyIdA === '' ? undefined : currencyIdA}/${
                  currencyIdB === '' ? undefined : currencyIdB
                }`}
                style={{ float: 'right', borderRadius: '4px', fontSize: '14px' }}
              >
                <Trans>+ Create New Pool</Trans>
              </ButtonPrimary>
            </SearchWrapper>
          </ToolbarWrapper>
        )}

        <FarmingPoolsMarquee />

        {above1000 ? (
          <ToolbarWrapper>
            <CurrencyWrapper>
              <Text fontSize="14px" color={theme.subText} mr="12px">
                <Trans>Filter by Token</Trans>
              </Text>
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyASelect}
                currency={currencies[Field.CURRENCY_A]}
                id="input-tokena"
              />
              <span style={{ margin: '0 8px' }}>-</span>
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyBSelect}
                currency={currencies[Field.CURRENCY_B]}
                id="input-tokenb"
              />
              <ButtonPrimary
                padding="9px 13px"
                width="fit-content"
                style={{ marginLeft: '16px', borderRadius: '4px', fontSize: '14px' }}
                onClick={() => {
                  if (currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B]) {
                    history.push(
                      `/swap?inputCurrency=${currencyId(currencies[Field.CURRENCY_A] as Currency, chainId)}
                            &outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`
                    )
                  } else if (currencies[Field.CURRENCY_A]) {
                    history.push(`/swap?inputCurrency=${currencyId(currencies[Field.CURRENCY_A] as Currency, chainId)}`)
                  } else if (currencies[Field.CURRENCY_B]) {
                    history.push(
                      `/swap?outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`
                    )
                  }
                }}
                disabled={!currencies[Field.CURRENCY_A] && !currencies[Field.CURRENCY_B]}
              >
                <Trans>Swap</Trans>
              </ButtonPrimary>
            </CurrencyWrapper>

            <Flex style={{ gap: '20px' }}>
              <Flex alignItems="center" style={{ gap: '8px' }}>
                <FarmingPoolsToggle
                  isActive={isShowOnlyActiveFarmPools}
                  toggle={() => setIsShowOnlyActiveFarmPools(prev => !prev)}
                />
                <Text fontSize="14px" color={theme.subText}>
                  <Trans>Farming Pools</Trans>
                </Text>
              </Flex>
              <Search
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                placeholder={t`Search by token or pool address`}
              />
            </Flex>
          </ToolbarWrapper>
        ) : (
          <>
            <Search
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              placeholder={t`Search by token or pool address`}
              style={{ marginBottom: '16px' }}
            />
            <Flex justifyContent="space-between" style={{ marginBottom: '16px' }}>
              <Text fontSize="14px" color={theme.subText} mr="12px">
                <Trans>Filter by Token</Trans>
              </Text>
              <Flex alignItems="center" style={{ gap: '8px' }}>
                <FarmingPoolsToggle
                  isActive={isShowOnlyActiveFarmPools}
                  toggle={() => setIsShowOnlyActiveFarmPools(prev => !prev)}
                />
                <Text fontSize="14px" color={theme.subText}>
                  <Trans>Farming Pools</Trans>
                </Text>
              </Flex>
            </Flex>

            <Flex justifyContent="space-between" style={{ marginBottom: '16px' }}>
              <CurrencyWrapper>
                <PoolsCurrencyInputPanel
                  onCurrencySelect={handleCurrencyASelect}
                  currency={currencies[Field.CURRENCY_A]}
                  otherCurrency={currencies[Field.CURRENCY_B]}
                  id="input-tokena"
                />
                <span style={{ margin: '0 8px' }}>-</span>
                <PoolsCurrencyInputPanel
                  onCurrencySelect={handleCurrencyBSelect}
                  currency={currencies[Field.CURRENCY_B]}
                  otherCurrency={currencies[Field.CURRENCY_A]}
                  id="input-tokenb"
                />
              </CurrencyWrapper>
              <ButtonPrimary
                padding="9px 13px"
                width="fit-content"
                style={{ marginLeft: '8px', borderRadius: '4px', fontSize: '14px' }}
                onClick={() => {
                  if (currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B]) {
                    history.push(
                      `/swap?inputCurrency=${currencyId(currencies[Field.CURRENCY_A] as Currency, chainId)}
                            &outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`
                    )
                  } else if (currencies[Field.CURRENCY_A]) {
                    history.push(`/swap?inputCurrency=${currencyId(currencies[Field.CURRENCY_A] as Currency, chainId)}`)
                  } else if (currencies[Field.CURRENCY_B]) {
                    history.push(
                      `/swap?outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`
                    )
                  }
                }}
                disabled={!currencies[Field.CURRENCY_A] && !currencies[Field.CURRENCY_B]}
              >
                <Trans>Swap</Trans>
              </ButtonPrimary>
            </Flex>
          </>
        )}

        <Panel>
          {loadingUserLiquidityPositions || loadingPoolsData ? (
            <LocalLoader />
          ) : validAndFilteredPairs.length > 0 ? (
            <PoolList
              poolList={validAndFilteredPairs}
              subgraphPoolsData={poolsData}
              userLiquidityPositions={userLiquidityPositions?.liquidityPositions}
            />
          ) : (
            <SelectPairInstructionWrapper>
              <div style={{ marginBottom: '1rem' }}>
                <Trans>There are no pools for this token pair.</Trans>
              </div>
              <div>
                <Trans>Create a new pool or select another pair of tokens to view the available pools.</Trans>
              </div>
            </SelectPairInstructionWrapper>
          )}
        </Panel>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default Pools
