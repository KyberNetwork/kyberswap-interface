import { ArrowLeft } from 'react-feather'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CopyTradingProfileTab, useGetCopyTradingAgentProfileQuery } from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useTab from 'hooks/useTab'

import ActionLog from '../components/ActionLog'
import { AgentIdentity } from '../components/AgentIdentity'
import LineChartMock from '../components/LineChartMock'
import ProfileSidePanel from '../components/ProfileSidePanel'
import ProfileTabButton from '../components/ProfileTabButton'
import { ProfileStatCard } from '../components/Stats'
import { profileTabLabel, profileTabs } from '../constants'
import { OpenPositionsTable, TradeHistoryTable } from './Tables'

const AgentProfileView = () => {
  const navigate = useNavigate()
  const { agentCode } = useParams()
  const {
    data: profile,
    isFetching,
    isLoading,
    isUninitialized,
  } = useGetCopyTradingAgentProfileQuery(agentCode || '', {
    skip: !agentCode,
  })
  const { activeTab: activeProfileTab, setActiveTab: setActiveProfileTab } = useTab<CopyTradingProfileTab>({
    tabs: profileTabs,
    defaultTab: 'open-position',
    queryKey: 'profileTab',
  })

  if (!profile && (isFetching || isLoading || isUninitialized)) return null
  if (!profile) return <Navigate to={APP_PATHS.COPY_TRADING} replace />

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

        <AgentIdentity agent={profile.agent} />

        <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
          <Stack className="col-span-2 min-w-0 gap-5">
            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
              {profile.stats.map(item => (
                <ProfileStatCard key={item.label} item={item} />
              ))}
            </div>
            <LineChartMock />
          </Stack>

          <ProfileSidePanel
            copiedCapital={profile.copiedCapital}
            isCopied={profile.isCopied}
            wishlistTokens={profile.wishlistTokens}
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
            {activeProfileTab === 'open-position' && <OpenPositionsTable rows={profile.openPositions} />}
            {activeProfileTab === 'trade-history' && <TradeHistoryTable rows={profile.tradeHistory} />}
            {activeProfileTab === 'action-log' && <ActionLog rows={profile.actionLogs} />}
          </div>
        </Stack>
      </Stack>
    </main>
  )
}

export default AgentProfileView
