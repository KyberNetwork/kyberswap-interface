import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { KeyboardEvent, ReactNode, Suspense, lazy, useCallback, useDeferredValue, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'

import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { HStack, Stack } from 'components/Stack'
import { CatalogPrices } from 'components/TokenSelectorModal/AllNetworks/CatalogPrices'
import { ChainTokens } from 'components/TokenSelectorModal/AllNetworks/ChainTokens'
import { useAggregateTokens } from 'components/TokenSelectorModal/AllNetworks/useAggregateTokens'
import { ChainSelector } from 'components/TokenSelectorModal/NetworkSelector/ChainSelector'
import { NetworkSidebar } from 'components/TokenSelectorModal/NetworkSelector/NetworkSidebar'
import { OtherChainTokens } from 'components/TokenSelectorModal/TokenList/OtherChainTokens'
import { PinnedTokens } from 'components/TokenSelectorModal/TokenList/PinnedTokens'
import TokenList from 'components/TokenSelectorModal/TokenList/TokenList'
import { TokenListHeader } from 'components/TokenSelectorModal/TokenList/TokenListHeader'
import { TokenListSkeleton } from 'components/TokenSelectorModal/TokenList/TokenListSkeleton'
import { TabBar, getTabSubtitle } from 'components/TokenSelectorModal/TokenSelectorContent/TabBar'
import { useTokenSelectorView } from 'components/TokenSelectorModal/TokenSelectorContent/useTokenSelectorView'
import {
  ContentWrapper,
  NoResult,
  SearchControl,
  SearchInput,
  SearchWrapper,
} from 'components/TokenSelectorModal/components'
import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { useTokenFavoriteActions } from 'components/TokenSelectorModal/hooks/useTokenFavorites'
import { useTokenSelectorData } from 'components/TokenSelectorModal/hooks/useTokenSelectorData'
import {
  NetworkSortBy,
  TokenSelectionContext,
  TokenSelectorChain,
  TokenSelectorNetwork,
  tokenRowKey,
} from 'components/TokenSelectorModal/types'
import { NETWORKS_INFO, isSupportStopMarket } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies } from 'constants/tokens'
import { CloseIcon } from 'theme'
import { NonEvmChain, NonEvmChainInfo, NonEvmCurrency } from 'types/crossChain'
import { getTokenAddress } from 'utils/tokenInfo'

const NonEvmTokenSelectorContent = lazy(
  () => import('components/TokenSelectorModal/NetworkSelector/NonEvmTokenSelectorContent'),
)

const PRIORITY_CHAINS: TokenSelectorNetwork['chainId'][] = [
  ChainId.MAINNET,
  ChainId.BASE,
  ChainId.ROBINHOOD,
  ChainId.BSCMAINNET,
  ChainId.HYPEREVM,
  NonEvmChain.Bitcoin,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.AVAXMAINNET,
]

const sortNetworksByPriority = (networks: TokenSelectorNetwork[]): TokenSelectorNetwork[] =>
  [...networks].sort((a, b) => {
    const aPriority = PRIORITY_CHAINS.indexOf(a.chainId)
    const bPriority = PRIORITY_CHAINS.indexOf(b.chainId)

    if (aPriority !== -1 || bPriority !== -1) {
      return (
        (aPriority === -1 ? PRIORITY_CHAINS.length : aPriority) -
        (bPriority === -1 ? PRIORITY_CHAINS.length : bPriority)
      )
    }

    if (typeof a.chainId === 'number' && typeof b.chainId === 'number') return a.chainId - b.chainId
    if (typeof a.chainId === 'number') return -1
    if (typeof b.chainId === 'number') return 1

    return 0
  })

const SearchLoading = () => (
  <Stack className="h-full items-center gap-3 p-5 pt-8" data-testid="token-search-loading">
    <Loader size="24px" />
    <p className="text-center text-sm font-medium text-text4">
      <Trans>Loading...</Trans>
    </p>
  </Stack>
)

