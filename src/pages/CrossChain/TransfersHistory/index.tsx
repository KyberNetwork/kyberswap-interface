import { t } from '@lingui/macro'
import { Suspense, lazy, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'
import SubscribeNotificationButton from 'components/SubscribeButton'
import { APP_PATHS } from 'constants/index'
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
  const navigate = useNavigate()
  const theme = useTheme()
  const qs = useParsedQueryString<{ tab: CrossChainTab }>()
  const isPartnerSwap = window.location.pathname.includes(APP_PATHS.PARTNER_SWAP)

  const [activeTab, setTab] = useState<CrossChainTab>(
    isPartnerSwap ? CrossChainTab.ROUTE : qs.tab || CrossChainTab.ROUTE,
  )

  const onClickTab = (tab: CrossChainTab) => {
    if (!isPartnerSwap) {
      navigate({ search: `tab=${tab}` }, { replace: true })
    }
    setTab(tab)
  }

  return (
    <div className={className}>
      <RowBetween>
        <TabSelector activeTab={activeTab} setTab={onClickTab} />
        {!isPartnerSwap && (
          <SubscribeNotificationButton
            subscribeTooltip={t`Subscribe to receive notifications on your cross-chain transaction.`}
            trackingEvent={MIXPANEL_TYPE.CROSS_CHAIN_CLICK_SUBSCRIBE}
          />
        )}
      </RowBetween>
      {activeTab === CrossChainTab.HISTORY ? (
        <HistoryCrossChain />
      ) : (
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
