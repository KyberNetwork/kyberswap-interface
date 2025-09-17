import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Flex, Text } from 'rebass'
import { useGetSmartExitOrdersQuery } from 'services/smartExit'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'

import { PoolPageWrapper, TableWrapper } from '../PoolExplorer/styles'
import Filter from '../UserPositions/Filter'
import { Badge, BadgeType } from '../UserPositions/styles'
import useFilter from '../UserPositions/useFilter'
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
      userWallet: '0x0193a8a52D77E27bDd4f12E0cDd52d8Ff1d97d68',
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
            const { conditions, op } = order.condition.logical
            return (
              <TableRow>
                <Text>{order.id}</Text>
                <div>
                  {conditions.map((c, i) => {
                    if (c.field.type === 'fee_yield')
                      return (
                        <Text color={theme.subText}>
                          The{' '}
                          <Text as="span" color={theme.text}>
                            fee yield ≥ {Number((c.field.value.gte * 100).toFixed(2))}%
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
                        <Text color={theme.subText}>
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

                    if (c.field.type === 'time') return <Text color={theme.subText}>Todo</Text>
                    return null
                  })}
                </div>
                <Flex justifyContent="center">
                  <Badge
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
