import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import AgentList from 'pages/CopyTrading/AgentList'
import AgentProfile from 'pages/CopyTrading/AgentProfile'
import CopyDetailView from 'pages/CopyTrading/CopyDetail'
import CopyHistoryView from 'pages/CopyTrading/CopyHistory'
import MyCopiesView from 'pages/CopyTrading/MyCopies'
import Sidebar from 'pages/CopyTrading/components/Sidebar'
import { CopyTradingProvider } from 'pages/CopyTrading/context'
import { OWNER_ADDRESS } from 'pages/CopyTrading/helpers'

const CopyTrading = () => {
  const { pathname } = useLocation()
  const { data: leaderboard } = copyTradingApi.useGetLeaderboardQuery()
  const { data: chains } = copyTradingApi.useGetChainsQuery()
  const { data: activeRuns } = copyTradingApi.useGetCopyRunsQuery({
    ownerAddress: OWNER_ADDRESS,
    status: 'active',
  })
  const agents = leaderboard?.data || []
  const activeCopyRuns = activeRuns?.data || []

  useEffect(() => {
    window.scrollTo({ top: 80, behavior: 'smooth' })
  }, [pathname])

  return (
    <CopyTradingProvider>
      <div className="flex min-h-screen w-full bg-black text-text max-lg:block">
        <Sidebar agents={agents} activeRuns={activeCopyRuns} chains={chains?.data || []} />
        <Routes>
          <Route index element={<AgentList />} />
          <Route path="my-copies" element={<MyCopiesView />} />
          <Route path="my-copies/:copyId" element={<CopyDetailView backPath="my-copies" />} />
          <Route path="history" element={<CopyHistoryView />} />
          <Route path="history/:copyId" element={<CopyDetailView backPath="history" />} />
          <Route path=":agentCode" element={<AgentProfile />} />
          <Route path="*" element={<Navigate to={APP_PATHS.COPY_TRADING} replace />} />
        </Routes>
      </div>
    </CopyTradingProvider>
  )
}

export default CopyTrading
