import { ChainId } from '@kyberswap/ks-sdk-core'
import { type PropsWithChildren, type ReactNode, Suspense, lazy } from 'react'

import { FarmingPoolBannerSkeleton, TrendingPoolBannerSkeleton } from 'components/EarnBanner/Skeletons'
import { LimitOrderProvider } from 'components/LimitOrder/LimitOrderContext'
import Loader from 'components/Loader'
import LocalLoader from 'components/LocalLoader'
import { Center } from 'components/Stack'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { useSwapLayoutPrefetch } from 'pages/Swap/hooks/useSwapLayoutPrefetch'
import type { TradeController } from 'pages/Swap/hooks/useTradeController'
import { Header } from 'pages/Swap/layout/Header'
import { TAB } from 'pages/Swap/layout/Tabs'
import {
  BannerWrapper,
  Container,
  PageWrapper,
  RightPanel,
  SwapFormWrapper,
  TradeBody,
} from 'pages/Swap/layout/components'
import { cn } from 'utils/cn'

const FarmingPoolBanner = lazy(() => import('components/EarnBanner/FarmingPoolBanner'))
const TrendingPoolBanner = lazy(() => import('components/EarnBanner/TrendingPoolBanner'))

type SwapLayoutProps = PropsWithChildren<{
  customChainId?: ChainId
  controller: TradeController
  rightPanel?: ReactNode
  /** Shown while the right panel's code loads; a page with a shaped placeholder passes it here. */
  rightPanelFallback?: ReactNode
}>

export const SwapLayout = ({
  children,
  controller,
  rightPanel,
  rightPanelFallback,
  customChainId,
}: SwapLayoutProps) => {
  const { activeMainTab, activeTab, shouldHighlightSwapBox, onTabChange } = controller
  useSwapLayoutPrefetch()

  return (
    <PageWrapper>
      <Container>
        <LimitOrderProvider customChainId={customChainId}>
          <SwapFormWrapper>
            <Header
              customChainId={customChainId}
              activeTab={activeTab}
              onTabChange={onTabChange}
              activeMainTab={activeMainTab}
            />

            <TradeBody
              data-highlight={shouldHighlightSwapBox}
              id={TutorialIds.SWAP_FORM}
              className={cn(activeTab === TAB.INFO && 'p-0')}
            >
              <Suspense
                fallback={
                  <Center className="h-40">
                    <Loader size="20px" />
                  </Center>
                }
              >
                {children}
              </Suspense>
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
            <Suspense fallback={rightPanelFallback ?? <LocalLoader />}>{rightPanel}</Suspense>
          </RightPanel>
        </LimitOrderProvider>
      </Container>
      <SwitchLocaleLink centered />
    </PageWrapper>
  )
}
