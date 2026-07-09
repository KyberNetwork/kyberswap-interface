import { type PropsWithChildren } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useTab from 'hooks/useTab'
import AgentInstruction from 'pages/CopyTrading/AgentProfile/AgentInstruction'
import AgentStats from 'pages/CopyTrading/AgentProfile/AgentStats'
import TabActions from 'pages/CopyTrading/AgentProfile/TabActions'
import TabHistory from 'pages/CopyTrading/AgentProfile/TabHistory'
import TabPositions from 'pages/CopyTrading/AgentProfile/TabPositions'
import { AgentIdentity, CopyTradingPage } from 'pages/CopyTrading/components/common'
import { type ProfileTab, profileTabLabel, profileTabs } from 'pages/CopyTrading/constants'
import { cn } from 'utils/cn'

type AgentProfileTabsProps = PropsWithChildren<{
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
}>

const Tabs = ({ activeTab, onTabChange, children }: AgentProfileTabsProps) => {
  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <HStack className="items-center gap-3 border-b border-darkBorder bg-background pr-4">
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist">
          {profileTabs.map((tab, index) => {
            const active = activeTab === tab
            const isLast = index === profileTabs.length - 1

            return (
              <button
                key={tab}
                aria-selected={active}
                className={cn(
                  'relative flex min-h-10 shrink-0 cursor-pointer items-center border-0 px-4 py-2 text-sm font-medium',
                  !isLast && 'border-r border-darkBorder',
                  active
                    ? 'bg-primary-15 text-primary shadow-[inset_0_-2px_0_var(--ks-primary)] hover:bg-primary-20 hover:text-primary'
                    : 'bg-transparent text-subText hover:bg-tabActive-80 hover:text-text',
                )}
                onClick={() => onTabChange(tab)}
                role="tab"
                type="button"
              >
                <span className="text-sm font-medium uppercase">{profileTabLabel[tab]}</span>
              </button>
            )
          })}
        </div>
      </HStack>

      <div className="relative min-h-20 overflow-x-auto">{children}</div>
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
  } = copyTradingApi.useGetAgentQuery(agentQuery, {
    skip: !agentCode,
  })

  const profile = agent?.data
  const { activeTab: activeProfileTab, setActiveTab: setActiveProfileTab } = useTab<ProfileTab>({
    tabs: profileTabs,
    defaultTab: 'open-position',
    queryKey: 'profileTab',
  })

  if (!profile && (isAgentFetching || isAgentLoading || isAgentUninitialized)) return null
  if (!profile) return <Navigate to={APP_PATHS.COPY_TRADING} replace />

  const currentProfileTab = activeProfileTab || 'open-position'

  return (
    <CopyTradingPage backTo={{ label: 'Leaderboard', to: APP_PATHS.COPY_TRADING }}>
      <AgentIdentity agent={profile} />

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
        <AgentStats agentId={profile.agentId} />
        <AgentInstruction agent={profile} />
      </div>

      <Tabs activeTab={currentProfileTab} onTabChange={setActiveProfileTab}>
        {currentProfileTab === 'open-position' && <TabPositions agentId={profile.agentId} />}
        {currentProfileTab === 'trade-history' && <TabHistory agentId={profile.agentId} />}
        {currentProfileTab === 'action-log' && <TabActions agentId={profile.agentId} />}
      </Tabs>
    </CopyTradingPage>
  )
}

export default AgentProfile
