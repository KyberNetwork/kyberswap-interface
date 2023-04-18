import { datadogRum } from '@datadog/browser-rum'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import { Suspense, lazy, useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { AlertTriangle } from 'react-feather'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useNetwork, usePrevious } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import snow from 'assets/images/snow.png'
import Popups from 'components/Announcement/Popups'
import TopBanner from 'components/Announcement/Popups/TopBanner'
import AppHaveUpdate from 'components/AppHaveUpdate'
import ErrorBoundary from 'components/ErrorBoundary'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header'
import Loader from 'components/LocalLoader'
import Modal from 'components/Modal'
import Snowfall from 'components/Snowflake/Snowfall'
import Web3ReactManager from 'components/Web3ReactManager'
import { APP_PATHS, BLACKLIST_WALLETS } from 'constants/index'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useGlobalMixpanelEvents } from 'hooks/useMixpanel'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useTheme from 'hooks/useTheme'
import Verify from 'pages/Verify'
import { useHolidayMode } from 'state/user/hooks'
import DarkModeQueryParamReader from 'theme/DarkModeQueryParamReader'
import { getLimitOrderContract, isAddressString, shortenAddress } from 'utils'

import { RedirectPathToSwapV3Network } from './SwapV3/redirects'

// Route-based code splitting

const SwapV2 = lazy(() => import(/* webpackChunkName: 'swapv2-page' */ './SwapV2'))
const SwapV3 = lazy(() => import(/* webpackChunkName: 'swapv3-page' */ './SwapV3'))
const Bridge = lazy(() => import(/* webpackChunkName: 'bridge-page' */ './Bridge'))
const Pools = lazy(() => import(/* webpackChunkName: 'pools-page' */ './Pools'))
const MyPools = lazy(() => import(/* webpackChunkName: 'my-pool-page' */ './Pool'))

const Farm = lazy(() => import(/* webpackChunkName: 'yield-page' */ './Farm'))

const PoolFinder = lazy(() => import(/* webpackChunkName: 'pool-finder-page' */ './PoolFinder'))
const ElasticRemoveLiquidity = lazy(
  () => import(/* webpackChunkName: 'elastic-remove-liquidity-page' */ 'pages/RemoveLiquidityProAmm'),
)
const RedirectCreatePool = lazy(
  () => import(/* webpackChunkName: 'redirect-create-pool-page' */ './CreatePool/RedirectCreatePool'),
)

const RedirectElasticCreatePool = lazy(
  () => import(/* webpackChunkName: 'elastic-create-pool-page' */ 'pages/AddLiquidityV2/RedirectElasticCreatePool'),
)

const AddLiquidity = lazy(() => import(/* webpackChunkName: 'add-liquidity-page' */ 'pages/AddLiquidity'))
const ElasticIncreaseLiquidity = lazy(
  () => import(/* webpackChunkName: 'elastic-increase-liquidity-page' */ 'pages/IncreaseLiquidity'),
)

const RemoveLiquidity = lazy(() => import(/* webpackChunkName: 'remove-liquidity-page' */ 'pages/RemoveLiquidity'))

const KyberDAOStakeKNC = lazy(() => import(/* webpackChunkName: 'stake-knc' */ './KyberDAO/StakeKNC'))
const KyberDAOVote = lazy(() => import(/* webpackChunkName: 'vote' */ './KyberDAO/Vote'))
const AboutKyberSwap = lazy(() => import(/* webpackChunkName: 'about-page' */ './About/AboutKyberSwap'))
const AboutKNC = lazy(() => import(/* webpackChunkName: 'about-knc' */ './About/AboutKNC'))

const CreateReferral = lazy(() => import(/* webpackChunkName: 'create-referral-page' */ './CreateReferral'))

const TrueSight = lazy(() => import(/* webpackChunkName: 'true-sight-page' */ './TrueSight'))

const BuyCrypto = lazy(() => import(/* webpackChunkName: 'true-sight-page' */ './BuyCrypto'))

const Campaign = lazy(() => import(/* webpackChunkName: 'campaigns-page' */ './Campaign'))
const GrantProgramPage = lazy(() => import(/* webpackChunkName: 'grant-program-page' */ './GrantProgram'))
const NotificationCenter = lazy(() => import(/* webpackChunkName: 'notification-center-page' */ './NotificationCenter'))

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  z-index: 3;
`

const BodyWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  align-items: center;
  min-height: calc(100vh - 148px);
  flex: 1;

  ${isMobile && `overflow-x: hidden;`}
`

