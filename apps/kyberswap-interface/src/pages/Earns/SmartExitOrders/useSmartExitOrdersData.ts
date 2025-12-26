import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGetSmartExitOrdersQuery } from 'services/smartExit'
import { useUserPositionsQuery } from 'services/zapEarn'

import { SmartExitDexType } from 'pages/Earns/components/SmartExit/constants'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { EarnPosition, ParsedPosition, SmartExitFilter, SmartExitOrder } from 'pages/Earns/types'
import { parsePosition } from 'pages/Earns/utils/position'
import { friendlyError } from 'utils/errorMessage'

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
      addresses: account || '',
      protocols: protocolsParam,
      positionIds: positionIdsParam,
      positionStatus: 'all',
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
    if (!userPosition || !userPosition.length) return {}

    return userPosition.reduce((acc: Record<string, ParsedPosition>, pos: EarnPosition) => {
      try {
        const parsedPos = parsePosition({
          position: pos,
          feeInfo: undefined,
          nftRewardInfo: undefined,
          isClosedFromRpc: false,
        })
        acc[pos.id.toLowerCase()] = parsedPos
      } catch (error) {
        console.error('Error parsing position:', error, pos)
      }
      return acc
    }, {} as Record<string, ParsedPosition>)
  }, [userPosition])

  const enrichedOrders = useMemo(() => {
    return orders.map(order => {
      const parsedPos = parsedPositionsById[order.positionId.toLowerCase()]

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
            }
          : undefined,
      }
      return enrichedOrder
    })
  }, [orders, parsedPositionsById])

  // Track if we have orders and positions data synced
  const hasOrdersData = orders.length > 0
  const isDataSynced = !smartExitFetching && !userPosFetching && hasOrdersData

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

  // Sync pagination with table data - only update when data is synced
  const syncedTotalItems = useMemo(() => {
    if (isDataSynced) {
      return totalItemsFromAPI
    }
    return lastTotalItemsRef.current
  }, [isDataSynced, totalItemsFromAPI])

  const syncedCurrentPage = useMemo(() => {
    if (isDataSynced) {
      return currentPage
    }
    return lastCurrentPageRef.current
  }, [isDataSynced, currentPage])

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
