import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { type MainTab, TAB, isSettingTab } from 'components/TradeLayout/Tabs'
import { useRequiredDegenMode } from 'components/TradeLayout/useRequiredDegenMode'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import usePageLocation from 'hooks/usePageLocation'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { getTradeProductPath } from 'utils/routes'
import { getEmbeddedSwapPair, getEmbeddedSwapSearchParams } from 'utils/swapFlow'

export type TradeController = {
  activeMainTab: TAB
  activeTab: TAB
  highlightDegenMode: boolean
  onBackToMainTab: () => void
  onTabChange: (tab: TAB) => void
  shouldHighlightSwapBox: boolean
}

export const useTradeController = (mainTab: MainTab): TradeController => {
  const { chainId } = useActiveWeb3React()
  const qs = useParsedQueryString<{ highlightBox: string }>()
  const { pathname, isEmbeddedSwap } = usePageLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [localTab, setLocalTab] = useState<TAB>(mainTab)

  const productPath = getTradeProductPath(pathname)
  const tabFromUrl = searchParams.get('tab') as TAB | null
  const activeTab = isEmbeddedSwap
    ? tabFromUrl && (tabFromUrl === TAB.SWAP || tabFromUrl === TAB.LIMIT || isSettingTab(tabFromUrl))
      ? tabFromUrl
      : mainTab
    : localTab
  const isSetting = isSettingTab(activeTab)
  const activeMainTab = isSetting ? mainTab : activeTab

  const onTabChange = useCallback(
    (tab: TAB) => {
      if (isEmbeddedSwap) {
        setSearchParams(previous => {
          const next = getEmbeddedSwapSearchParams(getEmbeddedSwapPair(previous), previous)
          next.set('tab', tab)

          return next
        })
      } else setLocalTab(tab)
    },
    [isEmbeddedSwap, setSearchParams],
  )

  const onBackToMainTab = useCallback(() => onTabChange(mainTab), [mainTab, onTabChange])

  // Migrate legacy EVM query parameters into the public network/pair path.
  useEffect(() => {
    const inputCurrency = searchParams.get('inputCurrency')
    const outputCurrency = searchParams.get('outputCurrency')

    if (!isEmbeddedSwap && (inputCurrency || outputCurrency)) {
      navigate(`${productPath}/${NETWORKS_INFO[chainId].route}/${inputCurrency || ''}-to-${outputCurrency || ''}`)
    }
  }, [chainId, isEmbeddedSwap, navigate, productPath, searchParams])

  const highlightDegenMode = useRequiredDegenMode({
    setActiveTab: onTabChange,
    syncTabWithUrl: isEmbeddedSwap,
  })

  useEffect(() => {
    setLocalTab(mainTab)
  }, [mainTab, productPath])

  // Public URLs consume a tab intent once; embedded URLs retain it as navigation state.
  useEffect(() => {
    if (!isEmbeddedSwap && (tabFromUrl === TAB.SETTINGS || tabFromUrl === mainTab)) {
      setLocalTab(tabFromUrl)

      const next = new URLSearchParams(searchParams)
      next.delete('tab')
      setSearchParams(next, { replace: true })
    }
  }, [isEmbeddedSwap, tabFromUrl, mainTab, searchParams, setSearchParams])

  return {
    activeMainTab,
    activeTab,
    highlightDegenMode,
    onBackToMainTab,
    onTabChange,
    shouldHighlightSwapBox: qs.highlightBox === 'true',
  }
}
