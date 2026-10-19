import { ChainId } from '@kyberswap/ks-sdk-core'
import { useAnimationControls, useReducedMotion } from 'framer-motion'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  TOKEN_SELECTOR_TAB_ORDER,
  TokenSelectorTab,
  isTrendingSupportedChain,
} from 'components/TokenSelectorModal/constants'
import { useChainsVolume } from 'components/TokenSelectorModal/hooks/useChainsVolume'
import { TokenMetricColumn, TokenSort, TokenSortField } from 'components/TokenSelectorModal/types'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { isAddress } from 'utils/address'

/** Browsing state belongs to the search view and survives an import/detail round-trip. */
type Props = {
  anchorChainId: ChainId
  importChainId?: ChainId
  showDiscoveryTabs: boolean
  trackingSource?: string
}

export const useTokenSelectorView = ({ anchorChainId, importChainId, showDiscoveryTabs, trackingSource }: Props) => {
  const { account } = useActiveWeb3React()
  const { supportedChains } = useChainsConfig()
  const { trackingHandler } = useTracking()
  const chainVolumes = useChainsVolume(showDiscoveryTabs)
  const rankedChains = useMemo(() => {
    if (!Object.keys(chainVolumes).length) return supportedChains
    return [...supportedChains].sort((a, b) => (chainVolumes[b.chainId] ?? -1) - (chainVolumes[a.chainId] ?? -1))
  }, [supportedChains, chainVolumes])
  const [selectedChainId, setSelectedChainId] = useState(anchorChainId)
  // Returning from an other-chain import keeps browsing on that token's chain, as before.
  useEffect(() => {
    if (importChainId !== undefined) setSelectedChainId(importChainId)
  }, [importChainId])
  const [activeTab, setActiveTab] = useState(() =>
    showDiscoveryTabs && !account && isTrendingSupportedChain(anchorChainId)
      ? TokenSelectorTab.Trending
      : TokenSelectorTab.All,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const trackingDebouncedQuery = useDebounce(searchQuery, 1000)
  const visibleTabs = useMemo(
    () =>
      TOKEN_SELECTOR_TAB_ORDER.filter(
        item => item !== TokenSelectorTab.Trending || isTrendingSupportedChain(selectedChainId),
      ),
    [selectedChainId],
  )
  // Preserve the existing tab/search transitions while keeping their state in one hook.
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) setActiveTab(TokenSelectorTab.All)
  }, [visibleTabs, activeTab])

  const preSearchTabRef = useRef<TokenSelectorTab | null>(null)
  useEffect(() => {
    if (debouncedQuery) {
      if (preSearchTabRef.current === null) preSearchTabRef.current = activeTab
      setActiveTab(TokenSelectorTab.All)
    } else if (preSearchTabRef.current !== null) {
      setActiveTab(preSearchTabRef.current)
      preSearchTabRef.current = null
    }
    // Query-driven only; tab changes must not restart the search transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const inputRef = useRef<HTMLInputElement>(null)
  const listTokenRef = useRef<HTMLDivElement>(null)
  const [sort, setSort] = useState<TokenSort | null>(null)
  const [metricColumn, setMetricColumn] = useState<TokenMetricColumn>('volume24h')
  const listAnimation = useAnimationControls()
  const prefersReducedMotion = useReducedMotion()
  const pendingSortAnimation = useRef(false)

  const cycleSort = useCallback((field: TokenSortField) => {
    pendingSortAnimation.current = true
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
        pendingSortAnimation.current = true
        setSort({ field: metric, dir: sort.dir })
      }
    },
    [sort],
  )
  const resetScroll = useCallback(() => {
    if (listTokenRef.current) listTokenRef.current.scrollTop = 0
  }, [])
  useEffect(() => {
    setSort(null)
    pendingSortAnimation.current = false
    resetScroll()
  }, [activeTab, selectedChainId, resetScroll])

  const animateSortedRows = useCallback(() => {
    if (!pendingSortAnimation.current) return
    pendingSortAnimation.current = false
    resetScroll()
    if (!prefersReducedMotion) {
      void listAnimation.start({ opacity: [0.4, 1], transition: { duration: 0.25, ease: 'easeOut' } })
    }
  }, [resetScroll, prefersReducedMotion, listAnimation])

  const handleTabChange = useCallback(
    (nextTab: TokenSelectorTab) => {
      setActiveTab(nextTab)
      trackingHandler(TRACKING_EVENT_TYPE.TS_TAB_SELECTED, {
        source: trackingSource,
        tab: nextTab,
        previous_tab: activeTab,
        chain: NETWORKS_INFO[selectedChainId].name,
        chain_id: selectedChainId,
      })
    },
    [activeTab, selectedChainId, trackingHandler, trackingSource],
  )
  const handleChainChange = useCallback(
    (chainId: ChainId) => {
      setSelectedChainId(chainId)
      trackingHandler(TRACKING_EVENT_TYPE.TS_CHAIN_SWITCHED, {
        source: trackingSource,
        from_chain: NETWORKS_INFO[selectedChainId].name,
        from_chain_id: selectedChainId,
        to_chain: NETWORKS_INFO[chainId].name,
        to_chain_id: chainId,
        tab: activeTab,
      })
    },
    [activeTab, selectedChainId, trackingHandler, trackingSource],
  )
  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(isAddress(selectedChainId, event.target.value) || event.target.value)
      resetScroll()
    },
    [selectedChainId, resetScroll],
  )

  useEffect(() => {
    if (!trackingDebouncedQuery || !trackingSource) return
    trackingHandler(TRACKING_EVENT_TYPE.TS_SEARCHED, {
      source: trackingSource,
      search_query: trackingDebouncedQuery,
      chain: NETWORKS_INFO[selectedChainId].name,
      chain_id: selectedChainId,
      is_address: !!isAddress(selectedChainId, trackingDebouncedQuery),
    })
  }, [trackingDebouncedQuery, trackingSource, selectedChainId, trackingHandler])

  return {
    activeTab,
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
    listAnimation,
    animateSortedRows,
  }
}
