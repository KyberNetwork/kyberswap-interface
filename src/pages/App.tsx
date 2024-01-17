import * as Sentry from '@sentry/react'
import { Suspense, lazy, useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useNetwork, usePrevious } from 'react-use'
import styled from 'styled-components'

import snow from 'assets/images/snow.png'
import Popups from 'components/Announcement/Popups'
import TopBanner from 'components/Announcement/Popups/TopBanner'
import AppHaveUpdate from 'components/AppHaveUpdate'
import ErrorBoundary from 'components/ErrorBoundary'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header'
import Loader from 'components/LocalLoader'
import ModalsGlobal from 'components/ModalsGlobal'
import ProtectedRoute from 'components/ProtectedRoute'
import Snowfall from 'components/Snowflake/Snowfall'
import Web3ReactManager from 'components/Web3ReactManager'
import { APP_PATHS, CHAINS_SUPPORT_CROSS_CHAIN } from 'constants/index'
import { CLASSIC_NOT_SUPPORTED, ELASTIC_NOT_SUPPORTED, NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAutoLogin } from 'hooks/useLogin'
import { useGlobalMixpanelEvents } from 'hooks/useMixpanel'
import useSessionExpiredGlobal from 'hooks/useSessionExpire'
import { useSyncNetworkParamWithStore } from 'hooks/web3/useSyncNetworkParamWithStore'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { RedirectPathToSwapV3Network } from 'pages/SwapV3/redirects'
import { useHolidayMode } from 'state/user/hooks'
import { isSupportLimitOrder } from 'utils'

import VerifyAuth from './Verify/VerifyAuth'

const Login = lazy(() => import('./Oauth/Login'))
const Logout = lazy(() => import('./Oauth/Logout'))
const Consent = lazy(() => import('./Oauth/Consent'))

const ElasticSnapshot = lazy(() => import('./ElasticSnapshot'))

// test page for swap only through elastic
const ElasticSwap = lazy(() => import('./ElasticSwap'))
const SwapV3 = lazy(() => import('./SwapV3'))
const PartnerSwap = lazy(() => import('./PartnerSwap'))
// const Bridge = lazy(() => import('./Bridge'))
const Pools = lazy(() => import('./Pools'))
const MyPool = lazy(() => import('./MyPool'))

const Farm = lazy(() => import('./Farm'))

const PoolFinder = lazy(() => import('./PoolFinder'))
const ElasticRemoveLiquidity = lazy(() => import('pages/RemoveLiquidityProAmm'))
const RedirectCreatePool = lazy(() => import('pages/CreatePool/RedirectCreatePool'))

// const RedirectElasticCreatePool = lazy(() => import('pages/AddLiquidityV2/RedirectElasticCreatePool'))

const AddLiquidity = lazy(() => import('pages/AddLiquidity'))
// const ElasticIncreaseLiquidity = lazy(() => import('pages/IncreaseLiquidity'))

const RemoveLiquidity = lazy(() => import('pages/RemoveLiquidity'))

const KyberDAOStakeKNC = lazy(() => import('pages/KyberDAO/StakeKNC'))
const KyberDAOVote = lazy(() => import('pages/KyberDAO/Vote'))
const KNCUtility = lazy(() => import('pages/KyberDAO/KNCUtility'))
const AboutKyberSwap = lazy(() => import('pages//About/AboutKyberSwap'))
const AboutKNC = lazy(() => import('pages/About/AboutKNC'))
const BuyCrypto = lazy(() => import('pages/BuyCrypto'))

const NotificationCenter = lazy(() => import('pages/NotificationCenter'))

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
  z-index: 1;
