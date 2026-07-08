import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  copyTradingMockData,
  useGetCopyTradingMyCopiesOverviewQuery,
  useGetCopyTradingOverviewQuery,
} from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'

import AgentProfileView from './AgentProfile'
import CopiesView from './Copies'
import CopyDetailView from './CopyDetail'
import HistoryView from './History'
import LeaderboardView from './Leaderboard'
import Sidebar from './components/Sidebar'

const CopyTrading = () => {
  const { pathname } = useLocation()
  const { data = copyTradingMockData } = useGetCopyTradingOverviewQuery()
  const { data: myCopiesOverview = copyTradingMockData.myCopiesOverview } = useGetCopyTradingMyCopiesOverviewQuery()
  const [selectedAgent, setSelectedAgent] = useState(data.leaderboard.find(agent => agent.selected)?.name || '')

  useEffect(() => {
    window.scrollTo({ top: 80, behavior: 'smooth' })
  }, [pathname])

  return (
    <div className="flex min-h-screen w-full bg-black text-text max-lg:block">
      <Sidebar data={data} myCopiesOverview={myCopiesOverview} setSelectedAgent={setSelectedAgent} />
      <Routes>
        <Route
          index
          element={<LeaderboardView data={data} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} />}
        />
        <Route path="copies" element={<CopiesView />} />
        <Route path="copies/:copyId" element={<CopyDetailView backPath="copies" />} />
        <Route path="history" element={<HistoryView />} />
        <Route path="history/:copyId" element={<CopyDetailView backPath="history" />} />
        <Route path=":agentCode" element={<AgentProfileView />} />
        <Route path="*" element={<Navigate to={APP_PATHS.COPY_TRADING} replace />} />
      </Routes>
    </div>
  )
}

export default CopyTrading
