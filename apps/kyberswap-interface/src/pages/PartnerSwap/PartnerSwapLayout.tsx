import type { ChainId } from '@kyberswap/ks-sdk-core'
import { type PropsWithChildren, type ReactNode, Suspense } from 'react'

import { LimitOrderProvider } from 'components/LimitOrder/LimitOrderContext'
import Loader from 'components/Loader'
import LocalLoader from 'components/LocalLoader'
import { Center } from 'components/Stack'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { Header } from 'pages/Swap/layout/Header'
import { TAB } from 'pages/Swap/layout/Tabs'
import { Container, PageWrapper, RightPanel, SwapFormWrapper, TradeBody } from 'pages/Swap/layout/components'

type PartnerSwapLayoutProps = PropsWithChildren<{
  activeMainTab: TAB
  activeTab: TAB
  customChainId: ChainId
  rightPanel?: ReactNode
  setActiveTab: (tab: TAB) => void
}>

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

          {rightPanel ? (
            <RightPanel>
              <Suspense fallback={<LocalLoader />}>{rightPanel}</Suspense>
            </RightPanel>
          ) : null}
        </LimitOrderProvider>
      </Container>
      <SwitchLocaleLink centered />
    </PageWrapper>
  )
}
