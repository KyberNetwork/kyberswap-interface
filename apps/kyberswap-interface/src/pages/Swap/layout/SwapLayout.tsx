import { type ReactNode, Suspense, lazy } from 'react'

import { FarmingPoolBannerSkeleton, TrendingPoolBannerSkeleton } from 'components/EarnBanner/Skeletons'
import { LimitOrderProvider } from 'components/LimitOrder/LimitOrderContext'
import Loader from 'components/Loader'
import Skeleton from 'components/Skeleton'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { Container, PageWrapper, SwapFormWrapper } from 'components/swapv2/styleds'
import type { TradeController } from 'pages/Swap/hooks/useTradeController'
import { Header } from 'pages/Swap/layout/Header'
import { TAB } from 'pages/Swap/layout/Tabs'
import { BannerWrapper, RightPanel, TradeBody } from 'pages/Swap/layout/components'

const FarmingPoolBanner = lazy(() => import('components/EarnBanner/FarmingPoolBanner'))
const TrendingPoolBanner = lazy(() => import('components/EarnBanner/TrendingPoolBanner'))

type SwapLayoutProps = {
  children: ReactNode
  controller: TradeController
  rightPanel?: ReactNode
}

export const SwapLayout = ({ children, controller, rightPanel }: SwapLayoutProps) => {
  const { activeMainTab, activeTab, shouldHighlightSwapBox, setActiveTab } = controller

  return (
    <PageWrapper>
      <Container>
        <LimitOrderProvider>
          <SwapFormWrapper>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} activeMainTab={activeMainTab} />

            <TradeBody
              data-highlight={shouldHighlightSwapBox}
              id={TutorialIds.SWAP_FORM}
              style={activeTab === TAB.INFO ? { padding: 0 } : undefined}
            >
              <Suspense fallback={<Loader className="mx-auto my-20" />}>{children}</Suspense>
            </TradeBody>
          </SwapFormWrapper>

          <RightPanel>
            <Suspense
              fallback={
                <BannerWrapper>
                  <TrendingPoolBannerSkeleton />
                  <FarmingPoolBannerSkeleton />
                </BannerWrapper>
              }
            >
              <BannerWrapper>
                <TrendingPoolBanner />
                <FarmingPoolBanner />
              </BannerWrapper>
            </Suspense>
            <Suspense fallback={<Skeleton height={200} borderRadius={16} />}>{rightPanel}</Suspense>
          </RightPanel>
        </LimitOrderProvider>
      </Container>
      <SwitchLocaleLink centered />
    </PageWrapper>
  )
}
