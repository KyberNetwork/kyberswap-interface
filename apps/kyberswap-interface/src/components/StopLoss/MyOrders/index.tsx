import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGetStopLossOrdersQuery } from 'services/stopLoss'

import DropdownMenu, { MenuOption } from 'components/DropdownMenu'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import SearchInput from 'components/SearchInput'
import CancelStopLossModal from 'components/StopLoss/CancelOrder/CancelStopLossModal'
import StopLossOrderRow from 'components/StopLoss/MyOrders/StopLossOrderRow'
import StopLossTableHeader from 'components/StopLoss/MyOrders/TableHeader'
import { CancelAllButton, StopLossEmptyOrders, StopLossTabSelector } from 'components/StopLoss/MyOrders/components'
import { STOP_LOSS_DEFAULT_EXPIRE } from 'components/StopLoss/constants'
import { useStopLossOrderNotifications } from 'components/StopLoss/hooks/useStopLossOrderNotifications'
import { useStopLossTracking } from 'components/StopLoss/hooks/useStopLossTracking'
import { StopLossOrder, StopLossOrderStatus } from 'components/StopLoss/types'
import { getStopLossDisplayStatus, getStopLossRecreateDraft, isActiveStopLossStatus } from 'components/StopLoss/utils'
import { APP_PATHS } from 'constants/index'
import { isSupportStopLoss } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig, { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useAppDispatch } from 'state/hooks'
import { useLimitActionHandlers } from 'state/limit/hooks'
import { updateStopLossForm } from 'state/stopLoss/reducer'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'

const PAGE_SIZE = 10
/**
 * The service exposes one status at a time and no "closed" bucket, so the Active/History split, the
 * status sub-filter and paging are all resolved here over a single bounded fetch. Splitting them
 * server-side would return pages that are mostly filtered away, leaving short pages under a total
 * count that disagrees with them.
 */
const FETCH_SIZE = 100
/** The service signs at most 100 ids into one CancelBatchOrders message. */
const BATCH_CANCEL_LIMIT = 100
const ALL_CLOSED_VALUE = 'all_closed'
const ALL_CHAINS_VALUE = 'all'
const EMPTY_ORDERS: StopLossOrder[] = []

const getActiveStatusOptions = (): MenuOption[] => [{ label: t`All Active Orders`, value: ALL_CLOSED_VALUE }]

const getClosedStatusOptions = (): MenuOption[] => [
  { label: t`All Closed Orders`, value: ALL_CLOSED_VALUE },
  { label: t`Executed Orders`, value: StopLossOrderStatus.DONE },
  { label: t`Cancelled Orders`, value: StopLossOrderStatus.CANCELLED },
  { label: t`Expired Orders`, value: StopLossOrderStatus.EXPIRED },
]

