import '@kyber/token-selector/styles.css'
import '@kyber/ui/styles.css'
import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useNetwork, usePrevious } from 'react-use'

import snow from 'assets/images/snow.png'
import Popups from 'components/Announcement/Popups'
import TopBanner from 'components/Announcement/Popups/TopBanner'
import AppHaveUpdate from 'components/AppHaveUpdate'
import { ButtonPrimary } from 'components/Button'
import ErrorBoundary from 'components/ErrorBoundary'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header'
import Loader from 'components/LocalLoader'
import Modal from 'components/Modal'
import ModalsGlobal from 'components/ModalsGlobal'
import ProtectedRoute from 'components/ProtectedRoute'
import RouteSeo from 'components/Seo/RouteSeo'
import SingaporeWarningPopup from 'components/SingaporeWarningPopup'
import SupportButton from 'components/SupportButton'
import { APP_PATHS, CHAINS_SUPPORT_CROSS_CHAIN, TERM_FILES_PATH } from 'constants/index'
import { CLASSIC_NOT_SUPPORTED, ELASTIC_NOT_SUPPORTED, NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useAutoLogin } from 'hooks/useLogin'
import useSessionExpiredGlobal from 'hooks/useSessionExpire'
import { useGlobalTrackingEvents } from 'hooks/useTracking'
import { useWebVitals } from 'hooks/useWebVitals'
import { useSyncNetworkParamWithStore } from 'hooks/web3/useSyncNetworkParamWithStore'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { RedirectPathToSwapV3Network } from 'pages/SwapV3/redirects'
import VerifyAuth from 'pages/Verify/VerifyAuth'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateSafeAppAcceptedTermOfUse } from 'state/user/actions'
import { ExternalLink } from 'theme'
import { isInSafeApp, isSupportLimitOrder } from 'utils'

const Login = lazy(() => import('./Oauth/Login'))
const Logout = lazy(() => import('./Oauth/Logout'))
const Consent = lazy(() => import('./Oauth/Consent'))

const ElasticSnapshot = lazy(() => import('./ElasticSnapshot'))
const MarketOverview = lazy(() => import('./MarketOverview'))
const CopyTrading = lazy(() => import('./CopyTrading'))

const SwapV3 = lazy(() => import('./SwapV3'))
const PartnerSwap = lazy(() => import('./PartnerSwap'))
const MyPool = lazy(() => import('./MyPool'))

const PoolFinder = lazy(() => import('./PoolFinder'))
const ElasticRemoveLiquidity = lazy(() => import('pages/RemoveLiquidityProAmm'))

const RemoveLiquidity = lazy(() => import('pages/RemoveLiquidity'))

const KyberDAOStakeKNC = lazy(() => import('pages/KyberDAO/StakeKNC'))
const KyberDAOVote = lazy(() => import('pages/KyberDAO/Vote'))
const KNCUtility = lazy(() => import('pages/KyberDAO/KNCUtility'))
const AboutKyberSwap = lazy(() => import('pages//About/AboutKyberSwap'))
const AboutKNC = lazy(() => import('pages/About/AboutKNC'))

const NotificationCenter = lazy(() => import('pages/NotificationCenter'))

const Campaign = lazy(() => import('pages/Campaign'))
const CampaignMyDashboard = lazy(() => import('pages/Campaign/MyDashboard'))

const Earns = lazy(() => import('pages/Earns/Landing'))
const EarnPoolExplorer = lazy(() => import('pages/Earns/PoolExplorer'))
const EarnUserPositions = lazy(() => import('pages/Earns/UserPositions'))
const EarnPositionDetail = lazy(() => import('pages/Earns/PositionDetail'))
const SmartExit = lazy(() => import('pages/Earns/SmartExitOrders'))
const PoolDetail = lazy(() => import('pages/Earns/PoolDetail'))

const Recap2025Redirect = lazy(() => import('pages/Recap2025Redirect'))

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-start">{children}</div>
)

const HeaderWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="z-[3] flex w-full flex-row flex-nowrap justify-between">{children}</div>
)

const BodyWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative z-[1] flex min-h-[calc(100vh-148px)] w-full flex-1 flex-col items-center">{children}</div>
)

const preloadImages = () => {
  const imageList: string[] = SUPPORTED_NETWORKS.map(chainId => [NETWORKS_INFO[chainId].icon])
    .flat()
    .filter(Boolean) as string[]

  imageList.forEach(image => {
    if (image) {
      new Image().src = image
    }
  })
}

