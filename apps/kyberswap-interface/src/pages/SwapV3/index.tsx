import { type ReactNode, Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { LimitOrderProvider } from 'components/LimitOrder/LimitOrderContext'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import useRequiredDegenMode from 'components/swapv2/SwapSettingsPanel/useRequiredDegenMode'
import { Container, InfoComponentsWrapper, PageWrapper, SwapFormWrapper } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useParsedQueryString from 'hooks/useParsedQueryString'
import Header from 'pages/SwapV3/Header'
import { type MainTab, TAB, isSettingTab } from 'pages/SwapV3/constants'
import { AppBodyWrapped, BannerWrapper } from 'pages/SwapV3/styles'

const FarmingPoolBanner = lazy(() => import('components/EarnBanner/FarmingPoolBanner'))
const TrendingPoolBanner = lazy(() => import('components/EarnBanner/TrendingPoolBanner'))

export { TAB, isSettingTab } from 'pages/SwapV3/constants'

export const InfoComponents = ({ children }: { children: ReactNode[] }) => {
  return children.filter(Boolean).length ? <InfoComponentsWrapper>{children}</InfoComponentsWrapper> : null
}

export type SwapV3Controller = {
  activeMainTab: TAB
  activeTab: TAB
  highlightDegenMode: boolean
  mainTab: MainTab
  onBackToMainTab: () => void
  setActiveTab: React.Dispatch<React.SetStateAction<TAB>>
  shouldHighlightSwapBox: boolean
}

export const useSwapV3Controller = (mainTab: MainTab): SwapV3Controller => {
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

type SwapV3LayoutProps = {
  children: ReactNode
  controller: SwapV3Controller
  info?: ReactNode
}

export const SwapV3Layout = ({ children, controller, info }: SwapV3LayoutProps) => {
  const { activeMainTab, activeTab, shouldHighlightSwapBox, setActiveTab } = controller

  return (
    <PageWrapper>
      <Container>
        <LimitOrderProvider>
          <SwapFormWrapper>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} activeMainTab={activeMainTab} />

            <AppBodyWrapped
              data-highlight={shouldHighlightSwapBox}
              id={TutorialIds.SWAP_FORM}
              style={activeTab === TAB.INFO ? { padding: 0 } : undefined}
            >
              <Suspense fallback={null}>{children}</Suspense>
            </AppBodyWrapped>
          </SwapFormWrapper>

          <InfoComponents>
            <Suspense fallback={null}>
              <BannerWrapper>
                <TrendingPoolBanner />
                <FarmingPoolBanner />
              </BannerWrapper>
            </Suspense>
            <Suspense fallback={null}>{info}</Suspense>
          </InfoComponents>
        </LimitOrderProvider>
      </Container>
      <SwitchLocaleLink centered />
    </PageWrapper>
  )
}