const StopLossOrders = () => {
  const { account, chainId } = useActiveWeb3React()
  const navigate = useNavigate()
  const { setInputValue } = useLimitActionHandlers()
  const dispatch = useAppDispatch()
  const tracking = useStopLossTracking()
  const [searchParams, setSearchParams] = useSearchParams()

  const [isActiveTab, setIsActiveTab] = useState(true)
  const [closedFilter, setClosedFilter] = useState<string>(ALL_CLOSED_VALUE)
  // Starts on the wallet's chain, which is where the form above places orders.
  const [selectedChainValue, setSelectedChainValue] = useState<string>(String(chainId))
  const [curPage, setCurPage] = useState(1)
  const [cancelTargets, setCancelTargets] = useState<StopLossOrder[]>([])
  const [cancellingIds, setCancellingIds] = useState<number[]>([])

  // Follow the wallet when the user switches network, or the list keeps showing the previous chain
  // while the form above creates orders on the new one.
  const previousChainId = useRef(chainId)
  useEffect(() => {
    if (previousChainId.current === chainId) return
    previousChainId.current = chainId
    setSelectedChainValue(String(chainId))
    setCurPage(1)
  }, [chainId])

  const keyword = searchParams.get('search') || ''

  const { supportedChains } = useChainsConfig()
  const stopLossChainOptions = useMemo<MenuOption[]>(
    () =>
      supportedChains
        .filter(chain => isSupportStopLoss(chain.chainId))
        .map(chain => ({ label: chain.name, value: chain.chainId.toString(), icon: chain.icon })),
    [supportedChains],
  )
  const chainOptions = useMemo<MenuOption[]>(
    () => [{ label: t`All Chains`, value: ALL_CHAINS_VALUE }, ...stopLossChainOptions],
    [stopLossChainOptions],
  )
  const isAllChains = selectedChainValue === ALL_CHAINS_VALUE
  // All Chains sends no `chainIds` at all rather than listing them: an absent filter already means
  // every chain, and enumerating them makes the request fail outright the moment our list names one
  // the service does not know.
  const queriedChainIds = useMemo(
    () => (isAllChains ? undefined : [Number(selectedChainValue) as ChainId]),
    [isAllChains, selectedChainValue],
  )

  const {
    data,
    isFetching,
    isError,
    isSuccess: isLoaded,
  } = useGetStopLossOrdersQuery(
    {
      userWallet: account || '',
      chainIds: queriedChainIds,
      page: 1,
      pageSize: FETCH_SIZE,
    },
    { skip: !account, pollingInterval: 10_000, refetchOnFocus: true },
  )

  const allOrders = data?.orders ?? EMPTY_ORDERS

  // Fed the unfiltered set so a transition out of Open is still observed on the Active tab.
  useStopLossOrderNotifications(allOrders)

  const filteredOrders = useMemo(() => {
    const scoped = allOrders.filter(order => {
      const isActive = isActiveStopLossStatus(getStopLossDisplayStatus(order))
      if (isActiveTab) return isActive
      // A failed order is still `Open` to the service, so it matches none of the closed sub-statuses
      // and surfaces only under the unfiltered view.
      return !isActive && (closedFilter === ALL_CLOSED_VALUE || order.status === closedFilter)
    })
    if (!keyword) return scoped

    const needle = keyword.trim().toLowerCase()
    return scoped.filter(
      order => order.tokenIn.toLowerCase().includes(needle) || order.tokenOut.toLowerCase().includes(needle),
    )
  }, [allOrders, isActiveTab, closedFilter, keyword])

  const totalItems = filteredOrders.length
  // Orders leave the list as they settle, so a page the user is sitting on can vanish underneath them.
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const page = Math.min(curPage, pageCount)
  const orders = useMemo(() => filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredOrders, page])

  // USD sub-lines come from the per-chain price slice, and a batch cancel is bound to one chain; both
  // fall back to the wallet's chain while the All Chains filter is on.
  const priceChainId = isAllChains ? chainId : (Number(selectedChainValue) as ChainId)
  const batchChainId = priceChainId
  const priceAddresses = useMemo(
    () =>
      Array.from(new Set(orders.filter(order => order.chainId === priceChainId).flatMap(o => [o.tokenIn, o.tokenOut]))),
    [orders, priceChainId],
  )
  const { data: rawPrices } = useTokenPricesWithLoading(priceAddresses, priceChainId)
  const priceUsd = useMemo(
    () => Object.fromEntries(Object.entries(rawPrices ?? {}).map(([address, price]) => [address.toLowerCase(), price])),
    [rawPrices],
  )

  const hasOrders = orders.length > 0
  const showNoOrders = !hasOrders && (isLoaded || isError || !account)

  /**
   * One signature covers one chain and at most 100 ids, so Cancel All can only ever reach the open
   * orders of a single chain. Under the All Chains filter that is a subset of what is on screen, which
   * the modal has to say out loud rather than silently leaving the rest behind.
   */
  const cancellableOrders = useMemo(() => {
    if (!isActiveTab) return EMPTY_ORDERS
    return allOrders
      .filter(
        order =>
          // Matches what the Active tab lists, not the raw `Open` set: a failed order keeps that
          // status until its deadline, and counting it here would offer to cancel rows the user is
          // not looking at.
          isActiveStopLossStatus(getStopLossDisplayStatus(order)) &&
          order.chainId === batchChainId &&
          !cancellingIds.includes(order.id),
      )
      .slice(0, BATCH_CANCEL_LIMIT)
  }, [allOrders, isActiveTab, batchChainId, cancellingIds])

  const onChangeKeyword = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('search', value)
    else next.delete('search')
    setSearchParams(next, { replace: true })
    setCurPage(1)
  }

  /**
   * Puts the whole order back on the card, not just its pair: the amount rides the shared swap state
   * and the rest is staged in the stop-loss store, which the form reads on mount. `sellAmount` comes
   * from the row because only it has resolved tokenIn's decimals.
   */
  const onRecreate = (order: StopLossOrder, sellAmount: string) => {
    tracking.trackRecreateClicked(order, getStopLossDisplayStatus(order))
    setInputValue(sellAmount)
    dispatch(
      updateStopLossForm({
        ...getStopLossRecreateDraft(order, STOP_LOSS_DEFAULT_EXPIRE),
        // The staged expiry is a duration, so any custom date left over from a previous draft must go.
        customDateExpire: undefined,
      }),
    )
    navigate(`${APP_PATHS.STOP_LOSS}/${NETWORKS_INFO[order.chainId].route}/${order.tokenIn}-to-${order.tokenOut}`)
  }

  return (
    <div className="flex w-full flex-col" data-testid="stop-loss-orders">
      <div className="flex min-w-0 items-center border-b border-darkBorder">
        <StopLossTabSelector
          isActiveTab={isActiveTab}
          onChange={next => {
            setIsActiveTab(next)
            setCurPage(1)
          }}
        />
        {cancellableOrders.length > 0 && (
          <div className="flex shrink-0 items-center px-4">
            <CancelAllButton onClick={() => setCancelTargets(cancellableOrders)} />
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2 px-4 py-2 max-sm:flex-col">
        <div className="flex min-w-0 items-center gap-2 max-sm:w-full">
          <DropdownMenu
            options={isActiveTab ? getActiveStatusOptions() : getClosedStatusOptions()}
            value={isActiveTab ? ALL_CLOSED_VALUE : closedFilter}
            width={150}
            mobileHalfWidth
            // The panel is clipped by the order list's rounded `overflow-hidden` shell, which cuts the
            // last option off whenever the table is short. A portalled menu escapes that box.
            usePortal
            dataTestId="stop-loss-status-filter"
            // Only the History tab has sub-statuses; the Active list has a single bucket.
            onChange={value => {
              if (isActiveTab) return
              setClosedFilter(String(value))
              setCurPage(1)
            }}
          />
          <DropdownMenu
            options={chainOptions}
            value={selectedChainValue}
            width={130}
            mobileHalfWidth
            usePortal
            dataTestId="stop-loss-chain-filter"
            onChange={value => {
              setSelectedChainValue(String(value))
              setCurPage(1)
            }}
          />
        </div>
        <SearchInput
          className="h-9 min-h-9 max-w-[280px] flex-1 rounded-[40px] py-1 max-sm:w-full max-sm:max-w-none max-sm:flex-none"
          dataTestId="stop-loss-search-input"
          placeholder={t`Search by token address`}
          maxLength={255}
          value={keyword}
          onChange={onChangeKeyword}
        />
      </div>

      <StopLossTableHeader isActiveTab={isActiveTab} />
      <div className="relative min-h-20" data-testid="stop-loss-order-list">
        <RefetchIndicator visible={isFetching} />
        {orders.map(order => (
          <StopLossOrderRow
            key={order.id}
            order={order}
            isActiveTab={isActiveTab}
            priceUsd={order.chainId === priceChainId ? priceUsd : undefined}
            isCancelling={cancellingIds.includes(order.id)}
            onCancel={target => setCancelTargets([target])}
            onRecreate={onRecreate}
          />
        ))}
        {showNoOrders && <StopLossEmptyOrders isActiveTab={isActiveTab} keyword={keyword} isError={isError} />}
      </div>

      {totalItems > PAGE_SIZE && (
        <div className="flex items-center justify-center bg-background px-4 py-2" data-testid="stop-loss-pagination">
          <Pagination
            haveBg={false}
            onPageChange={setCurPage}
            totalCount={totalItems}
            currentPage={page}
            pageSize={PAGE_SIZE}
            style={{ padding: '0' }}
          />
        </div>
      )}

      <CancelStopLossModal
        orders={cancelTargets}
        chainName={NETWORKS_INFO[batchChainId]?.name}
        hasOtherChains={
          isAllChains &&
          allOrders.some(o => isActiveStopLossStatus(getStopLossDisplayStatus(o)) && o.chainId !== batchChainId)
        }
        onDismiss={() => setCancelTargets([])}
        onCancelled={orderIds => setCancellingIds(ids => [...ids, ...orderIds])}
      />
    </div>
  )
}

export default StopLossOrders
