import { ArrowLeft } from 'react-feather'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { ButtonEmpty } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useTab from 'hooks/useTab'
import ActionLog from 'pages/CopyTrading/AgentProfile/ActionLog'
import ProfileTabButton from 'pages/CopyTrading/AgentProfile/ProfileTabButton'
import { OpenPositionsTable, TradeHistoryTable } from 'pages/CopyTrading/AgentProfile/Tables'
import {
  AgentIdentity,
  CopyTradingPage,
  LineChartMock,
  ProfileSidePanel,
  ProfileStatCard,
} from 'pages/CopyTrading/components/common'
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

  const profileStats = [
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
  ] as const

  return (
    <CopyTradingPage>
      <div className="w-fit">
        <ButtonEmpty type="button" onClick={() => navigate(APP_PATHS.COPY_TRADING)} padding="0">
          <HStack className="items-center gap-2">
            <ArrowLeft size={14} />
            Back to Leaderboard
          </HStack>
        </ButtonEmpty>
      </div>

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
