import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import ClosedSubscriptionsTable from 'pages/CopyTrading/CopyHistory/ClosedSubscriptionsTable'
import { CopyHistorySummary } from 'pages/CopyTrading/CopyHistory/components'
import CopyRunsPageHeading from 'pages/CopyTrading/components/CopyRunsPageHeading'
import { CopyTradingPage, OwnerWalletRequired } from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

const PAGE_SIZE = 5

const CopyHistoryView = () => {
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRuns] = copyTradingApi.useLazyGetCopyRunsQuery()
  const [pagination, setPagination] = useState<{
    currentPage: number
    cursors: Array<string | undefined>
    ownerAddress?: string
  }>(() => ({ currentPage: 1, cursors: [undefined], ownerAddress }))
  const paginationReady = pagination.ownerAddress === ownerAddress
  const currentPage = paginationReady ? pagination.currentPage : 1
  const cursor = paginationReady ? pagination.cursors[currentPage - 1] : undefined

  useEffect(() => {
    if (!paginationReady) setPagination({ currentPage: 1, cursors: [undefined], ownerAddress })
  }, [ownerAddress, paginationReady])

  const {
    data: closedRunsResponse,
    isError: closedRunsError,
    isFetching: isClosedRunsFetching,
    refetch: retryClosedRuns,
  } = useQuery({
    enabled: !!ownerAddress && paginationReady,
    queryKey: ['copy-trading', 'copy-runs', ownerAddress, 'history', cursor],
    queryFn: () =>
      getCopyRuns({
        ownerAddress: ownerAddress || '',
        view: 'history',
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
    retry: false,
  })
  const closedRuns = closedRunsResponse?.data || []
  const nextCursor = closedRunsResponse?.pagination.nextCursor
  const hasNextPage = !!closedRunsResponse?.pagination.hasMore && !!nextCursor

  const goToNextPage = () => {
    if (!nextCursor || !hasNextPage) return
    setPagination(current => ({
      ...current,
      currentPage: current.currentPage + 1,
      cursors: [...current.cursors.slice(0, current.currentPage), nextCursor],
    }))
  }

  const goToPreviousPage = () => {
    setPagination(current => ({ ...current, currentPage: Math.max(1, current.currentPage - 1) }))
  }
  const { data: ownerSummary } = copyTradingApi.useGetOwnerCopySummaryQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'history',
    },
    { skip: !ownerAddress },
  )

  return (
    <CopyTradingPage>
      <CopyRunsPageHeading activeView="history" />
      {!ownerAddress ? (
        <OwnerWalletRequired />
      ) : (
        <>
          <CopyHistorySummary summary={ownerSummary?.data} />
          <ClosedSubscriptionsTable
            currentPage={currentPage}
            error={closedRunsError}
            hasNextPage={hasNextPage}
            loading={isClosedRunsFetching && !closedRunsResponse}
            navigating={isClosedRunsFetching}
            onNextPage={goToNextPage}
            rows={closedRuns}
            onPreviousPage={goToPreviousPage}
            onRetry={() => void retryClosedRuns()}
            onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/history/${subscription.copyRunId}`)}
          />
        </>
      )}
    </CopyTradingPage>
  )
}

export default CopyHistoryView