const SwapPage = () => {
  useSyncNetworkParamWithStore()
  return <SwapV3 />
}

const RedirectWithNetworkPrefix = () => {
  const { networkInfo } = useActiveWeb3React()
  const location = useLocation()

  return (
    <Navigate
      to={{
        ...location,
        pathname: `/${networkInfo.route}${location.pathname}`,
      }}
      replace
    />
  )
}

const RedirectWithNetworkSuffix = () => {
  const { networkInfo } = useActiveWeb3React()
  const location = useLocation()

  return (
    <Navigate
      to={{
        ...location,
        pathname: `${location.pathname}/${networkInfo.route}`,
      }}
      replace
    />
  )
}

const RoutesWithNetworkPrefix = () => {
  const { network } = useParams()
  const { networkInfo, chainId } = useActiveWeb3React()
  const location = useLocation()

  useSyncNetworkParamWithStore()

  if (!network) {
    return <Navigate to={`/${networkInfo.route}${location.pathname}`} replace />
  }

  const chainInfoFromParam = SUPPORTED_NETWORKS.find(chain => NETWORKS_INFO[chain].route === network)
  if (!chainInfoFromParam) {
    return <Navigate to={'/'} replace />
  }

  return (
    <Routes>
      {!CLASSIC_NOT_SUPPORTED()[chainId] && (
        <>
          <Route
            path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/:currencyIdA/:currencyIdB/:pairAddress`}
            element={<RemoveLiquidity />}
          />
        </>
      )}

      {!ELASTIC_NOT_SUPPORTED()[chainId] && (
        <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/:tokenId`} element={<ElasticRemoveLiquidity />} />
      )}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  const { account, chainId } = useActiveWeb3React()
  const { pathname } = useLocation()
  useAutoLogin()
  const { online } = useNetwork()
  const prevOnline = usePrevious(online)
  useSessionExpiredGlobal()

  useEffect(() => {
    if (prevOnline === false && online && account) {
      // refresh page when network back to normal to prevent some issues: ex: stale data, ...
      window.location.reload()
    }
  }, [online, prevOnline, account])

  useEffect(() => {
    preloadImages()
  }, [])

  useGlobalTrackingEvents()
  useWebVitals()
  const isPartnerSwap = pathname.includes(APP_PATHS.PARTNER_SWAP)
  const showFooter = !pathname.includes(APP_PATHS.ABOUT) && !isPartnerSwap
  const isFullPage = pathname.includes(APP_PATHS.COPY_TRADING)
  //const [holidayMode] = useHolidayMode()

  const snowflake = new Image()
  snowflake.src = snow

  const safeAppAcceptedTermOfUse = useAppSelector(state => state.user.safeAppAcceptedTermOfUse)
  const dispatch = useAppDispatch()

  return (
    <ErrorBoundary>
      <AppHaveUpdate />
      <RouteSeo />
      <AppWrapper>
        <ModalsGlobal />
        {!isPartnerSwap && <TopBanner />}
        <HeaderWrapper>
          <SupportButton />
          <Header />
        </HeaderWrapper>
        <Suspense fallback={<Loader />}>
          {/*
            holidayMode && (
            <Snowfall
              speed={[0.5, 1]}
              wind={[-0.5, 0.25]}
              snowflakeCount={isMobile ? 13 : 31}
              images={[snowflake]}
              radius={[5, 15]}
            />
          )
          */}

          <Popups />
          <BodyWrapper>
            <SingaporeWarningPopup />
            {isInSafeApp && !safeAppAcceptedTermOfUse && (
              <Modal isOpen>
                <div className="flex w-full flex-col items-center gap-6 px-6 py-8">
                  <span className="text-center text-base leading-6">
                    By clicking Continue, you accept the{' '}
                    <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
                      KyberSwap&lsquo;s Terms of Use
                    </ExternalLink>{' '}
                    and{' '}
                    <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
                      Privacy Policy
                    </ExternalLink>
                  </span>
                  <ButtonPrimary
                    onClick={() => {
                      dispatch(updateSafeAppAcceptedTermOfUse(true))
                    }}
                  >
                    Continue
                  </ButtonPrimary>
                </div>
              </Modal>
            )}
            <Routes>
              {/* From react-router-dom@6.5.0, :fromCurrency-to-:toCurrency no long works, need to manually parse the params */}
              <Route path={`${APP_PATHS.SWAP}/:network/:currency?`} element={<SwapPage />} />
              <Route path={`${APP_PATHS.PARTNER_SWAP}`} element={<PartnerSwap />} />
              {CHAINS_SUPPORT_CROSS_CHAIN.includes(chainId) && !isInSafeApp && (
                <Route path={`${APP_PATHS.CROSS_CHAIN}`} element={<SwapV3 />} />
              )}

              {isSupportLimitOrder(chainId) && (
                <Route path={`${APP_PATHS.LIMIT}/:network/:currency?`} element={<SwapPage />} />
              )}

              <Route path={`${APP_PATHS.FIND_POOL}`} element={<PoolFinder />} />
              <>
                {/* My Pools Routes */}
                <Route path={`${APP_PATHS.MY_POOLS}`} element={<RedirectWithNetworkSuffix />} />
                <Route path={`${APP_PATHS.MY_POOLS}/:network`} element={<MyPool />} />
              </>

              <>
                {/* These are old routes and will soon be deprecated - Check: RoutesWithNetworkParam */}
                {/*
                  <Route path={`${APP_PATHS.ELASTIC_CREATE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
                  <Route path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/*`} element={<RedirectWithNetworkPrefix />} />
                  */}

                <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />

                <Route path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
              </>

              <Route path={`${APP_PATHS.KYBERDAO_STAKE}`} element={<KyberDAOStakeKNC />} />
              <Route path={`${APP_PATHS.KYBERDAO_VOTE}`} element={<KyberDAOVote />} />
              <Route path={`${APP_PATHS.KYBERDAO_KNC_UTILITY}`} element={<KNCUtility />} />
              <Route path={`${APP_PATHS.ABOUT}/kyberswap`} element={<AboutKyberSwap />} />
              <Route path={`${APP_PATHS.ABOUT}/knc`} element={<AboutKNC />} />
              <Route
                path={`${APP_PATHS.PROFILE_MANAGE}`}
                element={
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path={`${APP_PATHS.PROFILE_MANAGE}/*`}
                element={
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_PATHS.DEPRECATED_NOTI_CENTER}
                element={
                  <ProtectedRoute>
                    <NotificationCenter redirectRoute={PROFILE_MANAGE_ROUTES.PREFERENCE} />
                  </ProtectedRoute>
                }
              />

              <Route path={`/:network/*`} element={<RoutesWithNetworkPrefix />} />

              <Route path={APP_PATHS.VERIFY_AUTH} element={<VerifyAuth />} />
              <Route path={APP_PATHS.IAM_LOGIN} element={<Login />} />
              <Route path={APP_PATHS.IAM_LOGOUT} element={<Logout />} />
              <Route path={APP_PATHS.IAM_CONSENT} element={<Consent />} />

              <Route path={APP_PATHS.ELASTIC_SNAPSHOT} element={<ElasticSnapshot />} />
              <Route path={APP_PATHS.MARKET_OVERVIEW} element={<MarketOverview />} />
              <Route path={`${APP_PATHS.COPY_TRADING}/*`} element={<CopyTrading />} />

              <Route path={APP_PATHS.SAFEPAL_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.RAFFLE_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.NEAR_INTENTS_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.MAY_TRADING_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.AGGREGATOR_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.LIMIT_ORDER_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.REFFERAL_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.MY_DASHBOARD} element={<CampaignMyDashboard />} />

              <Route path={APP_PATHS.EARN} element={<Earns />} />
              <Route path={APP_PATHS.EARN_POOLS} element={<EarnPoolExplorer />} />
              <Route path={APP_PATHS.EARN_POSITIONS} element={<EarnUserPositions />} />
              <Route path={APP_PATHS.EARN_POSITION_DETAIL} element={<EarnPositionDetail />} />
              <Route path={APP_PATHS.EARN_SMART_EXIT} element={<SmartExit />} />
              <Route path={APP_PATHS.ADD_LIQUIDITY} element={<PoolDetail />} />

              <Route path={APP_PATHS.EARNS} element={<Navigate to={APP_PATHS.EARN} replace />} />
              <Route path={APP_PATHS.EARNS_POOLS} element={<Navigate to={APP_PATHS.EARN_POOLS} replace />} />
              <Route path={APP_PATHS.EARNS_POSITIONS} element={<Navigate to={APP_PATHS.EARN_POSITIONS} replace />} />

              <Route path={APP_PATHS.RECAP_2025} element={<Recap2025Redirect />} />

              <Route path="*" element={<RedirectPathToSwapV3Network />} />
            </Routes>
          </BodyWrapper>
          {!isFullPage && (showFooter ? <Footer /> : <div className="mb-16" />)}
        </Suspense>
      </AppWrapper>
    </ErrorBoundary>
  )
}
