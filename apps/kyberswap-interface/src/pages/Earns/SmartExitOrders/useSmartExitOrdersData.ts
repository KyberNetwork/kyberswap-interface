import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGetSmartExitOrdersQuery } from 'services/smartExit'
import { useUserPositionsQuery } from 'services/zapEarn'

import { SmartExitDexType } from 'pages/Earns/components/SmartExit/constants'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import {
  OrderStatus,
  ParsedPosition,
  PositionStatus,
  SmartExitFilter,
  SmartExitOrder,
  UserPosition,
} from 'pages/Earns/types'
import { parsePosition } from 'pages/Earns/utils/position'
import { friendlyError } from 'utils/errorMessage'

/**
 * For executed orders, the position may be closed and `earningFeeYield` from position data
 * could be undefined/NaN (since totalProvide becomes 0 for closed positions).
 *
 * When an order is executed, it means the fee yield condition was met (actual yield >= target).
 * Since we cannot calculate the exact yield at execution time from closed position data,
 * we return the target yield from the condition as a lower bound representation.
 *
 * This is a reasonable approximation because:
 * 1. The order executed, so the condition was satisfied (actual >= target)
 * 2. The target yield is what the user set as their exit threshold
 * 3. Displaying the target provides meaningful context about why the order triggered
 */
const getExecutedOrderFeeYield = (order: SmartExitOrder): number | undefined => {
  const execution = order.executions[0]
  if (!execution?.extraData) return undefined

  const { executedAmounts, receivedAmounts, tokensInfo } = execution.extraData
  if (!executedAmounts || !tokensInfo || executedAmounts.length < 2 || tokensInfo.length < 2) {
    return undefined
  }

  const executedUsd =
    parseFloat(executedAmounts[0]?.amountUsd || '0') + parseFloat(executedAmounts[1]?.amountUsd || '0')
  const receivedUsd =
    parseFloat(receivedAmounts?.[0]?.amountUsd || '0') + parseFloat(receivedAmounts?.[1]?.amountUsd || '0')

  // Verify we have valid execution data before returning the target yield
  if (receivedUsd > 0 || executedUsd > 0) {
    const feeYieldCondition = order.condition.logical.conditions.find(c => c.field.type === 'fee_yield')
    if (feeYieldCondition) {
      return feeYieldCondition.field.value.gte
    }
  }

  return undefined
}

// Parsed order with position data aggregated
export type ParsedSmartExitOrder = SmartExitOrder & {
  position?: {
    token0: ParsedPosition['token0']
    token1: ParsedPosition['token1']
    chain: ParsedPosition['chain']
    dex: ParsedPosition['dex']
    poolFee: ParsedPosition['pool']['fee']
    status: ParsedPosition['status']
    currentValue: ParsedPosition['currentValue']
    // Can be undefined for executed orders where position is closed and yield cannot be calculated
    earningFeeYield: ParsedPosition['earningFeeYield'] | undefined
    priceRange: ParsedPosition['priceRange']
    tickSpacing: ParsedPosition['pool']['tickSpacing']
  }
}

type UseSmartExitOrdersDataParams = {
  account?: string | null
  filters: SmartExitFilter
  pageSize: number
  updateFilters: (key: keyof SmartExitFilter, value: string | number) => void
}