const SwapPage = () => {
  const { chainId } = useActiveWeb3React()
  useSyncNetworkParamWithStore()

  return <>{chainId === ChainId.SOLANA ? <SwapV2 /> : <SwapV3 />}</>
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
  const { networkInfo } = useActiveWeb3React()
  const location = useLocation()

  useSyncNetworkParamWithStore()

  if (!network) {
    return <Navigate to={`/${networkInfo.route}${location.pathname}`} replace />
  }

  const chainInfoFromParam = Object.values(NETWORKS_INFO_CONFIG).find(info => info.route === network)
  if (!chainInfoFromParam) {
    return <Navigate to={location.pathname.replace(network, networkInfo.route)} replace />
  }

  return (
    <Routes>
      <Route path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA?/:currencyIdB?`} element={<RedirectCreatePool />} />
      <Route
        path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/:currencyIdB?/:pairAddress?`}
        element={<AddLiquidity />}
      />
      <Route
        path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/:currencyIdA/:currencyIdB/:pairAddress`}
        element={<RemoveLiquidity />}
      />

      <Route
        path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA?/:currencyIdB?/:feeAmount?`}
        element={<RedirectElasticCreatePool />}
      />
      <Route
        path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?`}
        element={<ElasticIncreaseLiquidity />}
      />
      <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/:tokenId`} element={<ElasticRemoveLiquidity />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  const { account, chainId, networkInfo } = useActiveWeb3React()

  const { online } = useNetwork()
  const prevOnline = usePrevious(online)

  useEffect(() => {
    if (prevOnline === false && online && account) {
      // refresh page when network back to normal to prevent some issues: ex: stale data, ...
      window.location.reload()
    }
  }, [online, prevOnline, account])

  useEffect(() => {
    if (account) {
      Sentry.setUser({ id: account })
      datadogRum.setUser({ id: account })
    }
  }, [account])

  useEffect(() => {
    if (chainId) {
      Sentry.setTags({
        chainId: chainId,
        network: networkInfo.name,
      })
      datadogRum.setGlobalContext({
        chainId,
        networkName: networkInfo.name,
      })
    }
  }, [chainId, networkInfo.name])

  const theme = useTheme()

  useGlobalMixpanelEvents()
  const { pathname } = window.location
  const showFooter = !pathname.includes(APP_PATHS.ABOUT)
  const [holidayMode] = useHolidayMode()

  const snowflake = new Image()
  snowflake.src = snow

  return (
    <ErrorBoundary>
      <AppHaveUpdate />
      {(BLACKLIST_WALLETS.includes(isAddressString(chainId, account)) ||
        BLACKLIST_WALLETS.includes(account?.toLowerCase() || '')) && (
        <Modal
          isOpen
          onDismiss={function (): void {
            //
          }}
          maxWidth="600px"
          width="80vw"
        >
          <Flex flexDirection="column" padding="24px" width="100%">
            <Flex alignItems="center">
              <AlertTriangle color={theme.red} />
              <Text fontWeight="500" fontSize={24} color={theme.red} marginLeft="8px">
                <Trans>Warning</Trans>
              </Text>
            </Flex>
            <Text marginTop="24px" fontSize="14px" lineHeight={2}>
              The US Treasury&apos;s OFAC has published a list of addresses associated with Tornado Cash. Your wallet
              address below is flagged as one of the addresses on this list, provided by our compliance vendor. As a
              result, it is blocked from using KyberSwap and all of its related services at this juncture.
            </Text>
            <Flex
              marginTop="24px"
              padding="12px"
              backgroundColor={theme.buttonBlack}
              sx={{ borderRadius: '12px' }}
              flexDirection="column"
            >
              <Text>Your wallet address</Text>
              <Text color={theme.subText} fontSize={20} marginTop="12px" fontWeight="500">
                {isMobile ? shortenAddress(chainId, account || '', 10) : account}
              </Text>
            </Flex>
          </Flex>
        </Modal>
      )}

      {(!account || !BLACKLIST_WALLETS.includes(account)) && (
        <>
          <AppWrapper>
            <TopBanner />
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <Suspense fallback={<Loader />}>
              {holidayMode && (
                <Snowfall
                  speed={[0.5, 1]}
                  wind={[-0.5, 0.25]}
                  snowflakeCount={isMobile ? 13 : 31}
                  images={[snowflake]}
                  radius={[5, 15]}
                />
              )}

              <BodyWrapper>
                <Popups />
                <Web3ReactManager>
                  <Routes>
                    <Route element={<DarkModeQueryParamReader />} />

                    <Route path={`${APP_PATHS.SWAP}/:network/:fromCurrency-to-:toCurrency`} element={<SwapPage />} />
                    <Route path={`${APP_PATHS.SWAP}/:network/:fromCurrency`} element={<SwapPage />} />
                    <Route path={`${APP_PATHS.SWAP}/:network`} element={<SwapPage />} />

                    {getLimitOrderContract(chainId) && (
                      <>
                        <Route
                          path={`${APP_PATHS.LIMIT}/:network/:fromCurrency-to-:toCurrency`}
                          element={<SwapPage />}
                        />
                        <Route path={`${APP_PATHS.LIMIT}/:network/:fromCurrency`} element={<SwapPage />} />
                        <Route path={`${APP_PATHS.LIMIT}/:network`} element={<SwapPage />} />
                      </>
                    )}

                    <Route path={`${APP_PATHS.FIND_POOL}`} element={<PoolFinder />} />

                    <>
                      {/* Pools Routes  */}
                      <Route path={`${APP_PATHS.POOLS}`} element={<RedirectWithNetworkSuffix />} />
                      <Route path={`${APP_PATHS.POOLS}/:network/:currencyIdA?/:currencyIdB?`} element={<Pools />} />
                    </>

                    <>
                      {/* Farms Routes */}
                      <Route path={`${APP_PATHS.FARMS}`} element={<RedirectWithNetworkSuffix />} />
                      <Route path={`${APP_PATHS.FARMS}/:network`} element={<Farm />} />
                    </>

                    <>
                      {/* My Pools Routes */}
                      <Route path={`${APP_PATHS.MY_POOLS}`} element={<RedirectWithNetworkSuffix />} />
                      <Route path={`${APP_PATHS.MY_POOLS}/:network`} element={<MyPools />} />
                    </>

                    <>
                      {/* These are old routes and will soon be deprecated - Check: RoutesWithNetworkParam */}
                      <Route path={`${APP_PATHS.ELASTIC_CREATE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
                      <Route path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/*`} element={<RedirectWithNetworkPrefix />} />
                      <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />

                      <Route path={`${APP_PATHS.CLASSIC_CREATE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
                      <Route path={`${APP_PATHS.CLASSIC_ADD_LIQ}/*`} element={<RedirectWithNetworkPrefix />} />
                      <Route path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
                    </>

                    <Route path={`${APP_PATHS.KYBERDAO_STAKE}`} element={<KyberDAOStakeKNC />} />
                    <Route path={`${APP_PATHS.KYBERDAO_VOTE}`} element={<KyberDAOVote />} />
                    <Route path={`${APP_PATHS.ABOUT}/kyberswap`} element={<AboutKyberSwap />} />
                    <Route path={`${APP_PATHS.ABOUT}/knc`} element={<AboutKNC />} />
                    <Route path={`${APP_PATHS.REFERRAL}`} element={<CreateReferral />} />
                    <Route path={`${APP_PATHS.DISCOVER}`} element={<TrueSight />} />
                    <Route path={`${APP_PATHS.BUY_CRYPTO}`} element={<BuyCrypto />} />
                    <Route path={`${APP_PATHS.CAMPAIGN}`} element={<Campaign />} />
                    <Route path={`${APP_PATHS.CAMPAIGN}/:slug`} element={<Campaign />} />
                    <Route path={`${APP_PATHS.BRIDGE}`} element={<Bridge />} />
                    <Route path={`${APP_PATHS.VERIFY_EXTERNAL}`} element={<Verify />} />
                    <Route path={`${APP_PATHS.NOTIFICATION_CENTER}`} element={<NotificationCenter />} />
                    <Route path={`${APP_PATHS.NOTIFICATION_CENTER}/*`} element={<NotificationCenter />} />
                    <Route path={`${APP_PATHS.GRANT_PROGRAMS}`} element={<GrantProgramPage />} />
                    <Route path={`${APP_PATHS.GRANT_PROGRAMS}/:slug`} element={<GrantProgramPage />} />

                    <Route path={`/:network/*`} element={<RoutesWithNetworkPrefix />} />

                    <Route path="*" element={<RedirectPathToSwapV3Network />} />
                  </Routes>
                </Web3ReactManager>
              </BodyWrapper>
              {showFooter && <Footer />}
            </Suspense>
          </AppWrapper>
        </>
      )}
    </ErrorBoundary>
  )
}
