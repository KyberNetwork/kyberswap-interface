import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import discoveryApi from 'services/copyTrading/api/endpoints/discovery'
import type { Address } from 'services/copyTrading/types/primitives'

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

const CopyTrading = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { account } = useActiveWeb3React()
  const previousPathname = useRef(location.pathname)

  const { data: chains, refetch: refetchChains } = discoveryApi.useGetChainsQuery()

  const { pathname } = location
  const ownerAddress = account?.toLowerCase() as Address | undefined
  const chainOptions = chains?.data || []

  useEffect(() => {
    if (!location.state?.scrollToCopyTrading) return

    window.scrollTo({ top: 80, behavior: 'smooth' })
    navigate(location, { replace: true, state: null })
  }, [location, navigate])

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname

    void refetchChains()
  }, [pathname, refetchChains])

  return (
    <CopyTradingProvider chains={chainOptions} ownerAddress={ownerAddress}>
      <CopyTradingModalProvider>
        <div className="flex min-h-screen w-full bg-black text-text max-lg:block">
          <Sidebar />
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
