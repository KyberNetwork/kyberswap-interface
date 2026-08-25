import { type PropsWithChildren } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import agentApi from 'services/copyTrading/api/endpoints/agents'

import LocalLoader from 'components/LocalLoader'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useTab from 'hooks/useTab'
import AgentInstruction from 'pages/CopyTrading/AgentProfile/AgentInstruction'
import AgentStats from 'pages/CopyTrading/AgentProfile/AgentStats'
import TabActions from 'pages/CopyTrading/AgentProfile/TabActions'
import TabHistory from 'pages/CopyTrading/AgentProfile/TabHistory'
import TabPositions from 'pages/CopyTrading/AgentProfile/TabPositions'
import { agentProfileResponsiveOrder } from 'pages/CopyTrading/AgentProfile/responsiveOrder'
import { AgentIdentity } from 'pages/CopyTrading/components/common/agentIdentity'
import {
  CopyTradingPage,
  ResponsiveDetailGrid,
  ResponsiveDetailItem,
  StickySideColumn,
} from 'pages/CopyTrading/components/common/layout'
import { type ProfileTab, profileTabLabel, profileTabShortLabel, profileTabs } from 'pages/CopyTrading/constants'
import { cn } from 'utils/cn'

type AgentProfileTabsProps = PropsWithChildren<{
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
}>

const Tabs = ({ activeTab, onTabChange, children }: AgentProfileTabsProps) => {
  return (
    <Stack className="overflow-hidden rounded-xl lg:bg-buttonBlack-60">
      <HStack className="items-center border-b border-darkBorder bg-background">
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist">
          {profileTabs.map((tab, index) => {
            const active = activeTab === tab
            const isLast = index === profileTabs.length - 1

            return (
              <button
                key={tab}
                aria-selected={active}
                className={cn(
                  'relative flex min-h-10 min-w-0 flex-auto cursor-pointer items-center justify-center border-0 p-2 text-sm font-medium sm:flex-none sm:px-4',
                  !isLast && 'border-r border-darkBorder',
                  active
                    ? 'bg-primary-15 text-primary shadow-[inset_0_-2px_0_var(--ks-primary)] hover:bg-primary-20 hover:text-primary'
                    : 'bg-transparent text-subText hover:bg-tabActive-80 hover:text-text',
                )}
                onClick={() => onTabChange(tab)}
                role="tab"
                type="button"
              >
                <span className="text-sm font-medium uppercase sm:hidden">
                  {profileTabShortLabel[tab] || profileTabLabel[tab]}
                </span>
                <span className="hidden text-sm font-medium uppercase sm:inline">{profileTabLabel[tab]}</span>
              </button>
            )
          })}
        </div>
      </HStack>

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
