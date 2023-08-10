import { Trans, t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetClassicEarningQuery } from 'services/earning'
import { ClassicPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { AMP_LIQUIDITY_HINT } from 'constants/index'
import { COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { chainIdByRoute } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'

import { WIDTHS } from '../constants'
import SinglePool from './SinglePool'

const Header = styled.div`
  background: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.subText};
  text-transform: uppercase;
  padding: 16px 12px;
  font-size: 12px;
  font-weight: 500;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  display: grid;
  grid-template-columns: 3fr 2fr repeat(6, 1.3fr);
`

const ClassicPools = () => {
  const { account = '' } = useActiveWeb3React()
  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)

  const classicEarningQueryResponse = useGetClassicEarningQuery({
    account,
    chainIds: selectedChainIds.filter(item => !COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC.includes(item)),
  })

  const originalSearchText = useAppSelector(state => state.myEarnings.searchText)
  const searchText = useDebounce(originalSearchText, 300).toLowerCase().trim()
  const shouldShowClosedPositions = useAppSelector(state => state.myEarnings.shouldShowClosedPositions)

  const data = classicEarningQueryResponse.data

  const tabletView = useMedia(`(max-width: ${WIDTHS[3]}px)`)
  const mobileView = useMedia(`(max-width: ${WIDTHS[2]}px)`)
  const theme = useTheme()

  const renderPools = () => {
    const filterFn = (item: ClassicPositionEarningWithDetails) => {
      const removedFilter = shouldShowClosedPositions
        ? true
        : item.liquidityTokenBalance !== '0' || item.liquidityTokenBalanceIncludingStake !== '0'
      const poolId = item.pool.id.toLowerCase()
      const searchFilter =
        poolId === searchText ||
        item.pool.token0.id.toLowerCase() === searchText ||
        item.pool.token0.symbol.toLowerCase().includes(searchText) ||
        item.pool.token0.name.toLowerCase().includes(searchText) ||
        item.pool.token1.id.toLowerCase() === searchText ||
        item.pool.token1.symbol.toLowerCase().includes(searchText) ||
        item.pool.token1.name.toLowerCase().includes(searchText)
      return searchFilter && removedFilter
    }

    if (!data || Object.keys(data).every(key => !data[key]?.positions?.filter(filterFn).length)) {
      return (
        <Text padding="1.5rem" textAlign="center">
          <Trans>No liquidity found</Trans>
        </Text>
      )
    }

    return Object.keys(data).map(chainRoute => {
      const chainId = chainIdByRoute[chainRoute]
      const poolEarnings = data[chainRoute].positions.filter(filterFn)

      return (
        <>
          {poolEarnings.map(poolEarning => {
            return <SinglePool key={`${chainId}-${poolEarning.id}`} chainId={chainId} poolEarning={poolEarning} />
          })}
        </>
      )
    })
  }

  return (
    <Flex
      flexDirection="column"
      sx={{
        border: tabletView ? undefined : `1px solid ${theme.border}`,
        borderRadius: '1rem',
        gap: tabletView && !mobileView ? '1rem' : undefined,
      }}
    >
      {!tabletView && (
        <Header>
          <Text>
            <Trans>Pool | AMP</Trans>
          </Text>
          <Text>
            AMP Liquidity | TVL
            <InfoHelper text={AMP_LIQUIDITY_HINT} />
          </Text>
          <Text>
            APR
            <InfoHelper
              text={t`Average estimated return based on yearly trading fees from the pool & additional bonus rewards if you participate in the farm`}
            />
          </Text>
          <Text>
            <Trans>Volume (24h)</Trans>
          </Text>
          <Text>
            <Trans>Fees (24h)</Trans>
          </Text>
          <Text>
            <Trans>My Liquidity</Trans>
          </Text>
          <Text>
            <Trans>My Earnings</Trans>
          </Text>
          <Text textAlign="right">
            <Trans>Actions</Trans>
          </Text>
        </Header>
      )}

      {renderPools()}
    </Flex>
  )
}

export default ClassicPools
