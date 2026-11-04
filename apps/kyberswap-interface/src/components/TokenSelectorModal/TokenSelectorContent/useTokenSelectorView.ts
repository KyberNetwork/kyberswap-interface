import { ChainId } from '@kyberswap/ks-sdk-core'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useChainsVolume } from 'components/TokenSelectorModal/NetworkSelector/useChainsVolume'
import {
  TOKEN_SELECTOR_TAB_ORDER,
  TokenSelectorTab,
  isTrendingSupportedChain,
} from 'components/TokenSelectorModal/constants'
import { TokenMetricColumn, TokenSort, TokenSortField } from 'components/TokenSelectorModal/types'
import { NETWORKS_INFO } from 'constants/networks'
import useChainsConfig from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useEvmBalanceAccount } from 'state/wallet/WalletBalanceContext'
import { isAddress } from 'utils/address'

/** Browsing state belongs to the search view and survives an import/detail round-trip. */
type Props = {
  anchorChainId: ChainId
  importChainId?: ChainId
  showDiscoveryTabs: boolean
  trackingSource?: string
}

export const useTokenSelectorView = ({ anchorChainId, importChainId, showDiscoveryTabs, trackingSource }: Props) => {
  const account = useEvmBalanceAccount()
  const { supportedChains } = useChainsConfig()
  const { trackingHandler } = useTracking()

  const chainVolumes = useChainsVolume(showDiscoveryTabs)
  const rankedChains = useMemo(() => {
    if (!Object.keys(chainVolumes).length) return supportedChains
    return [...supportedChains].sort((a, b) => (chainVolumes[b.chainId] ?? -1) - (chainVolumes[a.chainId] ?? -1))
  }, [supportedChains, chainVolumes])

  const [allNetworks, setAllNetworks] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState(anchorChainId)

  const [activeTab, setActiveTab] = useState(() =>
    showDiscoveryTabs && !account && isTrendingSupportedChain(anchorChainId)
      ? TokenSelectorTab.Trending
      : TokenSelectorTab.All,
  )

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const trackingDebouncedQuery = useDebounce(searchQuery, 1000)

  const inputRef = useRef<HTMLInputElement>(null)
  const listTokenRef = useRef<HTMLDivElement>(null)

  const [sort, setSort] = useState<TokenSort | null>(null)
  const [metricColumn, setMetricColumn] = useState<TokenMetricColumn>('volume24h')
  const pendingSortScrollReset = useRef(false)

  const preSearchTabRef = useRef<TokenSelectorTab | null>(null)

  const visibleTabs = useMemo(
    () =>
      TOKEN_SELECTOR_TAB_ORDER.filter(
        item => allNetworks || item !== TokenSelectorTab.Trending || isTrendingSupportedChain(selectedChainId),
      ),
    [selectedChainId, allNetworks],
  )

  const cycleSort = useCallback((field: TokenSortField) => {
    pendingSortScrollReset.current = true
    setSort(prev => {
      if (!prev || prev.field !== field) return { field, dir: 'desc' }
      if (prev.dir === 'desc') return { field, dir: 'asc' }
      return null
    })
  }, [])

  const changeMetricColumn = useCallback(
    (metric: TokenMetricColumn) => {
      setMetricColumn(metric)
      if (sort && sort.field !== 'priceChange24h' && sort.field !== metric) {
        pendingSortScrollReset.current = true
        setSort({ field: metric, dir: sort.dir })
      }
    },
    [sort],
  )

  const resetScroll = useCallback(() => {
    if (listTokenRef.current) listTokenRef.current.scrollTop = 0
  }, [])

  const resetScrollAfterSort = useCallback(() => {
    if (!pendingSortScrollReset.current) return
    pendingSortScrollReset.current = false
    resetScroll()
  }, [resetScroll])

  const handleTabChange = useCallback(
    (nextTab: TokenSelectorTab) => {
      setActiveTab(nextTab)
      trackingHandler(TRACKING_EVENT_TYPE.TS_TAB_SELECTED, {
        source: trackingSource,
        tab: nextTab,
        previous_tab: activeTab,
        chain: allNetworks ? 'All Networks' : NETWORKS_INFO[selectedChainId].name,
        chain_id: allNetworks ? 'all' : selectedChainId,
      })
    },
    [activeTab, selectedChainId, allNetworks, trackingHandler, trackingSource],
  )

  const handleChainChange = useCallback(
    (chainId: ChainId | 'all') => {
      setAllNetworks(chainId === 'all')
      if (chainId !== 'all') setSelectedChainId(chainId)
      trackingHandler(TRACKING_EVENT_TYPE.TS_CHAIN_SWITCHED, {
        source: trackingSource,
        from_chain: allNetworks ? 'All Networks' : NETWORKS_INFO[selectedChainId].name,
        from_chain_id: allNetworks ? 'all' : selectedChainId,
        to_chain: chainId === 'all' ? 'All Networks' : NETWORKS_INFO[chainId].name,
        to_chain_id: chainId,
        tab: activeTab,
      })
    },
    [activeTab, selectedChainId, allNetworks, trackingHandler, trackingSource],
  )

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(isAddress(selectedChainId, event.target.value) || event.target.value)
      resetScroll()
    },
    [selectedChainId, resetScroll],
  )

  // Returning from an other-chain import keeps browsing on that token's chain, as before.
  useEffect(() => {
    if (importChainId !== undefined && !allNetworks) setSelectedChainId(importChainId)
  }, [importChainId, allNetworks])

  // Unsupported chains may hide the currently selected tab.
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) setActiveTab(TokenSelectorTab.All)
  }, [visibleTabs, activeTab])

  useEffect(() => {
    if (debouncedQuery) {
      if (preSearchTabRef.current === null) preSearchTabRef.current = activeTab
      setActiveTab(TokenSelectorTab.All)
    } else if (preSearchTabRef.current !== null) {
      setActiveTab(visibleTabs.includes(preSearchTabRef.current) ? preSearchTabRef.current : TokenSelectorTab.All)
      preSearchTabRef.current = null
    }
    // Query-driven only; tab changes must not restart the search transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  useEffect(() => {
    setSort(null)
    pendingSortScrollReset.current = false
    resetScroll()
  }, [activeTab, selectedChainId, allNetworks, resetScroll])

  useEffect(() => {
    if (!trackingDebouncedQuery || !trackingSource) return
    trackingHandler(TRACKING_EVENT_TYPE.TS_SEARCHED, {
      source: trackingSource,
      search_query: trackingDebouncedQuery,
      chain: allNetworks ? 'All Networks' : NETWORKS_INFO[selectedChainId].name,
      chain_id: allNetworks ? 'all' : selectedChainId,
      is_address: !!isAddress(selectedChainId, trackingDebouncedQuery),
    })
  }, [trackingDebouncedQuery, trackingSource, selectedChainId, allNetworks, trackingHandler])

  return {
    activeTab,
    allNetworks,
    visibleTabs,
    selectedChainId,
    rankedChains,
    searchQuery,
    debouncedQuery,
    setSearchQuery,
    handleInput,
    handleTabChange,
    handleChainChange,
    inputRef,
    listTokenRef,
    sort,
    cycleSort,
    metricColumn,
    changeMetricColumn,
    resetScrollAfterSort,
  }
}
