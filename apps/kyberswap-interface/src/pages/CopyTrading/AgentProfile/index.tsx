import { type PropsWithChildren } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import agentApi from 'services/copyTrading/api/endpoints/agents'

import LocalLoader from 'components/LocalLoader'
import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useTab from 'hooks/useTab'
import AgentInstruction from 'pages/CopyTrading/AgentProfile/AgentInstruction'
import AgentStats from 'pages/CopyTrading/AgentProfile/AgentStats'
import TabActions from 'pages/CopyTrading/AgentProfile/TabActions'
import TabHistory from 'pages/CopyTrading/AgentProfile/TabHistory'
import TabPositions from 'pages/CopyTrading/AgentProfile/TabPositions'
import { agentProfileResponsiveOrder } from 'pages/CopyTrading/AgentProfile/responsiveOrder'
import { DetailTabBar, type DetailTabOption } from 'pages/CopyTrading/components/common/DetailTabBar'
import { AgentIdentity } from 'pages/CopyTrading/components/common/agentIdentity'
import {
  CopyTradingPage,
  ResponsiveDetailGrid,
  ResponsiveDetailItem,
  StickySideColumn,
} from 'pages/CopyTrading/components/common/layout'
import { type ProfileTab, profileTabLabel, profileTabShortLabel, profileTabs } from 'pages/CopyTrading/constants'

const profileTabOptions: readonly DetailTabOption<ProfileTab>[] = profileTabs.map(tab => ({
  label: profileTabLabel[tab],
  shortLabel: profileTabShortLabel[tab],
  value: tab,
}))

type AgentProfileTabsProps = PropsWithChildren<{
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
}>

const Tabs = ({ activeTab, onTabChange, children }: AgentProfileTabsProps) => {
  return (
    <Stack className="overflow-hidden rounded-xl lg:bg-buttonBlack-60">
      <DetailTabBar activeTab={activeTab} onChange={onTabChange} options={profileTabOptions} />

      <div className="relative min-h-20">{children}</div>
    </Stack>
  )
}

const AgentProfile = () => {
  const { agentCode } = useParams()

  const agentQuery = { agentId: agentCode || '' }

  const {
    data: agent,
    isFetching: isAgentFetching,
    isLoading: isAgentLoading,
    isUninitialized: isAgentUninitialized,
  } = agentApi.useGetAgentQuery(agentQuery, {
    pollingInterval: 10_000,
    skip: !agentCode,
  })

  const { activeTab: activeProfileTab, setActiveTab: setActiveProfileTab } = useTab<ProfileTab>({
    tabs: profileTabs,
    defaultTab: 'open-position',
    queryKey: 'profileTab',
  })

  const profile = agent?.data

  if (!profile && (isAgentFetching || isAgentLoading || isAgentUninitialized)) {
    return (
      <CopyTradingPage>
        <LocalLoader />
      </CopyTradingPage>
    )
  }
  if (!profile) return <Navigate to={APP_PATHS.COPY_TRADING} replace />

  const currentProfileTab = activeProfileTab || 'open-position'

  return (
    <CopyTradingPage backTo={{ label: 'Leaderboard', to: APP_PATHS.COPY_TRADING }}>
      <AgentIdentity agent={profile} />

      <ResponsiveDetailGrid>
        <AgentStats agentId={profile.agentId} />
        <StickySideColumn>
          <AgentInstruction agent={profile} />
        </StickySideColumn>

        <ResponsiveDetailItem fullWidth responsiveOrder={agentProfileResponsiveOrder.activity}>
          <Tabs activeTab={currentProfileTab} onTabChange={setActiveProfileTab}>
            {currentProfileTab === 'open-position' && <TabPositions agentId={profile.agentId} />}
            {currentProfileTab === 'trade-history' && <TabHistory agentId={profile.agentId} />}
            {currentProfileTab === 'action-log' && <TabActions agentId={profile.agentId} />}
          </Tabs>
        </ResponsiveDetailItem>
      </ResponsiveDetailGrid>
    </CopyTradingPage>
  )
}

export default AgentProfile
