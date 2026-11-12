import { ChainId } from '@kyberswap/ks-sdk-core'
import { type PropsWithChildren, type ReactNode, Suspense } from 'react'

import { LimitOrderProvider } from 'components/LimitOrder/LimitOrderContext'
import Loader from 'components/Loader'
import LocalLoader from 'components/LocalLoader'
import { Center } from 'components/Stack'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { Header } from 'components/TradeLayout/Header'
import { TAB } from 'components/TradeLayout/Tabs'
import type { TradeController } from 'components/TradeLayout/useTradeController'
import { useTradeLayoutPrefetch } from 'components/TradeLayout/useTradeLayoutPrefetch'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { Container, PageWrapper, RightPanel, SwapFormWrapper, TradeBody } from 'pages/Swap/layout/components'
import { cn } from 'utils/cn'

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
  useTradeLayoutPrefetch()

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
            <Suspense fallback={rightPanelFallback ?? <LocalLoader />}>{rightPanel}</Suspense>
          </RightPanel>
        </LimitOrderProvider>
      </Container>
      <SwitchLocaleLink centered />
    </PageWrapper>
  )
}
