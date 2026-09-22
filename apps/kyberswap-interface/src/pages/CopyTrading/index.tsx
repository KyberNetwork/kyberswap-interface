import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import discoveryApi from 'services/copyTrading/api/endpoints/discovery'
import type { Address } from 'services/copyTrading/types/primitives'

import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import AgentList from 'pages/CopyTrading/AgentList'
import AgentProfile from 'pages/CopyTrading/AgentProfile'
import CopyDetailView from 'pages/CopyTrading/CopyDetail'
import CopyHistoryView from 'pages/CopyTrading/CopyHistory'
import MyCopiesView from 'pages/CopyTrading/MyCopies'
import Sidebar from 'pages/CopyTrading/components/Sidebar'
import { CopyTradingPage } from 'pages/CopyTrading/components/common/layout'
import { CopyTradingReadError } from 'pages/CopyTrading/components/common/status'
import { CopyTradingProvider } from 'pages/CopyTrading/context'
import { CopyTradingModalProvider } from 'pages/CopyTrading/modals/context'
import { getCopyTradingPath, resolveCopyTradingRoute } from 'pages/CopyTrading/routing'

const CopyTrading = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { account } = useActiveWeb3React()

  const {
    data: chains,
    refetch: refetchChains,
    isFetching: chainsLoading,
  } = discoveryApi.useGetChainsQuery(undefined, {
    refetchOnMountOrArgChange: false,
  })

  const ownerAddress = account?.toLowerCase() as Address | undefined
  const chainOptions = chains?.data || []

  useEffect(() => {
    if (!location.state?.scrollToCopyTrading) return

    window.scrollTo({ top: 80, behavior: 'smooth' })
    navigate(location, { replace: true, state: null })
  }, [location, navigate])

  const { chain, redirect } = resolveCopyTradingRoute(location.pathname, chainOptions)
  if (!chains && chainsLoading)
    return (
      <CopyTradingPage>
        <LocalLoader />
      </CopyTradingPage>
    )
  if (redirect)
    return (
      <Navigate
        to={{ pathname: redirect, search: location.search, hash: location.hash }}
        replace
        state={location.state}
      />
    )
  if (!chain)
    return (
      <CopyTradingPage>
        <CopyTradingReadError resourceUnavailable={!!chains} onRetry={refetchChains} />
      </CopyTradingPage>
    )

  return (
    <CopyTradingProvider
      key={chain.chainId}
      selectedChainId={chain.chainId}
      chains={chainOptions}
      ownerAddress={ownerAddress}
    >
      <CopyTradingModalProvider>
        <div className="flex min-h-screen w-full bg-black text-text max-lg:block">
          <Sidebar />
          <Routes>
            <Route path=":chain">
              <Route index element={<AgentList />} />
              <Route path="my-copies" element={<MyCopiesView />} />
              <Route path="my-copies/:copyId" element={<CopyDetailView backPath="my-copies" />} />
              <Route path="history" element={<CopyHistoryView />} />
              <Route path="history/:copyId" element={<CopyDetailView backPath="history" />} />
              <Route path=":agentCode" element={<AgentProfile />} />
              <Route path="*" element={<Navigate to={getCopyTradingPath(chain.slug)} replace />} />
            </Route>
          </Routes>
        </div>
      </CopyTradingModalProvider>
    </CopyTradingProvider>
  )
}

export default CopyTrading