const EmptyTokenMessage = ({ activeTab }: { activeTab: TokenSelectorTab }) => {
  return activeTab === TokenSelectorTab.Trending ? (
    <Trans>No trending tokens right recently. Check back later.</Trans>
  ) : activeTab === TokenSelectorTab.New ? (
    <Trans>No newly whitelisted token recently.</Trans>
  ) : activeTab === TokenSelectorTab.Imported ? (
    <Trans>You haven&apos;t imported any tokens yet.\nSearch a token address in the All tab to import one.</Trans>
  ) : activeTab === TokenSelectorTab.Favorites ? (
    <Trans>You have no saved tokens yet.</Trans>
  ) : (
    <Trans>No results found.</Trans>
  )
}

type Props = {
  requireOracle?: boolean
  chainSelectionMode?: 'wallet' | 'form'
  initialNonEvmChain?: NonEvmChain
  selectedNonEvmCurrency?: NonEvmCurrency
  onSelectNonEvmCurrency?: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  anchorChainId: ChainId
  importChainId?: ChainId
  selectedCurrency?: Currency | null
  otherSelectedCurrency?: Currency | null
  scaleERC8056Balances?: boolean
  showPinnedTokens?: boolean
  showDiscoveryTabs?: boolean
  networkSortBy?: NetworkSortBy
  filterWrap?: boolean
  title?: string
  tooltip?: ReactNode
  trackingSource?: string
  onRequestSelect?: (currency: Currency, context: TokenSelectionContext, intent?: 'select' | 'import') => void
  onDismiss?: () => void
  onShowTokenInfo?: (token: Token) => void
}

