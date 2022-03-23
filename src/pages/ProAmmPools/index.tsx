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

export default function ProAmmPoolList({ currencies, searchValue }: PoolListProps) {
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
            {/* <ChevronDown size="14" style={{ marginLeft: '2px' }} /> */}
            <InfoHelper text={t`Estimated return based on yearly fees of the pool`} />
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
