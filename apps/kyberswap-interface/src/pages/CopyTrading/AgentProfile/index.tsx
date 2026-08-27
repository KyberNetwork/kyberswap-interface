import { type PropsWithChildren } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import agentApi from 'services/copyTrading/api/endpoints/agents'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'

import LocalLoader from 'components/LocalLoader'
import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useIsWalletRestoring from 'hooks/useIsWalletRestoring'
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
import { useCopyTradingContext } from 'pages/CopyTrading/context'

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
  const { ownerAddress } = useCopyTradingContext()
  const isRestoringWallet = useIsWalletRestoring()

  const {
    currentData: agent,
    isFetching: isAgentFetching,
    isLoading: isAgentLoading,
    isUninitialized: isAgentUninitialized,
  } = agentApi.useGetAgentQuery(
    { agentId: agentCode || '' },
    {
      pollingInterval: 10_000,
      skip: !agentCode,
    },
  )

  const {
    currentData: openCopyRuns,
    isFetching: isCopyRunsFetching,
    isLoading: isCopyRunsLoading,
    isUninitialized: isCopyRunsUninitialized,
  } = copyRunApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      agentId: agentCode || '',
      sortBy: 'started_at',
      sortOrder: 'desc',
      limit: 1,
    },
    { pollingInterval: 10_000, skip: !ownerAddress || !agentCode },
  )

  const { activeTab: activeProfileTab, setActiveTab: setActiveProfileTab } = useTab<ProfileTab>({
    tabs: profileTabs,
    defaultTab: 'open-position',
    queryKey: 'profileTab',
  })

  const profile = agent?.data
  const agentPending = !profile && (isAgentFetching || isAgentLoading || isAgentUninitialized)
  const copyRunPending =
    !!ownerAddress && !openCopyRuns && (isCopyRunsFetching || isCopyRunsLoading || isCopyRunsUninitialized)

  if (isRestoringWallet || agentPending || copyRunPending) {
    return (
      <CopyTradingPage>
        <LocalLoader />
      </CopyTradingPage>
    )
  }

  if (!profile || (!!ownerAddress && !openCopyRuns)) return <Navigate to={APP_PATHS.COPY_TRADING} replace />

  const currentProfileTab = activeProfileTab || 'open-position'
  const latestCopyRun = openCopyRuns?.data[0]
  const activeCopyRun = latestCopyRun?.status === 'active' ? latestCopyRun : undefined

  return (
    <CopyTradingPage backTo={{ label: 'Leaderboard', to: APP_PATHS.COPY_TRADING }}>
      <AgentIdentity agent={profile} />

      <div className="grid gap-4">
        <ResponsiveDetailGrid className="max-xl:contents">
          <AgentStats agentId={profile.agentId} />
          <StickySideColumn>
            <AgentInstruction activeCopyRun={activeCopyRun} agent={profile} />
          </StickySideColumn>
        </ResponsiveDetailGrid>

        <ResponsiveDetailItem responsiveOrder={agentProfileResponsiveOrder.activity}>
          <Tabs activeTab={currentProfileTab} onTabChange={setActiveProfileTab}>
            {currentProfileTab === 'open-position' && <TabPositions agentId={profile.agentId} />}
            {currentProfileTab === 'trade-history' && <TabHistory agentId={profile.agentId} />}
            {currentProfileTab === 'action-log' && <TabActions agentId={profile.agentId} />}
          </Tabs>
        </ResponsiveDetailItem>
      </div>
    </CopyTradingPage>
  )
}

export default AgentProfile
