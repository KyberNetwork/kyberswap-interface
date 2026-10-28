import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useGetStopMarketsQuery } from 'services/stopMarket'

import DropdownMenu, { MenuOption } from 'components/DropdownMenu'
import { CancelAllButton, EmptyOrders } from 'components/LimitOrder/MyOrders/components'
import { OrderListFilters } from 'components/LimitOrder/OrderList/OrderListComponents'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import CancelStopMarketModal from 'components/StopMarket/CancelOrder/CancelStopMarketModal'
import StopMarketEditModal from 'components/StopMarket/EditOrder/StopMarketEditModal'
import StopMarketRow from 'components/StopMarket/MyOrders/StopMarketRow'
import StopMarketTableHeader from 'components/StopMarket/MyOrders/TableHeader'
import { StopMarketRowsSkeleton, StopMarketTabSelector } from 'components/StopMarket/MyOrders/components'
import { STOP_MARKET_DEFAULT_EXPIRE, getStopMarketExpiryPresets } from 'components/StopMarket/constants'
import { useConfirmedFundingShortfalls } from 'components/StopMarket/hooks/useConfirmedFundingShortfalls'
import { useStopMarketTracking } from 'components/StopMarket/hooks/useStopMarketTracking'
import { useStopMarketsFunding } from 'components/StopMarket/hooks/useStopMarketsFunding'
import { StopMarket, StopMarketStatus } from 'components/StopMarket/types'
import {
  getStopMarketDisplayStatus,
  getStopMarketFundingKey,
  getStopMarketRecreateDraft,
} from 'components/StopMarket/utils'
import { APP_PATHS, ETHER_ADDRESS } from 'constants/index'
import { isSupportStopMarket } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig, { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useRefreshPrivateAnnouncements } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { updateStopMarketForm } from 'state/stopMarket/reducer'

const PAGE_SIZE = 10
/**
 * How many of the wallet's newest open orders the Cancel All modal works from: it names the chains it
 * can clear from the open orders in hand, which cannot come from the table's own page.
 */
const FETCH_SIZE = 100
const OPEN_STATUSES = [StopMarketStatus.OPEN]
/** Debounce on the search box, so a word in progress does not send a request per keystroke. */
const SEARCH_DEBOUNCE_MS = 300
const ALL_CLOSED_VALUE = 'all_closed'
const HISTORY_STATUSES = [StopMarketStatus.DONE, StopMarketStatus.CANCELLED, StopMarketStatus.EXPIRED]
const ALL_CHAINS_VALUE = 'all'
const EMPTY_ORDERS: StopMarket[] = []
const getClosedStatusOptions = (): MenuOption[] => [
  { label: t`All Closed Orders`, value: ALL_CLOSED_VALUE },
  { label: t`Executed Orders`, value: StopMarketStatus.DONE },
  { label: t`Cancelled Orders`, value: StopMarketStatus.CANCELLED },
  { label: t`Expired Orders`, value: StopMarketStatus.EXPIRED },
]

type Props = {
  /**
   * Set when the hosting panel owns the Active / History choice and the persistent toolbar.
   */
  isActiveTab?: boolean
  toolbarActionsContainer?: HTMLElement | null
  /** Changes when an external link explicitly asks the shared order panel to show Stop Market orders. */
  resetFiltersKey?: string
}

