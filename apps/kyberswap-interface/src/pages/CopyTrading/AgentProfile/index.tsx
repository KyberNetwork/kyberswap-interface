import { ArrowLeft } from 'react-feather'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useTab from 'hooks/useTab'
import { OpenPositionsTable, TradeHistoryTable } from 'pages/CopyTrading/AgentProfile/Tables'
import ActionLog from 'pages/CopyTrading/components/ActionLog'
import { AgentIdentity } from 'pages/CopyTrading/components/AgentIdentity'
import LineChartMock from 'pages/CopyTrading/components/LineChartMock'
import ProfileSidePanel from 'pages/CopyTrading/components/ProfileSidePanel'
import ProfileTabButton from 'pages/CopyTrading/components/ProfileTabButton'
import { ProfileStatCard, type ProfileStatItem } from 'pages/CopyTrading/components/Stats'
import { type ProfileTab, profileTabLabel, profileTabs } from 'pages/CopyTrading/constants'
import { compactUsd, formatUsd, percent, signedUsd } from 'pages/CopyTrading/helpers'

const AgentProfileView = () => {
  const navigate = useNavigate()
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

  const profileStats: ProfileStatItem[] = [
    {
      icon: 'pnl',
      value: signedUsd(stats?.totalRealizedPnlUsd),
      label: 'Total Realised P&L',
    },
    {
      icon: 'copiers',
      value: String(stats?.copiers || 0),
      label: 'Copiers',
    },
    {
      icon: 'winRate',
      value: percent(stats?.winRatePct),
      label: 'Win Rate',
    },
    {
      icon: 'aum',
      value: compactUsd(stats?.aumUsd),
      label: 'AUM',
    },
  ]

  return (
    <main className="min-w-0 flex-1 px-10 py-9 max-md:px-4">
      <Stack className="w-full gap-7">
        <button
          type="button"
          onClick={() => navigate(APP_PATHS.COPY_TRADING)}
          className="flex h-8 w-fit cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm text-subText hover:text-text"
        >
          <ArrowLeft size={14} />
          Back to Leaderboard
        </button>

        <AgentIdentity agent={profile} />

        <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
          <Stack className="col-span-2 min-w-0 gap-5">
            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
              {profileStats.map(item => (
                <ProfileStatCard key={item.label} item={item} />
              ))}
            </div>
            <LineChartMock />
          </Stack>

          <ProfileSidePanel
            copiedCapital={formatUsd(stats?.aumUsd)}
            isCopied={false}
            wishlistTokens={profile.whitelistedSymbols}
          />
        </div>

        <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
          <HStack className="border-b border-border">
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
      </Stack>
    </main>
  )
}

export default AgentProfileView
