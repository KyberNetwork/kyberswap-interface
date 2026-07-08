import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import AgentListView from 'pages/CopyTrading/AgentList'
import AgentProfileView from 'pages/CopyTrading/AgentProfile'
import CopyDetailView from 'pages/CopyTrading/CopyDetail'
import CopyHistoryView from 'pages/CopyTrading/CopyHistory'
import MyCopiesView from 'pages/CopyTrading/MyCopies'
import Sidebar from 'pages/CopyTrading/components/Sidebar'
import { OWNER_ADDRESS } from 'pages/CopyTrading/helpers'

const CopyTrading = () => {
  const { pathname } = useLocation()
  const { data: leaderboardSummary } = copyTradingApi.useGetLeaderboardSummaryQuery()
  const { data: leaderboard } = copyTradingApi.useGetLeaderboardQuery()
  const { data: activeRuns } = copyTradingApi.useGetCopyRunsQuery({
    ownerAddress: OWNER_ADDRESS,
    status: 'active',
  })
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const agents = leaderboard?.data || []
  const activeCopyRuns = activeRuns?.data || []

  useEffect(() => {
    window.scrollTo({ top: 80, behavior: 'smooth' })
  }, [pathname])

  return (
    <div className="flex min-h-screen w-full bg-black text-text max-lg:block">
      <Sidebar agents={agents} activeRuns={activeCopyRuns} setSelectedAgentId={setSelectedAgentId} />
      <Routes>
        <Route
          index
          element={
            <AgentListView
              leaderboardSummary={leaderboardSummary?.data}
              agents={agents}
              selectedAgentId={selectedAgentId}
              setSelectedAgentId={setSelectedAgentId}
            />
          }
        />
        <Route path="my-copies" element={<MyCopiesView />} />
        <Route path="my-copies/:copyId" element={<CopyDetailView backPath="my-copies" />} />
        <Route path="history" element={<CopyHistoryView />} />
        <Route path="history/:copyId" element={<CopyDetailView backPath="history" />} />
        <Route path=":agentCode" element={<AgentProfileView />} />
        <Route path="*" element={<Navigate to={APP_PATHS.COPY_TRADING} replace />} />
      </Routes>
    </div>
  )
}

export default CopyTrading
