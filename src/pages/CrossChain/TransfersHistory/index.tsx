import { t } from '@lingui/macro'
import { Suspense, lazy, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'
import SubscribeNotificationButton from 'components/SubscribeButton'
import { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'

import HistoryCrossChain from './History'
import TabSelector, { CrossChainTab } from './TabSelector'

const Routing = lazy(() => import('components/TradeRouting/RoutingCrossChain'))

type Props = {
  className?: string
}

const BridgeHistory: React.FC<Props> = ({ className }) => {
  const qs = useParsedQueryString<{ tab: CrossChainTab }>()
  const [activeTab, setTab] = useState<CrossChainTab>(qs.tab || CrossChainTab.ROUTE)

  const navigate = useNavigate()
  const onClickTab = (tab: CrossChainTab) => {
    navigate({ search: `tab=${tab}` }, { replace: true })
    setTab(tab)
  }

  const theme = useTheme()
  return (
    <div className={className}>
      <RowBetween>
        <TabSelector activeTab={activeTab} setTab={onClickTab} />
        <SubscribeNotificationButton
          subscribeTooltip={t`Subscribe to receive notifications on your cross-chain transaction`}
          trackingEvent={MIXPANEL_TYPE.CROSS_CHAIN_CLICK_SUBSCRIBE}
        />
      </RowBetween>
      {activeTab === CrossChainTab.ROUTE ? (
        <Suspense
          fallback={
            <Skeleton
              height="100px"
              baseColor={theme.background}
              highlightColor={theme.buttonGray}
              borderRadius="1rem"
            />
          }
        >
          <Routing />
        </Suspense>
      ) : (
        <HistoryCrossChain />
      )}
    </div>
  )
}

export default styled(BridgeHistory)`
  width: 100%;
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 22px;
`
