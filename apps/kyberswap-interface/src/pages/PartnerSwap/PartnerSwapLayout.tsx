import type { ChainId } from '@kyberswap/ks-sdk-core'
import { type ReactNode, Suspense } from 'react'

import { LimitOrderProvider } from 'components/LimitOrder/LimitOrderContext'
import Loader from 'components/Loader'
import Skeleton from 'components/Skeleton'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { Container, PageWrapper, SwapFormWrapper } from 'components/swapv2/styleds'
import { Header } from 'pages/Swap/layout/Header'
import { TAB } from 'pages/Swap/layout/Tabs'
import { RightPanel, TradeBody } from 'pages/Swap/layout/components'

type PartnerSwapLayoutProps = {
  activeMainTab: TAB
  activeTab: TAB
  children: ReactNode
  customChainId: ChainId
  rightPanel?: ReactNode
  setActiveTab: (tab: TAB) => void
}

export const PartnerSwapLayout = ({
  activeMainTab,
  activeTab,
  children,
  customChainId,
  rightPanel,
  setActiveTab,
}: PartnerSwapLayoutProps) => {
  return (
    <PageWrapper>
      <Container>
        <LimitOrderProvider customChainId={customChainId}>
          <SwapFormWrapper>
            <Header
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              customChainId={customChainId}
              activeMainTab={activeMainTab}
            />

            <TradeBody style={activeTab === TAB.INFO ? { padding: 0 } : undefined}>
              <Suspense fallback={<Loader className="mx-auto my-20" />}>{children}</Suspense>
            </TradeBody>
          </SwapFormWrapper>

          {rightPanel ? (
            <RightPanel>
              <Suspense fallback={<Skeleton height={200} borderRadius={16} />}>{rightPanel}</Suspense>
            </RightPanel>
          ) : null}
        </LimitOrderProvider>
      </Container>
      <SwitchLocaleLink centered />
    </PageWrapper>
  )
}