export const TokenSelectorContent = ({
  requireOracle = false,
  chainSelectionMode,
  onSelectNonEvmCurrency,
  initialNonEvmChain,
  selectedNonEvmCurrency,
  anchorChainId,
  importChainId,
  selectedCurrency,
  otherSelectedCurrency,
  scaleERC8056Balances,
  showPinnedTokens,
  showDiscoveryTabs = true,
  networkSortBy = 'priority',
  filterWrap = false,
  title,
  tooltip,
  trackingSource,
  onRequestSelect,
  onDismiss,
  onShowTokenInfo,
}: Props) => {
  const [nonEvmChain, setNonEvmChain] = useState<NonEvmChain | undefined>(initialNonEvmChain)

  const view = useTokenSelectorView({ anchorChainId, importChainId, showDiscoveryTabs, networkSortBy, trackingSource })
  const {
    activeTab,
    allNetworks,
    selectedChainId,
    debouncedQuery,
    searchQuery,
    sort,
    inputRef,
    listTokenRef,
    metricColumn,
    rankedChains,
    visibleTabs,
    setSearchQuery,
    handleInput,
    handleChainChange,
    handleTabChange,
    cycleSort,
    changeMetricColumn,
    resetScrollAfterSort,
  } = view

  // Networks available to this caller and the temporary browsing chain.
  const availableNetworks: TokenSelectorNetwork[] = requireOracle
    ? rankedChains.filter(chain => isSupportStopMarket(chain.chainId))
    : onSelectNonEvmCurrency
    ? [
        ...rankedChains,
        ...[ChainId.BLAST]
          .filter(chainId => !rankedChains.some(chain => chain.chainId === chainId))
          .map(chainId => NETWORKS_INFO[chainId as ChainId]),
        ...Object.values(NonEvmChain).map(chainId => ({ chainId, ...NonEvmChainInfo[chainId] })),
      ]
    : rankedChains
  const networks = networkSortBy === 'priority' ? sortNetworksByPriority(availableNetworks) : availableNetworks

  const aggregateActive = allNetworks && !nonEvmChain
  const aggregate = useAggregateTokens({
    active: aggregateActive,
    networks,
    activeTab,
    query: debouncedQuery,
    sort,
    filterWrap,
    otherSelectedCurrency,
  })

  // Paint the selected network and retained snapshot before mounting all chain observers.
  // Only source mounting is deferred; session guards and display identity change immediately.
  const sourceSession = useDeferredValue(aggregate.session)

  const data = useTokenSelectorData({
    enabled: !allNetworks && !nonEvmChain,
    requireOracle,
    primaryChainId: selectedChainId,
    activeTab,
    debouncedQuery,
    sort,
    showDiscoveryTabs,
    filterWrap,
    otherSelectedCurrency,
  })
  const {
    isListable,
    notice,
    emptyMessage,
    impersonators,
    quickSelectTokens,
    waitingForBalances,
    balances,
    nativeBalance,
    otherChainTokens,
    isCheckingOtherChains,
  } = data

  const { removeImportedToken, handleClickFavorite } = useTokenFavoriteActions()

  // Both controllers expose the same list contract; the view chooses its source once.
  const {
    visibleCurrencies,
    isListLoading,
    listHasMore,
    listExtras,
    heldAddresses,
    handleLoadMore,
    handleRowsRendered,
  } = allNetworks ? aggregate : data

  const isAllTab = activeTab === TokenSelectorTab.All
  const isImportedTab = activeTab === TokenSelectorTab.Imported
  const isTrendingTab = activeTab === TokenSelectorTab.Trending
  const isNewTab = activeTab === TokenSelectorTab.New
  const subtitle = getTabSubtitle(activeTab)

  const selectNetwork = (chain: TokenSelectorChain) => {
    if (chain === 'all' || typeof chain === 'number') {
      setNonEvmChain(undefined)
      handleChainChange(chain)
    } else {
      setNonEvmChain(chain)
    }
  }

  // Every selection entry point carries the same browsing context.
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

  const handleSelect = useCallback((currency: Currency) => requestSelect(currency), [requestSelect])
  const handleImport = useCallback((token: Token) => requestSelect(token, undefined, 'import'), [requestSelect])

  const handleEnter = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return

      const query = searchQuery.toLowerCase().trim()
      const native = NativeCurrencies[selectedChainId]
      if (
        !allNetworks &&
        (query === native.symbol?.toLowerCase() || query === native.name?.toLowerCase()) &&
        isListable(native)
      ) {
        requestSelect(native)
        return
      }

      const candidate = visibleCurrencies[0]
      if (!candidate || (visibleCurrencies.length !== 1 && candidate.symbol?.toLowerCase() !== query)) return
      if (
        allNetworks
          ? aggregate.balances[tokenRowKey(candidate.chainId, getTokenAddress(candidate))]?.impersonator
          : candidate.isToken && impersonators.has(candidate.address)
      )
        return

      requestSelect(candidate)
    },
    [
      searchQuery,
      selectedChainId,
      allNetworks,
      visibleCurrencies,
      impersonators,
      aggregate.balances,
      requestSelect,
      isListable,
    ],
  )

  useEffect(() => {
    if (!isMobile) inputRef.current?.focus()
  }, [inputRef])

  useEffect(() => {
    resetScrollAfterSort()
  }, [visibleCurrencies, resetScrollAfterSort])

  return (
    <ContentWrapper className="min-h-0 gap-3 overflow-hidden p-4" data-testid="token-selector-modal">
      {sourceSession === aggregate.session &&
        aggregate.groups.map(group =>
          aggregate.needsChainSources ? (
            <ChainTokens
              key={`${aggregate.session}:${group.chainId}`}
              chainId={group.chainId}
              activeTab={activeTab}
              session={aggregate.session}
              catalogTokens={group.currencies}
              onSnapshot={aggregate.onSnapshot}
            />
          ) : aggregate.needsCatalogPrices ? (
            <CatalogPrices
              key={`${aggregate.session}:${group.chainId}`}
              chainId={group.chainId}
              session={aggregate.session}
              currencies={group.currencies}
              extras={aggregate.catalogExtras}
              onSnapshot={aggregate.onSnapshot}
            />
          ) : null,
        )}
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
          <NetworkSidebar
            chains={networks}
            showAllNetworks={!requireOracle}
            selectedChainId={nonEvmChain ?? (allNetworks ? 'all' : selectedChainId)}
            onChange={selectNetwork}
          />
        )}
        {nonEvmChain ? (
          <Suspense fallback={<TokenListSkeleton activeTab={activeTab} />}>
            <NonEvmTokenSelectorContent
              key={nonEvmChain}
              chain={nonEvmChain}
              selectedCurrency={nonEvmChain === initialNonEvmChain ? selectedNonEvmCurrency : undefined}
              onSelect={currency => onSelectNonEvmCurrency?.(nonEvmChain, currency)}
              networkSelector={
                showDiscoveryTabs ? (
                  <div className="sm:hidden">
                    <ChainSelector chains={networks} selectedChainId={nonEvmChain} onChange={selectNetwork} />
                  </div>
                ) : undefined
              }
            />
          </Suspense>
        ) : (
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
                    <SearchControl
                      query={searchQuery}
                      onClear={() => {
                        setSearchQuery('')
                        inputRef.current?.focus()
                      }}
                    />
                  </SearchWrapper>
                  {showDiscoveryTabs && (
                    <div className="sm:hidden">
                      <ChainSelector
                        chains={networks}
                        showAllNetworks={!requireOracle}
                        selectedChainId={nonEvmChain ?? (allNetworks ? 'all' : selectedChainId)}
                        onChange={selectNetwork}
                      />
                    </div>
                  )}
                </HStack>

                {notice && (
                  <HStack
                    className="items-start gap-1.5 text-xs font-medium text-subText"
                    data-testid="token-selector-oracle-note"
                  >
                    <Info size={14} className="mt-px shrink-0" />
                    <span>{notice}</span>
                  </HStack>
                )}
                {!allNetworks && showPinnedTokens && quickSelectTokens.length > 0 && (
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

              <div className="flex min-h-0 flex-1 flex-col">
                {!allNetworks && isListLoading ? (
                  <TokenListSkeleton activeTab={activeTab} />
                ) : visibleCurrencies.length > 0 || (allNetworks && (isListLoading || listHasMore)) ? (
                  <TokenList
                    listTokenRef={listTokenRef}
                    allNetworks={allNetworks}
                    aggregateBalances={aggregateActive && aggregate.needsChainSources ? aggregate.balances : undefined}
                    customChainId={selectedChainId}
                    currencies={visibleCurrencies}
                    animateReorder={!searchQuery && !debouncedQuery}
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
                    loadingMore={allNetworks && isListLoading}
                    onRowsRendered={handleRowsRendered}
                    onRemoveImportedToken={isImportedTab ? removeImportedToken : undefined}
                    onToggleFavorite={handleClickFavorite}
                    onCurrencySelect={handleSelect}
                    onImportToken={handleImport}
                    onShowTokenInfo={onShowTokenInfo}
                    showAddress={isAllTab}
                    showCopyAddress={!isAllTab}
                    showPriceColumn={!isAllTab}
                    metricColumn={isTrendingTab || isNewTab ? metricColumn : undefined}
                    importAsRow={(isTrendingTab || isAllTab) && !debouncedQuery}
                  />
                ) : (
                  <Stack className="min-h-0 flex-1">
                    {!allNetworks && isAllTab && (isCheckingOtherChains || otherChainTokens.length) ? (
                      <OtherChainTokens
                        tokens={otherChainTokens}
                        loading={isCheckingOtherChains}
                        loadingFallback={<SearchLoading />}
                        anchorChainId={anchorChainId}
                        chainSelectionMode={chainSelectionMode}
                        onSelect={currency => requestSelect(currency)}
                      />
                    ) : (
                      <NoResult
                        message={
                          emptyMessage ?? (debouncedQuery ? undefined : <EmptyTokenMessage activeTab={activeTab} />)
                        }
                      />
                    )}
                  </Stack>
                )}
              </div>
            </div>

            <div className="shrink-0 text-left text-xs font-medium italic leading-4 text-subText">
              <Trans>On-chain data for informational purposes only. Not financial advice.</Trans>
            </div>
          </Stack>
        )}
      </HStack>
    </ContentWrapper>
  )
}