export function useSmartExitOrdersData({ account, filters, pageSize, updateFilters }: UseSmartExitOrdersDataParams) {
  const currentPage = filters.page || 1
  const [pageLoading, setPageLoading] = useState(false)
  const prevFiltersRef = useRef<SmartExitFilter>()

  const lastEnrichedOrdersRef = useRef<ParsedSmartExitOrder[]>([])
  const lastTotalItemsRef = useRef<number>(0)
  const lastCurrentPageRef = useRef<number>(1)

  const {
    data: ordersData,
    isLoading: smartExitLoading,
    isFetching: smartExitFetching,
    error: ordersError,
  } = useGetSmartExitOrdersQuery(
    {
      chainIds: filters.chainIds || undefined,
      userWallet: account || '',
      status: filters.status || undefined,
      dexTypes: filters.dexTypes || undefined,
      page: currentPage,
      pageSize,
    },
    {
      skip: !account,
      pollingInterval: 30000,
    },
  )

  const orders = useMemo(() => ordersData?.orders || [], [ordersData])
  const totalItemsFromAPI = ordersData?.totalItems || 0

  const dexTypeToExchange = useMemo(
    () =>
      Object.entries(EARN_DEXES).reduce((acc, [exchange, dexInfo]) => {
        if (dexInfo.smartExitDexType) {
          acc[dexInfo.smartExitDexType] = exchange as Exchange
        }
        return acc
      }, {} as Record<SmartExitDexType, Exchange>),
    [],
  )

  const listUniqueChainIds = useMemo(() => [...new Set(orders.map(order => order.chainId))], [orders])
  const listUniqueExchanges = useMemo(
    () => [
      ...new Set(
        orders
          .map(order => dexTypeToExchange[order.dexType as SmartExitDexType])
          .filter((exchange): exchange is Exchange => Boolean(exchange)),
      ),
    ],
    [orders, dexTypeToExchange],
  )
  const listPositionIds = useMemo(() => [...new Set(orders.map(order => order.positionId))], [orders])

  const chainIdsParam = useMemo(() => listUniqueChainIds.join(','), [listUniqueChainIds])
  const protocolsParam = useMemo(() => listUniqueExchanges.join(','), [listUniqueExchanges])
  const positionIdsParam = useMemo(() => listPositionIds.join(','), [listPositionIds])

  const shouldSkipUserPositions = useMemo(
    () => !account || orders.length === 0 || !chainIdsParam || !protocolsParam || !positionIdsParam,
    [account, orders.length, chainIdsParam, protocolsParam, positionIdsParam],
  )

  const {
    data: userPosition,
    isLoading: userPosLoading,
    isFetching: userPosFetching,
  } = useUserPositionsQuery(
    {
      chainIds: chainIdsParam,
      wallet: account || '',
      protocols: protocolsParam,
      positionIds: positionIdsParam,
      statuses: `${PositionStatus.IN_RANGE},${PositionStatus.OUT_RANGE},${PositionStatus.CLOSED}`,
    },
    {
      skip: shouldSkipUserPositions,
    },
  )

  const isInitialOrdersLoading = smartExitLoading && !ordersData
  const isInitialUserPosLoading = userPosLoading && !userPosition
  const tableLoading = isInitialOrdersLoading || isInitialUserPosLoading
  const overlayLoading = pageLoading && !tableLoading

  useEffect(() => {
    if (!pageLoading) return
    if (!smartExitFetching && !userPosFetching) {
      setPageLoading(false)
    }
  }, [pageLoading, smartExitFetching, userPosFetching])

  // Trigger overlay when filters change (refetch orders/positions)
  useEffect(() => {
    const prevFilters = prevFiltersRef.current
    const filtersChanged = prevFilters && JSON.stringify(prevFilters) !== JSON.stringify(filters)
    if (filtersChanged && account) {
      setPageLoading(true)
    }
    prevFiltersRef.current = filters
  }, [filters, account])

  const parsedPositionsById = useMemo(() => {
    if (!userPosition || !userPosition.positions.length) return {}

    return userPosition.positions.reduce((acc: Record<string, ParsedPosition>, pos: UserPosition) => {
      try {
        const parsedPos = parsePosition({
          position: pos,
          feeInfo: undefined,
          nftRewardInfo: undefined,
          isClosedFromRpc: false,
        })
        acc[pos.positionId.toLowerCase()] = parsedPos
      } catch (error) {
        console.error('Error parsing position:', error, pos)
      }
      return acc
    }, {} as Record<string, ParsedPosition>)
  }, [userPosition])

  const enrichedOrders = useMemo(() => {
    return orders.map(order => {
      const parsedPos = parsedPositionsById[order.positionId.toLowerCase()]

      // For executed orders where position is closed, earningFeeYield may be invalid.
      // Fall back to the target yield from the order condition as a lower bound.
      let earningFeeYield: number | undefined = parsedPos?.earningFeeYield
      if (
        order.status === OrderStatus.OrderStatusDone &&
        (earningFeeYield === undefined || !isFinite(earningFeeYield) || isNaN(earningFeeYield))
      ) {
        earningFeeYield = getExecutedOrderFeeYield(order)
      }

      const enrichedOrder: ParsedSmartExitOrder = {
        ...order,
        position: parsedPos
          ? {
              token0: parsedPos.token0,
              token1: parsedPos.token1,
              chain: parsedPos.chain,
              dex: parsedPos.dex,
              poolFee: parsedPos.pool.fee,
              status: parsedPos.status,
              currentValue: parsedPos.currentValue,
              earningFeeYield: earningFeeYield,
              priceRange: parsedPos.priceRange,
              tickSpacing: parsedPos.pool.tickSpacing,
            }
          : undefined,
      }
      return enrichedOrder
    })
  }, [orders, parsedPositionsById])

  // Track if data fetch is complete (both APIs done fetching)
  const isFetchComplete = !smartExitFetching && !userPosFetching
  // Data is synced when fetch is complete AND we have orders to enrich with positions
  const hasOrdersData = orders.length > 0
  const isDataSynced = isFetchComplete && hasOrdersData

  useEffect(() => {
    // Only update cache when data is fully synced (both APIs done fetching)
    if (isDataSynced) {
      if (enrichedOrders.length) {
        lastEnrichedOrdersRef.current = enrichedOrders
      }
      lastTotalItemsRef.current = totalItemsFromAPI
      lastCurrentPageRef.current = currentPage
    }
  }, [enrichedOrders, isDataSynced, totalItemsFromAPI, currentPage])

  // Only show new orders when data is synced, otherwise keep showing cached orders
  const renderedOrders = useMemo(() => {
    if (isDataSynced) {
      return enrichedOrders
    }
    // Keep showing cached orders while syncing
    return lastEnrichedOrdersRef.current
  }, [enrichedOrders, isDataSynced])

  const ordersEmptyMessage = useMemo(
    () => (ordersError ? friendlyError(ordersError as unknown as Error) : t`No smart exit orders found`),
    [ordersError],
  )

  const shouldShowEmptyState = useMemo(
    () =>
      ordersError ||
      (isDataSynced && enrichedOrders.length === 0 && !overlayLoading) ||
      (orders.length === 0 && !smartExitFetching && !userPosFetching),
    [
      enrichedOrders.length,
      overlayLoading,
      ordersError,
      isDataSynced,
      orders.length,
      smartExitFetching,
      userPosFetching,
    ],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      setPageLoading(true)
      updateFilters('page', page)
    },
    [updateFilters],
  )

  // Sync pagination with table data - update when fetch is complete
  // Use isFetchComplete (not isDataSynced) to handle empty results correctly
  const syncedTotalItems = useMemo(() => {
    if (isFetchComplete) {
      return totalItemsFromAPI
    }
    return lastTotalItemsRef.current
  }, [isFetchComplete, totalItemsFromAPI])

  const syncedCurrentPage = useMemo(() => {
    if (isFetchComplete) {
      return currentPage
    }
    return lastCurrentPageRef.current
  }, [isFetchComplete, currentPage])

  return {
    currentPage: syncedCurrentPage,
    totalItems: syncedTotalItems,
    ordersError,
    tableLoading,
    overlayLoading,
    renderedOrders,
    handlePageChange,
    ordersEmptyMessage,
    shouldShowEmptyState,
  }
}
