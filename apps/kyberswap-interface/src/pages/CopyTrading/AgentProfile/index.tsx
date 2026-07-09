import { Navigate, useParams } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useTab from 'hooks/useTab'
import ActionLog from 'pages/CopyTrading/AgentProfile/ActionLog'
import ProfileTabButton from 'pages/CopyTrading/AgentProfile/ProfileTabButton'
import { OpenPositionsTable, TradeHistoryTable } from 'pages/CopyTrading/AgentProfile/Tables'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { AgentIdentity, CopyTradingPage, LineChartMock, ProfileSidePanel } from 'pages/CopyTrading/components/common'
import { type ProfileTab, copyTradingStatIconMap, profileTabLabel, profileTabs } from 'pages/CopyTrading/constants'
import { compactUsd, formatUsd, percent, signedUsd } from 'pages/CopyTrading/helpers'

const AgentProfileView = () => {
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
  const { data: agentStats } = copyTradingApi.useGetAgentStatsQuery(agentQuery, {
    skip: !agentCode,
  })
  const { data: openPositions } = copyTradingApi.useGetAgentPositionsQuery(
    { ...agentQuery, status: 'open' },
    { skip: !agentCode },
  )
  const { data: closedPositions } = copyTradingApi.useGetAgentPositionsQuery(
    { ...agentQuery, status: 'closed' },
    { skip: !agentCode },
  )
  const { data: cotLogs } = copyTradingApi.useGetAgentCotLogsQuery(agentQuery, { skip: !agentCode })
  const profile = agent?.data
  const stats = agentStats?.data || profile?.stats
  const { activeTab: activeProfileTab, setActiveTab: setActiveProfileTab } = useTab<ProfileTab>({
    tabs: profileTabs,
    defaultTab: 'open-position',
    queryKey: 'profileTab',
  })

  if (!profile && (isAgentFetching || isAgentLoading || isAgentUninitialized)) return null
  if (!profile) return <Navigate to={APP_PATHS.COPY_TRADING} replace />

  const profileStats: LeaderboardStat[] = [
    {
      label: 'Total Realised P&L',
      value: signedUsd(stats?.totalRealizedPnlUsd),
      icon: copyTradingStatIconMap.money,
    },
    {
      label: 'Copiers',
      value: String(stats?.copiers || 0),
      icon: copyTradingStatIconMap.users,
    },
    {
      label: 'Win Rate',
      value: percent(stats?.winRatePct),
      icon: copyTradingStatIconMap.positionOpen,
    },
    {
      label: 'AUM',
      value: compactUsd(stats?.aumUsd),
      icon: copyTradingStatIconMap.volume,
    },
  ]

  return (
    <CopyTradingPage backTo={{ label: 'Leaderboard', to: APP_PATHS.COPY_TRADING }}>
      <AgentIdentity agent={profile} />

      <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
        <Stack className="col-span-2 min-w-0 gap-5">
          <Leaderboard items={profileStats} size="sm" />
          <LineChartMock />
        </Stack>

        <ProfileSidePanel
          copiedCapital={formatUsd(stats?.aumUsd)}
          isCopied={false}
          wishlistTokens={profile.whitelistedSymbols}
        />
      </div>

      <Stack className="overflow-hidden rounded-2xl bg-background/80">
        <HStack className="border-b border-tableHeader">
          {profileTabs.map(tab => (
            <ProfileTabButton key={tab} active={activeProfileTab === tab} onClick={() => setActiveProfileTab(tab)}>
              {profileTabLabel[tab]}
            </ProfileTabButton>
          ))}
        </HStack>

        <div className="overflow-hidden">
          {activeProfileTab === 'open-position' && <OpenPositionsTable rows={openPositions?.data || []} />}
          {activeProfileTab === 'trade-history' && <TradeHistoryTable rows={closedPositions?.data || []} />}
          {activeProfileTab === 'action-log' && <ActionLog rows={cotLogs?.data || []} />}
        </div>
      </Stack>
    </CopyTradingPage>
  )
}

export default AgentProfileView
