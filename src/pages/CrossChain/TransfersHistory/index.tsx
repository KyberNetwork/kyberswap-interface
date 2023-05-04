import { t } from '@lingui/macro'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'
import SubscribeNotificationButton from 'components/SubscribeButton'
import { RoutingCrossChain } from 'components/TradeRouting'
import { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'

import HistoryCrossChain from './History'
import TabSelector, { CrossChainTab } from './TabSelector'

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
  return (
    <div className={className}>
      <RowBetween>
        <TabSelector activeTab={activeTab} setTab={onClickTab} />
        <SubscribeNotificationButton
          subscribeTooltip={t`Subscribe to receive notifications on your cross-chain transaction`}
          trackingEvent={MIXPANEL_TYPE.BRIDGE_CLICK_SUBSCRIBE_BTN}
        />
      </RowBetween>
      {activeTab === CrossChainTab.ROUTE ? (
        <RoutingCrossChain /> // todo lazy
      ) : (
        <HistoryCrossChain /> // todo move all file
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
