import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'
import type { Address } from 'services/copyTrading/types'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import AgentList from 'pages/CopyTrading/AgentList'
import AgentProfile from 'pages/CopyTrading/AgentProfile'
import CopyDetailView from 'pages/CopyTrading/CopyDetail'
import CopyHistoryView from 'pages/CopyTrading/CopyHistory'
import MyCopiesView from 'pages/CopyTrading/MyCopies'
import Sidebar from 'pages/CopyTrading/components/Sidebar'
import { CopyTradingProvider } from 'pages/CopyTrading/context'
import { CopyTradingModalProvider } from 'pages/CopyTrading/modals/context'

const SIDEBAR_ITEM_LIMIT = 10

const CopyTrading = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { pathname } = location
  const { account } = useActiveWeb3React()
  const ownerAddress = account?.toLowerCase() as Address | undefined
  const { data: leaderboard, refetch: refetchLeaderboard } = copyTradingApi.useGetLeaderboardQuery({
    limit: SIDEBAR_ITEM_LIMIT,
  })
  const { data: chains, refetch: refetchChains } = copyTradingApi.useGetChainsQuery()
  const { data: activeRuns, refetch: refetchActiveRuns } = copyTradingApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      limit: SIDEBAR_ITEM_LIMIT,
    },
    { skip: !ownerAddress },
  )
  const agents = leaderboard?.data || []
  const activeCopyRuns = activeRuns?.data || []
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (!location.state?.scrollToCopyTrading) return

    window.scrollTo({ top: 80, behavior: 'smooth' })
    navigate(location, { replace: true, state: null })
  }, [location, navigate])

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname

    void refetchLeaderboard()
    void refetchChains()
    if (ownerAddress) void refetchActiveRuns()
  }, [ownerAddress, pathname, refetchActiveRuns, refetchChains, refetchLeaderboard])

  return (
    <CopyTradingProvider chains={chains?.data || []} ownerAddress={ownerAddress}>
      <CopyTradingModalProvider>
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
      </CopyTradingModalProvider>
    </CopyTradingProvider>
  )
}

export default CopyTrading
