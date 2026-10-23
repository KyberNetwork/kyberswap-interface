import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { type MainTab, TAB, isSettingTab } from 'pages/Swap/Layout/Tabs'
import { useRequiredDegenMode } from 'pages/Swap/hooks/useRequiredDegenMode'
import { getTradeProductPath } from 'utils/routes'

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

  const productPath = getTradeProductPath(pathname)
  const tabFromUrl = searchParams.get('tab')
  const isSetting = isSettingTab(activeTab)
  const activeMainTab = isSetting ? mainTab : activeTab

  const onBackToMainTab = useCallback(() => setActiveTab(mainTab), [mainTab])

  useEffect(() => {
    const inputCurrency = searchParams.get('inputCurrency')
    const outputCurrency = searchParams.get('outputCurrency')

    if (inputCurrency || outputCurrency) {
      navigate(
        `${getTradeProductPath(pathname)}/${NETWORKS_INFO[chainId].route}/${inputCurrency || ''}-to-${
          outputCurrency || ''
        }`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, chainId, navigate])

  const highlightDegenMode = useRequiredDegenMode({ setActiveTab })

  // Limit and Stop Market share a mounted page, but each product opens on its own form.
  useEffect(() => {
    setActiveTab(mainTab)
  }, [mainTab, productPath])

  useEffect(() => {
    if (tabFromUrl !== 'settings' && tabFromUrl !== mainTab) return

    setActiveTab(tabFromUrl === 'settings' ? TAB.SETTINGS : mainTab)

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('tab')
    setSearchParams(nextSearchParams, { replace: true })
  }, [tabFromUrl, mainTab, searchParams, setSearchParams])

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
