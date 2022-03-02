import { Currency } from '@vutien/sdk-core'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import React, { useCallback, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Field } from 'state/mint/proamm/actions'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { t, Trans } from '@lingui/macro'
import InfoHelper from 'components/InfoHelper'
import { ChevronDown } from 'react-feather'
import { Link, RouteComponentProps } from 'react-router-dom'
import { currencyId } from 'utils/currencyId'
import { useCurrency } from 'hooks/Tokens'
import { PageWrapper } from 'pages/Pool'
import { ToolbarWrapper, CurrencyWrapper, SearchWrapper } from 'pages/Pools/styleds'
import PoolsCurrencyInputPanel from 'components/PoolsCurrencyInputPanel'
import { ButtonPrimary } from 'components/Button'
import Search from 'components/Search'
import useProAmmPoolInfo, { useProAmmPoolInfos } from 'hooks/useProAmmPoolInfo'
import { FeeAmount } from '@vutien/dmm-v3-sdk'
import ProAmmPoolListItem from './ListItem'
type PoolListProps = {
  currencies: { [field in Field]?: Currency }
  searchValue: string
  isShowOnlyActiveFarmPools: boolean
}

const TableHeader = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1.5fr 1.5fr 2fr 0.75fr 1fr 1fr 1fr 1.5fr;
  padding: 18px 16px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  z-index: 1;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
`

const ClickableText = styled(Text)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};

  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }

  user-select: none;
  text-transform: uppercase;
`

const Pagination = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: ${({ theme }) => theme.oddRow};
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
    border: none;
    background-color: revert;
  `}
`

export default function ProAmmPools({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId } = useActiveWeb3React()
  const [searchValue, setSearchValue] = useState('')
  const above1000 = useMedia('(min-width: 1000px)')

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )
  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA, chainId)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/proamm/pools/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/proamm/pools/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA, chainId]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB, chainId)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/proamm/pools/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/proamm/pools/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/proamm/pools/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB, chainId]
  )
  return (
    <>
      <PageWrapper>
        {above1000 ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Trans>Select Pair</Trans>
            </div>
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
              </CurrencyWrapper>

              <SearchWrapper>
                <Search searchValue={searchValue} setSearchValue={setSearchValue} />
                <ButtonPrimary
                  width="max-content"
                  padding="10px 12px"
                  as={Link}
                  to={`/proamm/add/${currencyIdA === '' ? undefined : currencyIdA}/${
                    currencyIdB === '' ? undefined : currencyIdB
                  }`}
                  style={{ float: 'right', fontSize: '14px', borderRadius: '4px' }}
                >
                  <Trans>+ Create New Pool</Trans>
                </ButtonPrimary>
              </SearchWrapper>
            </ToolbarWrapper>
          </>
        ) : (
          <>
            <ToolbarWrapper>
              <Trans>Select Pair</Trans>
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
          </>
        )}
        <ProAmmPoolList currencies={currencies} searchValue={searchValue} isShowOnlyActiveFarmPools={false} />
      </PageWrapper>
    </>
  )
}

const ProAmmPoolList = ({ currencies, searchValue }: PoolListProps) => {
  const above1000 = useMedia('(min-width: 1000px)')
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()

  const renderHeader = () => {
    return above1000 ? (
      <TableHeader>
        <Flex alignItems="center">
          <ClickableText>
            <Trans>Token Pair</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center">
          <ClickableText>
            <Trans>Pool | Fee</Trans>
          </ClickableText>
          <InfoHelper
            text={t`A token pair can have multiple pools, each with a different swapping fee. Your swap fee earnings will be automatically reinvested in your pool`}
          />
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText style={{ textAlign: 'right' }}>
            <span>TVL</span>
            <ChevronDown size="14" style={{ marginLeft: '2px' }} />
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>APR</Trans>
            <ChevronDown size="14" style={{ marginLeft: '2px' }} />
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>VOLUME(24H)</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>FEES(24H)</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>YOUR LIQUIDITY</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>ACTIONS</Trans>
          </ClickableText>
        </Flex>
      </TableHeader>
    ) : null
  }

  const feeTiers = [FeeAmount.LOW, FeeAmount.MEDIUM]
  const poolAddresses = useProAmmPoolInfos(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B], feeTiers)

  console.log('====pooladdresss:', poolAddresses)

  const pools = useMemo(() => {
    return poolAddresses && poolAddresses.length == feeTiers.length
      ? [FeeAmount.LOW, FeeAmount.MEDIUM]
          .map((fee, index) => ({
            currencies,
            poolAddress: poolAddresses[index],
            fee
          }))
          .filter(item => !!item.poolAddress)
      : []
  }, [currencies, poolAddresses])
  return (
    <div>
      {renderHeader()}
      {pools.map((p, index) => (
        <ProAmmPoolListItem key={p.poolAddress} {...p} isFirstPoolInGroup={index === 0} />
      ))}
    </div>
  )
}
