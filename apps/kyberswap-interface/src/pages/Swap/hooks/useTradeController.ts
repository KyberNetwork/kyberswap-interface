import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useRequiredDegenMode } from 'pages/Swap/hooks/useRequiredDegenMode'
import { type MainTab, TAB, isSettingTab } from 'pages/Swap/layout/Tabs'

export type TradeController = {
  activeMainTab: TAB
  activeTab: TAB
  highlightDegenMode: boolean
  mainTab: MainTab
  onBackToMainTab: () => void
  setActiveTab: React.Dispatch<React.SetStateAction<TAB>>
  shouldHighlightSwapBox: boolean
}

export const useTradeController = (mainTab: MainTab): TradeController => {
  const { chainId } = useActiveWeb3React()
  const qs = useParsedQueryString<{ highlightBox: string }>()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TAB>(mainTab)

  useEffect(() => {
    const inputCurrency = searchParams.get('inputCurrency')
    const outputCurrency = searchParams.get('outputCurrency')

    if (inputCurrency || outputCurrency) {
      if (pathname.includes(APP_PATHS.LIMIT))
        navigate(`${APP_PATHS.LIMIT}/${NETWORKS_INFO[chainId].route}/${inputCurrency || ''}-to-${outputCurrency || ''}`)
      else navigate(`/swap/${NETWORKS_INFO[chainId].route}/${inputCurrency || ''}-to-${outputCurrency || ''}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, chainId, navigate])

  const highlightDegenMode = useRequiredDegenMode({ setActiveTab })

  useEffect(() => {
    setActiveTab(mainTab)
  }, [mainTab])

  const isSetting = isSettingTab(activeTab)
  const activeMainTab = isSetting ? mainTab : activeTab

  const tabFromUrl = searchParams.get('tab')
  useEffect(() => {
    if (tabFromUrl === 'settings') {
      setActiveTab(TAB.SETTINGS)
      searchParams.delete('tab')
      setSearchParams(searchParams)
    }
  }, [tabFromUrl, searchParams, setSearchParams])

  const onBackToMainTab = useCallback(() => setActiveTab(mainTab), [mainTab])

  return {
    activeMainTab,
    activeTab,
    highlightDegenMode,
    mainTab,
    onBackToMainTab,
    setActiveTab,
    shouldHighlightSwapBox: qs.highlightBox === 'true',
  }
}