const StopMarkets = ({ isActiveTab: hostedActiveTab, toolbarActionsContainer, resetFiltersKey }: Props) => {
  const { account, chainId } = useActiveWeb3React()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { setInputValue } = useLimitActionHandlers()
  const { currencyIn, currencyOut } = useLimitState()
  const dispatch = useAppDispatch()
  const tracking = useStopMarketTracking()
  const { changeNetwork } = useChangeNetwork()
  const [searchParams, setSearchParams] = useSearchParams()

  const [ownActiveTab, setOwnActiveTab] = useState(true)
  const isHosted = hostedActiveTab !== undefined
  const isActiveTab = hostedActiveTab ?? ownActiveTab
  const [closedFilter, setClosedFilter] = useState<string>(ALL_CLOSED_VALUE)
  // Starts on All Chains, like the limit-order list, so it covers every order the tab badge counts.
  const [selectedChainValue, setSelectedChainValue] = useState<string>(ALL_CHAINS_VALUE)
  const [curPage, setCurPage] = useState(1)
  const [cancelTargets, setCancelTargets] = useState<StopMarket[]>([])
  const [isCancelAll, setIsCancelAll] = useState(false)
  const [cancellingIds, setCancellingIds] = useState<number[]>([])
  const [editingOrder, setEditingOrder] = useState<StopMarket>()

  // An external order link changes the kind/status, but these filters belong to this list and would
  // otherwise hide the requested order (for example, an Expired order under a previous Cancelled filter).
  useEffect(() => {
    setClosedFilter(ALL_CLOSED_VALUE)
    setSelectedChainValue(ALL_CHAINS_VALUE)
    setCurPage(1)
  }, [pathname, resetFiltersKey])

  // A single-chain filter follows the wallet when the user switches network, or the list keeps showing
  // the previous chain while the form above creates orders on the new one. All Chains already covers it.
  const previousChainId = useRef(chainId)
  useEffect(() => {
    if (previousChainId.current === chainId) return
    previousChainId.current = chainId
    setSelectedChainValue(current => (current === ALL_CHAINS_VALUE ? current : String(chainId)))
    setCurPage(1)
  }, [chainId])

  // Each tab opens on its first page, however the tab was chosen.
  const previousActiveTab = useRef(isActiveTab)
  useEffect(() => {
    if (previousActiveTab.current === isActiveTab) return
    previousActiveTab.current = isActiveTab
    setCurPage(1)
  }, [isActiveTab])

  const keyword = searchParams.get('search') || ''
  const debouncedKeyword = useDebounce(keyword, SEARCH_DEBOUNCE_MS)

  const { supportedChains } = useChainsConfig()
  const stopMarketChainOptions = useMemo<MenuOption[]>(
    () =>
      supportedChains
        .filter(chain => isSupportStopMarket(chain.chainId))
        .map(chain => ({ label: chain.name, value: chain.chainId.toString(), icon: chain.icon })),
    [supportedChains],
  )
  const chainOptions = useMemo<MenuOption[]>(
    () => [{ label: t`All Chains`, value: ALL_CHAINS_VALUE }, ...stopMarketChainOptions],
    [stopMarketChainOptions],
  )
  const isAllChains = selectedChainValue === ALL_CHAINS_VALUE
  // All Chains sends no `chainIds` at all rather than listing them: an absent filter already means
  // every chain, and enumerating them makes the request fail outright the moment our list names one
  // the service does not know.
  const queriedChainIds = useMemo(
    () => (isAllChains ? undefined : [Number(selectedChainValue) as ChainId]),
    [isAllChains, selectedChainValue],
  )

  // Each tab is one request: Active is exactly what the service calls Open, and History is its three
  // closed statuses, or the one picked. The service filters, searches and pages, so the total it
  // reports is the total of what is shown.
  const statuses = useMemo(
    () =>
      isActiveTab
        ? [StopMarketStatus.OPEN]
        : closedFilter === ALL_CLOSED_VALUE
        ? HISTORY_STATUSES
        : [closedFilter as StopMarketStatus],
    [isActiveTab, closedFilter],
  )

  // `currentData`, not `data`: `data` keeps the previous filter's orders while the new one loads, which
  // would list them under the wrong filter instead of showing that the table is loading.
  const {
    currentData,
    isFetching,
    isError,
    isSuccess: isLoaded,
    startedTimeStamp,
    refetch,
  } = useGetStopMarketsQuery(
    {
      userWallet: account || '',
      chainIds: queriedChainIds,
      statuses,
      query: debouncedKeyword || undefined,
      page: curPage,
      pageSize: PAGE_SIZE,
    },
    { skip: !account, pollingInterval: 10_000, skipPollingIfUnfocused: true, refetchOnFocus: true },
  )
  const orders = currentData?.orders ?? EMPTY_ORDERS
  const totalItems = currentData?.totalItems ?? 0
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  // Orders leave the list as they settle, so the page the user sits on can vanish underneath them.
  // Judged on the page's own answer: a page still loading reports no total at all.
  useEffect(() => {
    if (currentData && curPage > pageCount) setCurPage(pageCount)
  }, [currentData, curPage, pageCount])

  // Only open orders can still fail for want of funds, so History reads nothing.
  const funding = useStopMarketsFunding(orders, isActiveTab)
  // An order leaving the Active list has executed, been cancelled or expired, and the inbox may now hold news of
  // it. Judged only between reads of the same page and filters, where nothing else takes an order off it.
  const refreshPrivateAnnouncements = useRefreshPrivateAnnouncements()
  const listedRef = useRef<{ key: string; ids: number[] } | undefined>(undefined)
  const listKey = JSON.stringify([account, queriedChainIds, debouncedKeyword, curPage])
  useEffect(() => {
    if (!isActiveTab || !currentData) return
    const ids = currentData.orders.map(order => order.id)
    const previous = listedRef.current
    listedRef.current = { key: listKey, ids }
    if (previous?.key === listKey && previous.ids.some(id => !ids.includes(id))) refreshPrivateAnnouncements()
  }, [isActiveTab, currentData, listKey, refreshPrivateAnnouncements])

  const confirmedShortfallIds = useConfirmedFundingShortfalls(orders, funding, isActiveTab, {
    isFetching,
    isSuccess: isLoaded,
    startedTimeStamp,
    refetch,
  })

  const hasOrders = orders.length > 0
  const isInitialLoading = !!account && !currentData && !isError
  const showNoOrders = !hasOrders && !isInitialLoading && (isLoaded || isError || !account)

  // Offered whenever the Active tab shows an order, as the limit-order table does. The open orders
  // behind it are fetched only then: the modal names the chains to clear from them and hides them once
  // cancelled, while the cancel itself reaches every open order on the chosen chain, in hand or not.
  const showCancelAll = isActiveTab && orders.some(order => !cancellingIds.includes(order.id))
  const { currentData: openData } = useGetStopMarketsQuery(
    { userWallet: account || '', chainIds: queriedChainIds, statuses: OPEN_STATUSES, page: 1, pageSize: FETCH_SIZE },
    { skip: !account || !showCancelAll, refetchOnFocus: true },
  )
  /**
   * A cancelled order is greyed out only to cover the moment between the service confirming the cancel
   * and the list catching up. Once no list in hand still shows it open, the list itself says what
   * happened, so the id is let go. Judged only on the Active tab's own lists: History never shows an
   * open order, so its rows would let go of ids whose cancel the Active list has not caught up with yet.
   */
  useEffect(() => {
    if (!isActiveTab || !currentData) return
    const listed = new Set([...orders, ...(openData?.orders ?? EMPTY_ORDERS)].map(order => order.id))
    setCancellingIds(ids => {
      const next = ids.filter(id => listed.has(id))
      return next.length === ids.length ? ids : next
    })
  }, [isActiveTab, currentData, orders, openData?.orders])

  const cancellableOrders = useMemo(
    () => (openData?.orders ?? EMPTY_ORDERS).filter(order => !cancellingIds.includes(order.id)),
    [openData?.orders, cancellingIds],
  )

  const onChangeKeyword = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('search', value)
    else next.delete('search')
    setSearchParams(next, { replace: true })
    setCurPage(1)
  }

  const onSelectPair = (order: StopMarket) => {
    if (!isSupportStopMarket(order.chainId)) return
    window.scrollTo({ top: 0, behavior: 'smooth' })

    const inputAddress = currencyIn?.isNative ? ETHER_ADDRESS : currencyIn?.wrapped.address
    const outputAddress = currencyOut?.isNative ? ETHER_ADDRESS : currencyOut?.wrapped.address
    const isCurrentPair =
      order.chainId === chainId &&
      inputAddress?.toLowerCase() === order.tokenIn.toLowerCase() &&
      outputAddress?.toLowerCase() === order.tokenOut.toLowerCase()

    if (isCurrentPair) return

    const selectPair = () =>
      requestAnimationFrame(() => {
        navigate(
          `${APP_PATHS.STOP_MARKET}/${NETWORKS_INFO[order.chainId].route}/${order.tokenIn}-to-${
            order.tokenOut
          }${search}`,
        )
      })

    if (order.chainId === chainId) selectPair()
    else changeNetwork(order.chainId, selectPair)
  }

  /**
   * Puts the whole order back on the card, not just its pair: the amount rides the shared swap state
   * and the rest is staged in the stop market order store, which the form reads on mount. `sellAmount` comes
   * from the row because only it has resolved tokenIn's decimals.
   */
  const onRecreate = (order: StopMarket, sellAmount: string) => {
    tracking.trackRecreateClicked(order, getStopMarketDisplayStatus(order))
    const stageDraft = () => {
      setInputValue(sellAmount)
      dispatch(
        updateStopMarketForm({
          // Always sets `customDateExpire`, so a custom date left over from a previous draft never survives.
          ...getStopMarketRecreateDraft(order, {
            expiryPresets: getStopMarketExpiryPresets().map(preset => preset.value),
            defaultExpire: STOP_MARKET_DEFAULT_EXPIRE,
            now: Date.now(),
          }),
        }),
      )
      // Open the form even when Recreate starts from Settings or Token Info on this same product.
      navigate(
        `${APP_PATHS.STOP_MARKET}/${NETWORKS_INFO[order.chainId].route}/${order.tokenIn}-to-${
          order.tokenOut
        }?tab=limit`,
      )
    }
    // A route naming another chain is only followed on page load; later it is rewritten to the wallet's
    // chain, pair and all. An order from elsewhere therefore switches the wallet first, and a declined
    // switch leaves the form untouched.
    if (order.chainId === chainId) stageDraft()
    else changeNetwork(order.chainId, stageDraft)
  }

  // The replacement is signed on the order's own chain, so an order from another one switches the wallet first.
  const onEdit = (order: StopMarket) => {
    if (order.chainId === chainId) setEditingOrder(order)
    else changeNetwork(order.chainId, () => setEditingOrder(order))
  }

  const cancelAllButton = showCancelAll ? (
    <CancelAllButton
      dataTestId="stop-market-cancel-all-button"
      disabled={cancellableOrders.length === 0}
      onClick={() => {
        setIsCancelAll(true)
        setCancelTargets(cancellableOrders)
      }}
    />
  ) : null

  return (
    <div className="flex w-full flex-col" data-testid="stop-market-orders">
      {isHosted ? (
        toolbarActionsContainer && createPortal(cancelAllButton, toolbarActionsContainer)
      ) : (
        <div className="flex min-w-0 items-center border-b border-darkBorder">
          <StopMarketTabSelector isActiveTab={isActiveTab} onChange={setOwnActiveTab} />
          {cancelAllButton && <div className="flex shrink-0 items-center px-4">{cancelAllButton}</div>}
        </div>
      )}

      <OrderListFilters
        onSearchChange={onChangeKeyword}
        searchDataTestId="stop-market-search-input"
        searchPlaceholder={t`Search by token symbol or token address`}
        searchValue={keyword}
      >
        {/* Only History has statuses to choose between: an active order is `Open` to the service, and the
              Triggered state it can pass through lasts seconds. */}
        {!isActiveTab && (
          <DropdownMenu
            options={getClosedStatusOptions()}
            value={closedFilter}
            width={130}
            mobileHalfWidth
            // The panel is clipped by the order list's rounded `overflow-hidden` shell, which cuts the
            // last option off whenever the table is short. A portalled menu escapes that box.
            usePortal
            data-testid="stop-market-status-filter"
            onChange={value => {
              setClosedFilter(String(value))
              setCurPage(1)
            }}
          />
        )}
        <DropdownMenu
          options={chainOptions}
          value={selectedChainValue}
          width={130}
          mobileHalfWidth
          usePortal
          data-testid="stop-market-chain-filter"
          onChange={value => {
            setSelectedChainValue(String(value))
            setCurPage(1)
          }}
        />
      </OrderListFilters>

      <StopMarketTableHeader isActiveTab={isActiveTab} />
      <div className="relative min-h-20" data-testid="stop-market-order-list">
        <RefetchIndicator visible={isFetching && !isInitialLoading} />
        {isInitialLoading && <StopMarketRowsSkeleton isActiveTab={isActiveTab} />}
        {orders.map((order, index) => (
          <StopMarketRow
            key={order.id}
            order={order}
            rowIndex={index}
            isActiveTab={isActiveTab}
            isCancelling={isActiveTab && cancellingIds.includes(order.id)}
            funding={funding[getStopMarketFundingKey(order.chainId, order.tokenIn)]}
            showFundingWarnings={confirmedShortfallIds.has(order.id)}
            onCancel={target => {
              setIsCancelAll(false)
              setCancelTargets([target])
            }}
            onEdit={onEdit}
            onSelectPair={onSelectPair}
            onRecreate={onRecreate}
          />
        ))}
        {showNoOrders && (
          <div
            className="animate-[fadeIn_0.2s_ease-out_both] motion-reduce:animate-none"
            data-testid={isError ? 'stop-market-orders-error' : 'stop-market-no-orders'}
          >
            <EmptyOrders isActiveTab={isActiveTab} keyword={keyword} />
          </div>
        )}
      </div>

      {totalItems > PAGE_SIZE && (
        <div className="flex items-center justify-center bg-background px-4 py-2">
          <Pagination
            haveBg={false}
            onPageChange={setCurPage}
            totalCount={totalItems}
            currentPage={curPage}
            pageSize={PAGE_SIZE}
            style={{ padding: '0' }}
            data-testid="stop-market-pagination"
          />
        </div>
      )}

      {/* Keyed by order, so editing another one starts from that order's values. */}
      {editingOrder && (
        <StopMarketEditModal key={editingOrder.id} order={editingOrder} onDismiss={() => setEditingOrder(undefined)} />
      )}

      <CancelStopMarketModal
        orders={cancelTargets}
        isCancelAll={isCancelAll}
        onDismiss={() => setCancelTargets([])}
        onCancelled={orderIds => setCancellingIds(ids => [...ids, ...orderIds])}
      />
    </div>
  )
}

export default StopMarkets
