import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { motion } from 'framer-motion'
import { KeyboardEvent, ReactNode, useCallback, useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { X } from 'react-feather'

import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { HStack, Stack } from 'components/Stack'
import { ChainSelector } from 'components/TokenSelectorModal/ChainSelector'
import { NetworkSidebar } from 'components/TokenSelectorModal/NetworkSidebar'
import { OtherChainTokens } from 'components/TokenSelectorModal/OtherChainTokens'
import { PinnedTokens } from 'components/TokenSelectorModal/PinnedTokens'
import { TabBar, getTabSubtitle } from 'components/TokenSelectorModal/TabBar'
import TokenList from 'components/TokenSelectorModal/TokenList'
import { TokenListHeader } from 'components/TokenSelectorModal/TokenListHeader'
import { TokenListSkeleton } from 'components/TokenSelectorModal/TokenListSkeleton'
import { ContentWrapper, SearchIcon, SearchInput, SearchWrapper } from 'components/TokenSelectorModal/components'
import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { useTokenSelectorData } from 'components/TokenSelectorModal/hooks/useTokenSelectorData'
import { useTokenSelectorView } from 'components/TokenSelectorModal/hooks/useTokenSelectorView'
import { TokenSelectionContext } from 'components/TokenSelectorModal/types'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies } from 'constants/tokens'
import { CloseIcon } from 'theme'

const NoResult = ({ message }: { message?: ReactNode }) => {
  return (
    <Stack className="h-full p-5" data-testid="no-token-result">
      <p className="whitespace-pre-line text-center text-sm font-medium text-text4">
        {message || <Trans>No results found.</Trans>}
      </p>
    </Stack>
  )
}

const SearchLoading = () => (
  <Stack className="h-full items-center gap-3 p-5 pt-8" data-testid="token-search-loading">
    <Loader size="24px" />
    <p className="text-center text-sm font-medium text-text4">
      <Trans>Loading...</Trans>
    </p>
  </Stack>
)

type Props = {
  anchorChainId: ChainId
  importChainId?: ChainId
  selectedCurrency?: Currency | null
  otherSelectedCurrency?: Currency | null
  scaleERC8056Balances?: boolean
  showPinnedTokens?: boolean
  showDiscoveryTabs?: boolean
  filterWrap?: boolean
  title?: string
  tooltip?: ReactNode
  trackingSource?: string
  onRequestSelect?: (currency: Currency, context: TokenSelectionContext, intent?: 'select' | 'import') => void
  onDismiss?: () => void
  onShowTokenInfo?: (token: Token) => void
}

