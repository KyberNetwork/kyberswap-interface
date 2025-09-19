import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Flex, Text } from 'rebass'
import { useGetSmartExitOrdersQuery } from 'services/smartExit'
import { useUserPositionsQuery } from 'services/zapEarn'
import styled from 'styled-components'

import TokenLogo from 'components/TokenLogo'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import { Badge, BadgeType, ChainImage, ImageContainer } from 'pages/Earns/UserPositions/styles'

import { PoolPageWrapper, TableWrapper } from '../PoolExplorer/styles'
import Filter from '../UserPositions/Filter'
import useFilter from '../UserPositions/useFilter'
import { earnSupportedChains, earnSupportedExchanges } from '../constants'
import useSupportedDexesAndChains from '../hooks/useSupportedDexesAndChains'

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 0.5fr 40px;
  color: ${({ theme }) => theme.subText};
  padding: 16px 0;
  gap: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const TableRow = styled(TableHeader)`
  align-items: center;
  color: ${({ theme }) => theme.text};
`

const SmartExit = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()

  const [loading, setLoading] = useState(false)
  const { filters, updateFilters } = useFilter()
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  // Fetch smart exit orders
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useGetSmartExitOrdersQuery(
    {
      chainId: chainId,
      userWallet: account || '',
    },
    {
      skip: !account || !chainId,
      pollingInterval: 30000, // Poll every 30 seconds
    },
  )

  useEffect(() => {
    if (ordersLoading) {
      setLoading(true)
    } else {
      setLoading(false)
    }
  }, [ordersLoading])

  const { data: userPosition } = useUserPositionsQuery(
    { chainIds: earnSupportedChains.join(','), addresses: account || '', protocols: earnSupportedExchanges.join(',') },
    {
      skip: !account,
      pollingInterval: 15_000,
    },
  )

  return (
    <PoolPageWrapper>
      <Flex alignItems="center" sx={{ gap: 3 }}>
        <IconArrowLeft onClick={() => navigate(-1)} />
        <Text as="h1" fontSize={24} fontWeight="500">
          <Trans>Smart Exit Orders</Trans>
        </Text>
      </Flex>

      <Filter
        supportedChains={supportedChains}
        supportedDexes={supportedDexes}
        filters={filters}
        updateFilters={(...args) => {
          updateFilters(...args)
          setLoading(true)
        }}
      />

      <TableWrapper style={{ padding: '16px 20px' }}>
        <TableHeader>
          <Text>
            <Trans>Position</Trans>
          </Text>
          <Text>
            <Trans>Conditional</Trans>
          </Text>
          <Text textAlign="center">
            <Trans>Status</Trans>
          </Text>
          <div></div>
        </TableHeader>

        {loading ? (
          <Flex justifyContent="center" padding="20px">
            <Text color="subText">
              <Trans>Loading orders...</Trans>
            </Text>
          </Flex>
        ) : ordersError ? (
          <Flex justifyContent="center" padding="20px">
            <Text color="red">
              <Trans>Error loading orders</Trans>
            </Text>
          </Flex>
        ) : orders.length === 0 ? (
          <Flex justifyContent="center" padding="20px">
            <Text color="subText">
              <Trans>No smart exit orders found</Trans>
            </Text>
          </Flex>
        ) : (
          orders.map(order => {
            const posDetail = userPosition?.find(
              us => us.tokenId === order.positionId && +us.chainId === +order.chainId,
            )
            if (!posDetail) return null
            const token0 = posDetail.currentAmounts[0].token
            const token1 = posDetail.currentAmounts[1].token

            const { conditions, op } = order.condition.logical
            return (
              <TableRow key={order.id}>
                <div>
                  <Flex mx="12px" alignItems="center">
                    <ImageContainer>
                      <TokenLogo src={token0.logo} />
                      <TokenLogo src={token1.logo} translateLeft />
                      <ChainImage src={posDetail.chainLogo} alt="" />
                    </ImageContainer>
                    <Text mr="8px">
                      {token0.symbol}/{token1.symbol}
                    </Text>
                    <Badge>Fee {posDetail?.pool.tickSpacing / 10_0}%</Badge>
                  </Flex>
                  <Flex alignItems="center" sx={{ gap: '4px' }} mt="4px" ml="1rem">
                    <TokenLogo src={posDetail.pool.projectLogo} size={16} />
                    <Text color={theme.subText}>
                      {posDetail.pool.project} #{order.positionId}
                    </Text>
                  </Flex>
                </div>

                <div>
                  {conditions.map((c, i) => {
                    if (c.field.type === 'fee_yield')
                      return (
                        <Text color={theme.subText} key={i}>
                          The{' '}
                          <Text as="span" color={theme.text}>
                            fee yield ≥ {Number(c.field.value.gte.toFixed(2))}%
                          </Text>{' '}
                          {i !== conditions.length - 1 && (
                            <Text as="span" fontWeight={500} color={theme.text}>
                              {op.toUpperCase()}
                            </Text>
                          )}
                        </Text>
                      )

                    if (c.field.type === 'pool_price')
                      return (
                        <Text color={theme.subText} key={i}>
                          Pool price is between{' '}
                          <Text as="span" color={theme.text}>
                            {c.field.value.gte}
                          </Text>{' '}
                          and{' '}
                          <Text as="span" color={theme.text}>
                            {c.field.value.lte}
                          </Text>{' '}
                          {i !== conditions.length - 1 && (
                            <Text as="span" fontWeight={500} color={theme.text}>
                              {op.toUpperCase()}
                            </Text>
                          )}
                        </Text>
                      )

                    if (c.field.type === 'time')
                      return (
                        <Text key={i} color={theme.subText}>
                          Todo
                        </Text>
                      )
                    return null
                  })}
                </div>
                <Flex justifyContent="center">
                  <Badge
                    style={{ height: 'max-content' }}
                    type={
                      order.status === 'open'
                        ? BadgeType.PRIMARY
                        : order.status === 'done'
                        ? BadgeType.SECONDARY
                        : order.status === 'cancelled'
                        ? BadgeType.DISABLED
                        : BadgeType.WARNING
                    }
                  >
                    {order.status === 'open'
                      ? 'Active'
                      : order.status === 'done'
                      ? 'Executed'
                      : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </Flex>
                <div></div>
              </TableRow>
            )
          })
        )}
      </TableWrapper>
    </PoolPageWrapper>
  )
}

export default SmartExit