`

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
            path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA?/:currencyIdB?`}
            element={<RedirectCreatePool />}
          />
          <Route
            path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/:currencyIdB?/:pairAddress?`}
            element={<AddLiquidity />}
          />
          <Route
            path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/:currencyIdA/:currencyIdB/:pairAddress`}
            element={<RemoveLiquidity />}
          />
        </>
      )}

      {!ELASTIC_NOT_SUPPORTED()[chainId] && (
        <>
          {/*
          <Route
            path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA?/:currencyIdB?/:feeAmount?`}
            element={<RedirectElasticCreatePool />}
          />
          <Route
            path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?`}
            element={<ElasticIncreaseLiquidity />}
          />
          */}
          <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/:tokenId`} element={<ElasticRemoveLiquidity />} />
        </>
      )}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  const { account, chainId, networkInfo } = useActiveWeb3React()
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

  useEffect(() => {
    if (account) {
      Sentry.setUser({ id: account })
    }
  }, [account])

  useEffect(() => {
    if (chainId) {
      Sentry.setTags({
        chainId: chainId,
        network: networkInfo.name,
      })
    }
  }, [chainId, networkInfo.name])

  useGlobalMixpanelEvents()
  const isPartnerSwap = pathname.includes(APP_PATHS.PARTNER_SWAP)
  const showFooter = !pathname.includes(APP_PATHS.ABOUT) && !isPartnerSwap
  const [holidayMode] = useHolidayMode()

  const snowflake = new Image()
  snowflake.src = snow

  const { library } = useWeb3React()
  const handle = () => {
    library?.send('eth_signTypedData_v4', [
      account,
      JSON.stringify({
        types: {
          EIP712Domain: [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'version',
              type: 'string',
            },
            {
              name: 'chainId',
              type: 'uint256',
            },
            {
              name: 'verifyingContract',
              type: 'address',
            },
          ],
          Agreement: [
            {
              name: 'leafIndex',
              type: 'uint256',
            },
            {
              name: 'termsAndConditions',
              type: 'string',
            },
          ],
        },
        primaryType: 'Agreement',
        domain: {
          name: 'Kyberswap Instant Grant',
          version: '1',
          chainId: 5,
          verifyingContract: '0x457157C01649332C7B2A6Cbc820f139E853DF7E9',
        },
        message: {
          leafIndex: 1,
          termsAndConditions: `PLEASE READ THESE TERMS OF USE CAREFULLY. YOUR ACCEPTANCE MAY
LIMIT OR WAIVE CERTAIN OF YOUR RIGHTS. IT IS YOUR RESPONSIBILITY TO
RE-REVIEW THE TERMS OF USE IF YOU HAVE NOT REVIEWED THEM SINCE
THE “LAST UPDATED” DATE ABOVE.
THIS AGREEMENT PROVIDES FOR MANDATORY INDIVIDUAL ARBITRATION IN
THE BRITISH VIRGIN ISLANDS. BY ACCEPTING THESE TERMS OF USE, YOU
HEREBY IRREVOCABLY WAIVE ALL RIGHTS TO TRIAL BY JURY OR TO
PROCEED IN A COLLECTIVE ACTION IN RELATION TO YOUR USE OF THE SITES.
YOU ARE AGREEING NOT TO USE THE SITES FOR PROHIBITED USES (AS
DEFINED BELOW), OR FROM EXCLUDED JURISDICTIONS (AS DEFINED BELOW).
YOU MAY NOT USE THE SITES UNLESS YOU AGREE TO THESE TERMS OF USE.
1. ACCEPTANCE OF TERMS
1.1 In these terms of use (these “Terms”), (i) “we”, “our”, “us,” or the “Company” refers to
DMM Technology Inc., an entity formed under the laws of the British Virgin Islands or, as
and where applicable, KyberDAO Foundation, a Cayman Islands foundation company (the
“Company” and, with its Affiliates as further defined below, each a “KyberSwap Party”
and collectively the “KyberSwap Parties”); and (ii) “You” refers to any person accessing,
or using any Services (as defined in Paragraph 2.1 of these Terms) as accessible through,
our website https://kyberswap.com (the “Site”), mobile applications or any other
applications (collectively referred to as, “Sites”), and “your” shall be construed
accordingly.
1.2 By connecting a Wallet to the Sites or otherwise utilizing any of the Services as provided
and offered by any KyberSwap Party:
(a) You agree to be bound by and to abide by these Terms and any privacy policy
contained in the Sites, as may be updated from time to time by the Company. In the
event of any change, amendment or update to these Terms or any such privacy
policy by the Company, you agree to be bound by these Terms and any such privacy
policies, as may be amended, if you continue thereafter utilizing any of the Sites or
the Services after notice that there has been a change, amendment or update, which
may take the form of alerting you to the “last updated” date so that you can
determine whether there has been an update since your last review, or any other
form of notice the Company elects to provide in its sole discretion. If you do not
agree to these Terms, please exit the Sites and immediately cease usage of the
Sites and the Services.
(b) You represent and warrant that (i) in the jurisdiction to which you are subject, you
are of legal age to use the Sites or the Services and to create a binding legal and
2
financial obligation for any liability or obligation you may incur as a result of your
use of the Sites or the Services; and (ii) you are not a Disqualified Person/Entity (as
defined in Paragraph 2.1 of these Terms) or acting on behalf of a Disqualified
Person/Entity.
1.3 No information contained in or on, and no part of:
(a) the Sites;
(b) any electronic sites, communication or applications directly or indirectly linked to
the Sites; or
(c) any other information or document,
shall constitute part of these Terms (unless otherwise stated on the Sites or in these Terms),
and no representations, warranties or undertakings are or are intended or purported to be
given by any KyberSwap Party in respect of any information contained in or on, or through
any part of, the items as stated in Paragraphs 1.3(a) to (c) above.
2. DEFINITIONS AND INTERPRETATIONS
2.1 Definitions
In these Terms, unless the context otherwise requires:
“Address” means an address on the applicable digital ledger or blockchain network;
“Affiliate” means with respect to any person or entity, any other person or entity directly
or indirectly controlling, controlled by or under common control with such person; and as
used in this definition, “control” means the power to direct or cause the direction of the
management or policies of a person or entity, whether through the exercise of voting power
or by contract and “controlling” and “controlled by” shall have correlative meanings;
“Applicable Laws” means all relevant or applicable statutes, laws (including any reporting
or withholding tax requirements of any government), rules, regulations, directives,
circulars, notices, guidelines and practice notes of any Governmental Authority;
“Approvals” has the meaning ascribed thereto in Paragraph 6.1(m) of these Terms;
“Community Proposals” means any proposal put forward by KNC Tokenholders pursuant
to a DAO Smart Contract Protocol;
“Company” has the meaning ascribed thereto in Paragraph 1.1 of these Terms;
“DAO Services” has the meaning ascribed thereto in Paragraph 4.2.3 of these Terms;
“DAO Smart Contract” means the open source computer protocol relating to Staking,
Voting and Delegated Voting in connection with the decentralized autonomous
organization referred to as “KyberDAO”, as further described at
3
https://docs.kyberswap.com/kyber-dao/kyber-dao-introduction (including all related
trademarks and other intellectual property, whether such use is via the Sites or otherwise);
“DAO Smart Contract Protocols” means the decentralized autonomous governance
protocols, functions and implementations programmed into the DAO Smart Contract
relating to Staking, Voting, Delegated Voting and the other functions of the DAO Smart
Contract, which such functions, protocols and implementations may be modified from time
to time;
“Delegated Voting” means the delegation by a KNC Tokenholder of Voting Power to a
KNC Pool Operator in accordance with and subject to DAO Smart Contract Protocols
whereby:
(a) such KNC Pool Operator will be accorded such Voting Power which will be
exercisable by such KNC Pool Operator for Voting on Community Proposals in the
same manner and to the same extent as such KNC Tokenholder would have been
able had there been no delegation; and
(b) subject to such KNC Pool Operator’s Voting on a Community Proposal in
furtherance of an exercise of such Voting Power, Voting Rewards attributable to
such Voting will be allocated to such KNC Pool Operator, and such KNC Pool
Operator can elect to retain such Voting Rewards or distribute all or part of such
Voting Rewards to such KNC Tokenholder at such KNC Pool Operator’s
discretion;
“Disqualified Person/Entity” means (a) any person seeking to access the Sites or use the
Services from within the Excluded Jurisdictions; (b) any person (being a natural person)
who is citizen of, domiciled in, or resident of, a country whose laws prohibit or conflict
with the access of the Sites or use of Services; (c) any entity that is incorporated in,
domiciled in, or organized in, a country whose laws prohibit or conflict with the access of
the Sites or use of Services; (d) any person designated that are subject to sanctions
implemented by the United Nations, the European Union, the United Kingdom or the
Office of Foreign Asset Control of the United States Treasury Department;
“Excluded Jurisdiction” means the countries that are designated as high risk by the
Financial Action Task Force, that are subject to embargoes or sanctions implemented by
the United Nations, the European Union, the United Kingdom or the Office of Foreign
Asset Control of the United States Treasury Department, or are included on a list of
jurisdictions not permitted to use the Services as determined
by the Company, available at https://docs.kyberswap.com/gettingstarted/quickstart/faq#which-countries-are- kyberswap-available-in;
“Fork” means a change in the existing source code or the creation of new or additional
source code for a blockchain;
“Governmental Authority” means any nation or government, any state or other political
subdivision thereof, any entity exercising legislative, executive, judicial or administrative
functions of or pertaining to government, including any government authority, agency,
4
department, board, commission or instrumentality, and any court, tribunal or arbitrator(s)
of competent jurisdiction, and any self-regulatory organization. For the avoidance of doubt,
Governmental Authority may include private bodies exercising quasi-governmental,
regulatory or judicial-like functions such as securities exchanges or similar self-regulating
authorities to the extent they relate to either you, any KyberSwap Party, the KyberSwap
Smart Contracts, the DAO Smart Contract, the DAO Smart Contract Protocols, the Tokens
or the Services;`,
        },
      }),
    ])
  }

  return (
    <ErrorBoundary>
      {window.location.href.includes('local') && <button onClick={handle}>ok</button>}
      <AppHaveUpdate />
      <AppWrapper>
        <ModalsGlobal />
        {!isPartnerSwap && <TopBanner />}
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
                {/* From react-router-dom@6.5.0, :fromCurrency-to-:toCurrency no long works, need to manually parse the params */}
                <Route path={`${APP_PATHS.SWAP}/:network/:currency?`} element={<SwapPage />} />
                <Route path={`${APP_PATHS.PARTNER_SWAP}`} element={<PartnerSwap />} />
                {CHAINS_SUPPORT_CROSS_CHAIN.includes(chainId) && (
                  <Route path={`${APP_PATHS.CROSS_CHAIN}`} element={<SwapV3 />} />
                )}

                {isSupportLimitOrder(chainId) && (
                  <Route path={`${APP_PATHS.LIMIT}/:network/:currency?`} element={<SwapPage />} />
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
                  <Route path={`${APP_PATHS.MY_POOLS}/:network`} element={<MyPool />} />
                </>

                <>
                  {/* These are old routes and will soon be deprecated - Check: RoutesWithNetworkParam */}
                  {/*
                  <Route path={`${APP_PATHS.ELASTIC_CREATE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
                  <Route path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/*`} element={<RedirectWithNetworkPrefix />} />
                  */}

                  <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />

                  <Route path={`${APP_PATHS.CLASSIC_CREATE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
                  <Route path={`${APP_PATHS.CLASSIC_ADD_LIQ}/*`} element={<RedirectWithNetworkPrefix />} />
                  <Route path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
                </>

                <Route path={`${APP_PATHS.KYBERDAO_STAKE}`} element={<KyberDAOStakeKNC />} />
                <Route path={`${APP_PATHS.KYBERDAO_VOTE}`} element={<KyberDAOVote />} />
                <Route path={`${APP_PATHS.KYBERDAO_KNC_UTILITY}`} element={<KNCUtility />} />
                <Route path={`${APP_PATHS.ABOUT}/kyberswap`} element={<AboutKyberSwap />} />
                <Route path={`${APP_PATHS.ABOUT}/knc`} element={<AboutKNC />} />
                <Route path={`${APP_PATHS.BUY_CRYPTO}`} element={<BuyCrypto />} />
                {/* <Route path={`${APP_PATHS.BRIDGE}`} element={<Bridge />} /> */}
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

                <Route path={`elastic-swap`} element={<ElasticSwap />} />

                <Route path={`/:network/*`} element={<RoutesWithNetworkPrefix />} />

                <Route path={APP_PATHS.VERIFY_AUTH} element={<VerifyAuth />} />
                <Route path={APP_PATHS.IAM_LOGIN} element={<Login />} />
                <Route path={APP_PATHS.IAM_LOGOUT} element={<Logout />} />
                <Route path={APP_PATHS.IAM_CONSENT} element={<Consent />} />

                <Route path={APP_PATHS.ELASTIC_SNAPSHOT} element={<ElasticSnapshot />} />

                <Route path="*" element={<RedirectPathToSwapV3Network />} />
              </Routes>
            </Web3ReactManager>
          </BodyWrapper>
          {showFooter && <Footer />}
          {!showFooter && <div style={{ marginBottom: '4rem' }} />}
        </Suspense>
      </AppWrapper>
    </ErrorBoundary>
  )
}