export const TokenSelectorContent = ({
  anchorChainId,
  importChainId,
  selectedCurrency,
  otherSelectedCurrency,
  scaleERC8056Balances,
  showPinnedTokens,
  showDiscoveryTabs = true,
  filterWrap = false,
  title,
  tooltip,
  trackingSource,
  onRequestSelect,
  onDismiss,
  onShowTokenInfo,
}: Props) => {
  const view = useTokenSelectorView({ anchorChainId, importChainId, showDiscoveryTabs, trackingSource })
  const {
    activeTab,
    selectedChainId,
    debouncedQuery,
    searchQuery,
    sort,
    inputRef,
    listTokenRef,
    listAnimation,
    metricColumn,
    rankedChains,
    visibleTabs,
    setSearchQuery,
    handleInput,
    handleChainChange,
    handleTabChange,
    cycleSort,
    changeMetricColumn,
    animateSortedRows,
  } = view
  const data = useTokenSelectorData({
    primaryChainId: selectedChainId,
    activeTab,
    debouncedQuery,
    sort,
    showDiscoveryTabs,
    filterWrap,
    otherSelectedCurrency,
  })
  const {
    visibleCurrencies,
    impersonators,
    quickSelectTokens,
    isListLoading,
    waitingForBalances,
    removeImportedToken,
    handleClickFavorite,
    handleLoadMore,
    handleRowsRendered,
    listHasMore,
    balances,
    nativeBalance,
    listExtras,
    heldAddresses,
    otherChainTokens,
    isCheckingOtherChains,
  } = data

  useEffect(() => {
    if (!isMobile) inputRef.current?.focus()
  }, [inputRef])
  useEffect(() => {
    animateSortedRows()
  }, [visibleCurrencies, animateSortedRows])

  const requestSelect = useCallback(
    (currency: Currency, method?: TokenSelectionContext['method'], intent: 'select' | 'import' = 'select') => {
      const rowIndex = visibleCurrencies.findIndex(item => item.equals(currency))
      onRequestSelect?.(
        currency,
        {
          tab: activeTab,
          query: debouncedQuery,
          method: method ?? (debouncedQuery ? 'search' : 'browse'),
          rowIndex: rowIndex >= 0 ? rowIndex : undefined,
        },
        intent,
      )
    },
    [visibleCurrencies, activeTab, debouncedQuery, onRequestSelect],
  )

  const handleEnter = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return
      const query = searchQuery.toLowerCase().trim()
      const native = NativeCurrencies[selectedChainId]
      if (query === native.symbol?.toLowerCase() || query === native.name?.toLowerCase()) {
        requestSelect(native)
        return
      }
      const candidate = visibleCurrencies[0]
      if (!candidate || (visibleCurrencies.length !== 1 && candidate.symbol?.toLowerCase() !== query)) return
      if (candidate.isToken && impersonators.has(candidate.address)) return
      requestSelect(candidate)
    },
    [searchQuery, selectedChainId, visibleCurrencies, impersonators, requestSelect],
  )

  const isAllTab = activeTab === TokenSelectorTab.All
  const isImportedTab = activeTab === TokenSelectorTab.Imported
  const isTrendingTab = activeTab === TokenSelectorTab.Trending
  const isNewTab = activeTab === TokenSelectorTab.New
  const subtitle = getTabSubtitle(activeTab)
  const emptyMessage =
    activeTab === TokenSelectorTab.Trending ? (
      <Trans>No trending tokens right recently. Check back later.</Trans>
    ) : activeTab === TokenSelectorTab.New ? (
      <Trans>No newly whitelisted token recently.</Trans>
    ) : activeTab === TokenSelectorTab.Imported ? (
      <Trans>You haven&apos;t imported any tokens yet.\nSearch a token address in the All tab to import one.</Trans>
    ) : activeTab === TokenSelectorTab.Favorites ? (
      <Trans>You have no saved tokens yet.</Trans>
    ) : undefined

  return (
    <ContentWrapper className="min-h-0 gap-3 overflow-hidden p-4" data-testid="token-selector-modal">
      <HStack className="shrink-0 items-center justify-between gap-3">
        <HStack className="min-w-0 items-center gap-1 text-xl font-medium">
          {title || <Trans>Select a token</Trans>}
          <InfoHelper
            zIndexTooltip={Z_INDEXS.MODAL}
            size={16}
            fontSize={12}
            text={
              tooltip || (
                <Trans>
                  Find a token by searching for its name or symbol or by pasting its address below.
                  <br />
                  You can select and trade any token on KyberSwap.
                </Trans>
              )
            }
          />
        </HStack>
        <CloseIcon onClick={onDismiss} data-testid="close-icon" />
      </HStack>
      <HStack className="min-h-0 flex-1 gap-3">
        {showDiscoveryTabs && (
          <NetworkSidebar chains={rankedChains} selectedChainId={selectedChainId} onChange={handleChainChange} />
        )}
        <Stack className="min-h-0 min-w-0 flex-1 gap-3">
          <Stack className="shrink-0 gap-2">
            <Stack className="gap-3">
              <HStack className="items-center gap-3">
                <SearchWrapper className="flex-1">
                  <SearchInput
                    className="bg-white-04"
                    type="text"
                    id="token-search-input"
                    data-testid="token-search-input"
                    placeholder={t`Search by name, symbol or address`}
                    value={searchQuery}
                    ref={inputRef}
                    onChange={handleInput}
                    onKeyDown={handleEnter}
                    autoComplete="off"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      aria-label="Clear search"
                      data-testid="clear-search"
                      onClick={() => {
                        setSearchQuery('')
                        inputRef.current?.focus()
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray transition-colors hover:text-text focus-visible:text-text focus-visible:outline-none"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <SearchIcon size={18} className="text-gray" />
                  )}
                </SearchWrapper>
                {showDiscoveryTabs && (
                  <div className="sm:hidden">
                    <ChainSelector
                      chains={rankedChains}
                      selectedChainId={selectedChainId}
                      onChange={handleChainChange}
                    />
                  </div>
                )}
              </HStack>

              {showPinnedTokens && quickSelectTokens.length > 0 && (
                <PinnedTokens
                  tokens={quickSelectTokens}
                  onToggleFavorite={handleClickFavorite}
                  onSelect={currency => requestSelect(currency, 'quick_select_pill')}
                  selectedCurrency={selectedCurrency}
                />
              )}
            </Stack>

            {showDiscoveryTabs && <TabBar tabs={visibleTabs} activeTab={activeTab} onChange={handleTabChange} />}
          </Stack>
          <div
            key={activeTab}
            role="tabpanel"
            id="token-selector-panel"
            className="flex min-h-0 flex-1 animate-[fadeInUp_0.3s_ease-out_both] flex-col gap-2 motion-reduce:animate-none"
          >
            {subtitle && <div className="shrink-0 px-2 text-sm font-medium leading-5 text-gray">{subtitle}</div>}

            {(visibleCurrencies.length > 0 || isListLoading) && (
              <TokenListHeader
                activeTab={activeTab}
                metricColumn={metricColumn}
                sort={sort}
                onSort={cycleSort}
                onMetricChange={changeMetricColumn}
              />
            )}

            <motion.div initial={{ opacity: 1 }} animate={listAnimation} className="flex min-h-0 flex-1 flex-col">
              {isListLoading ? (
                <TokenListSkeleton activeTab={activeTab} />
              ) : visibleCurrencies.length > 0 ? (
                <TokenList
                  listTokenRef={listTokenRef}
                  customChainId={selectedChainId}
                  currencies={visibleCurrencies}
                  balances={balances}
                  nativeBalance={nativeBalance}
                  extras={listExtras}
                  impersonators={impersonators}
                  heldAddresses={heldAddresses}
                  waitingForBalances={waitingForBalances}
                  selectedCurrency={selectedCurrency}
                  otherCurrency={otherSelectedCurrency}
                  scaleERC8056Balances={scaleERC8056Balances}
                  loadMoreRows={handleLoadMore}
                  hasMore={listHasMore}
                  onRowsRendered={handleRowsRendered}
                  onRemoveImportedToken={isImportedTab ? removeImportedToken : undefined}
                  onToggleFavorite={handleClickFavorite}
                  onCurrencySelect={currency => requestSelect(currency)}
                  onImportToken={token => requestSelect(token, undefined, 'import')}
                  onShowTokenInfo={onShowTokenInfo}
                  showAddress={isAllTab}
                  showCopyAddress={!isAllTab}
                  showPriceColumn={!isAllTab}
                  metricColumn={isTrendingTab || isNewTab ? metricColumn : undefined}
                  importAsRow={(isTrendingTab || isAllTab) && !debouncedQuery}
                />
              ) : (
                <Stack className="min-h-0 flex-1">
                  {isAllTab && (isCheckingOtherChains || otherChainTokens.length) ? (
                    <OtherChainTokens
                      tokens={otherChainTokens}
                      loading={isCheckingOtherChains}
                      loadingFallback={<SearchLoading />}
                      anchorChainId={anchorChainId}
                      onSelect={currency => requestSelect(currency)}
                    />
                  ) : (
                    <NoResult message={debouncedQuery ? undefined : emptyMessage} />
                  )}
                </Stack>
              )}
            </motion.div>
          </div>

          <div className="shrink-0 text-left text-xs font-medium italic leading-4 text-subText">
            <Trans>On-chain data for informational purposes only. Not financial advice.</Trans>
          </div>
        </Stack>
      </HStack>
    </ContentWrapper>
  )
}
