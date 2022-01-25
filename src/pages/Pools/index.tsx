import React, { useCallback, useMemo, useState } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Trans } from '@lingui/macro'
import { Text } from 'rebass'

import { Currency } from '@dynamic-amm/sdk'
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
import { useDerivedPairInfo } from 'state/pair/hooks'
import { useBulkPoolData, useResetPools, useUserLiquidityPositions } from 'state/pools/hooks'
import { Field } from 'state/pair/actions'
import { currencyId } from 'utils/currencyId'
import { CurrencyWrapper, PageWrapper, SearchWrapper, SelectPairInstructionWrapper, ToolbarWrapper } from './styleds'
import InstructionAndGlobalData from 'pages/Pools/InstructionAndGlobalData'
import FarmingPoolsMarquee from 'pages/Pools/FarmingPoolsMarquee'

const Pools = ({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) => {
  const { account, chainId } = useActiveWeb3React()
  const [searchValue, setSearchValue] = useState('')
  const above1000 = useMedia('(min-width: 1000px)')

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const { currencies, pairs } = useDerivedPairInfo(currencyA ?? undefined, currencyB ?? undefined)

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
        if (currencyIdB) {
          history.push(`/pools/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/pools/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/pools/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB, chainId]
  )

  const poolsList = useMemo(
    () =>
      pairs
        .map(([_, pair]) => pair)
        .filter(pair => pair !== null)
        .filter(pair => {
          if (searchValue) {
            return pair?.address.toLowerCase().includes(searchValue.toLowerCase())
          }

          return true
        }),
    [pairs, searchValue]
  )

  // format as array of addresses
  const formattedPools = useMemo(() => poolsList.map(pool => pool?.address.toLowerCase()), [poolsList])

  useResetPools(currencyA ?? undefined, currencyB ?? undefined)

  // get data for every pool in list
  const { loading: loadingPoolsData, data: poolsData } = useBulkPoolData(formattedPools, ethPrice.currentPrice)

  // const { loading: loadingUserLiquidityPositions, data: userLiquidityPositions } = useUserLiquidityPositions(account)
  const temp = useUserLiquidityPositions(account)
  const loadingUserLiquidityPositions = !account ? false : temp.loading
  const userLiquidityPositions = !account ? { liquidityPositions: [] } : temp.data

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
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyASelect}
                currency={currencies[Field.CURRENCY_A]}
                otherCurrency={currencies[Field.CURRENCY_B]}
                id="input-tokena"
              />
              <span style={{ margin: '0 8px' }}>/</span>
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyBSelect}
                currency={currencies[Field.CURRENCY_B]}
                otherCurrency={currencies[Field.CURRENCY_A]}
                id="input-tokenb"
              />

              {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && (
                <ButtonPrimary
                  padding="8px 28px"
                  as={Link}
                  to={`/swap?inputCurrency=${currencyId(
                    currencies[Field.CURRENCY_A] as Currency,
                    chainId
                  )}&outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`}
                  width="fit-content"
                  style={{ marginLeft: '1rem', borderRadius: '4px' }}
                >
                  <span>
                    <Trans>Trade</Trans>
                  </span>
                </ButtonPrimary>
              )}
            </CurrencyWrapper>

            <SearchWrapper>
              <Search searchValue={searchValue} setSearchValue={setSearchValue} />
            </SearchWrapper>
          </ToolbarWrapper>
        ) : (
          <CurrencyWrapper>
            <PoolsCurrencyInputPanel
              onCurrencySelect={handleCurrencyASelect}
              currency={currencies[Field.CURRENCY_A]}
              otherCurrency={currencies[Field.CURRENCY_B]}
              id="input-tokena"
            />
            {above1000 && <span style={{ margin: '0 8px' }}>/</span>}
            <PoolsCurrencyInputPanel
              onCurrencySelect={handleCurrencyBSelect}
              currency={currencies[Field.CURRENCY_B]}
              otherCurrency={currencies[Field.CURRENCY_A]}
              id="input-tokenb"
            />
          </CurrencyWrapper>
        )}

        <Panel>
          {loadingUserLiquidityPositions || loadingPoolsData ? (
            <LocalLoader />
          ) : poolsList.length > 0 ? (
            <PoolList
              poolsList={poolsList}
              subgraphPoolsData={poolsData}
              userLiquidityPositions={userLiquidityPositions?.liquidityPositions}
              maxItems={2}
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
