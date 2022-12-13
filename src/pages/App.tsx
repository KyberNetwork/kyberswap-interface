import { datadogRum } from '@datadog/browser-rum'
import { Trans, t } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import { Popover, Sidetab } from '@typeform/embed-react'
import { Suspense, useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { AlertTriangle } from 'react-feather'
import { Route, Routes } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import AppHaveUpdate from 'components/AppHaveUpdate'
import ErrorBoundary from 'components/ErrorBoundary'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header'
import TopBanner from 'components/Header/TopBanner'
import Loader from 'components/LocalLoader'
import Modal from 'components/Modal'
import Popups from 'components/Popups'
import Web3ReactManager from 'components/Web3ReactManager'
import { APP_PATHS, BLACKLIST_WALLETS, SUPPORT_LIMIT_ORDER } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useGlobalMixpanelEvents } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useWindowSize } from 'hooks/useWindowSize'
import { useIsDarkMode } from 'state/user/hooks'
import DarkModeQueryParamReader from 'theme/DarkModeQueryParamReader'
import { isAddressString, shortenAddress } from 'utils'

import AboutKNC from './About/AboutKNC'
import AboutKyberSwap from './About/AboutKyberSwap'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds } from './AddLiquidityV2/redirects'
import Bridge from './Bridge'
import BuyCrypto from './BuyCrypto'
import Campaign from './Campaign'
import CreatePool from './CreatePool'
import RedirectCreatePoolDuplicateTokenIds from './CreatePool/RedirectDuplicateTokenIds'
import RedirectOldCreatePoolPathStructure from './CreatePool/RedirectOldCreatePoolPathStructure'
import CreateReferral from './CreateReferral'
import Farm from './Farm'
import { RedirectPathToFarmNetwork } from './Farm/redirect'
import GrantProgram from './GrantProgram'
import IncreaseLiquidity from './IncreaseLiquidity'
import Pool from './Pool'
import { RedirectPathToMyPoolsNetwork } from './Pool/redirect'
import PoolFinder from './PoolFinder'
import Pools from './Pools'
import { RedirectPathToPoolsNetwork } from './Pools/redirect'
import RemoveLiquidity from './RemoveLiquidity'
import ProAmmRemoveLiquidity from './RemoveLiquidityProAmm'
// Route-based code splitting
import Swap from './Swap'
import SwapV2 from './SwapV2'
import { RedirectPathToSwapNetwork } from './SwapV2/redirects'
import TrueSight from './TrueSight'
import Verify from './Verify'

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

export default function App() {
  const { account, chainId, networkInfo } = useActiveWeb3React()

  useEffect(() => {
    if (account) {
      Sentry.setUser({ id: account })
      datadogRum.setUser({ id: account })
    }
  }, [account])

  useEffect(() => {
    if (chainId) {
      Sentry.setContext('network', {
        chainId: chainId,
        name: networkInfo.name,
      })
    }
  }, [chainId, networkInfo.name])

  const theme = useTheme()
  const isDarkTheme = useIsDarkMode()

  const { width } = useWindowSize()
  useGlobalMixpanelEvents()
  const { pathname } = window.location
  const showFooter = !pathname.includes(APP_PATHS.ABOUT)
  const feedbackId = isDarkTheme ? 'W5TeOyyH' : 'K0dtSO0v'

  return (
    <ErrorBoundary>
      <AppHaveUpdate />
      {width && width >= 768 ? (
        <Sidetab
          id={feedbackId}
          buttonText={t`Feedback`}
          buttonColor={theme.primary}
          customIcon={isDarkTheme ? 'https://i.imgur.com/iTOOKnr.png' : 'https://i.imgur.com/aPCpnGg.png'}
        />
      ) : (
        <Popover
          id={feedbackId}
          customIcon={isDarkTheme ? 'https://i.imgur.com/iTOOKnr.png' : 'https://i.imgur.com/aPCpnGg.png'}
        />
      )}
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
              <BodyWrapper>
                <Popups />
                <Web3ReactManager>
                  <Routes>
                    <Route element={<DarkModeQueryParamReader />} />
                    <Route path={APP_PATHS.SWAP_LEGACY} element={<Swap />} />

                    <Route path={`${APP_PATHS.SWAP}/:network/:fromCurrency-to-:toCurrency`} element={<SwapV2 />} />
                    <Route path={`${APP_PATHS.SWAP}/:network/:fromCurrency`} element={<SwapV2 />} />
                    <Route path={`${APP_PATHS.SWAP}/:network`} element={<SwapV2 />} />

                    {SUPPORT_LIMIT_ORDER && (
                      <>
                        <Route path={`${APP_PATHS.LIMIT}/:network/:fromCurrency-to-:toCurrency`} element={<SwapV2 />} />
                        <Route path={`${APP_PATHS.LIMIT}/:network/:fromCurrency`} element={<SwapV2 />} />
                        <Route path={`${APP_PATHS.LIMIT}/:network`} element={<SwapV2 />} />
                      </>
                    )}

                    <Route path={`${APP_PATHS.FIND_POOL}`} element={<PoolFinder />} />
                    <Route path={`${APP_PATHS.POOLS}/:network`} element={<Pools />} />
                    <Route path={`${APP_PATHS.POOLS}/:network/:currencyIdA`} element={<Pools />} />
                    <Route path={`${APP_PATHS.POOLS}`} element={<RedirectPathToPoolsNetwork />} />
                    <Route path={`${APP_PATHS.POOLS}/:network/:currencyIdA/:currencyIdB`} element={<Pools />} />
                    <Route path={`${APP_PATHS.FARMS}/:network`} element={<Farm />} />
                    <Route path={`${APP_PATHS.FARMS}`} element={<RedirectPathToFarmNetwork />} />
                    <Route path={`${APP_PATHS.MY_POOLS}/:network`} element={<Pool />} />
                    <Route path={`${APP_PATHS.MY_POOLS}`} element={<RedirectPathToMyPoolsNetwork />} />

                    <Route path={`${APP_PATHS.CLASSIC_CREATE_POOL}`} element={<CreatePool />} />
                    <Route
                      path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA`}
                      element={<RedirectOldCreatePoolPathStructure />}
                    />
                    <Route
                      path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA/:currencyIdB`}
                      element={<RedirectCreatePoolDuplicateTokenIds />}
                    />

                    <Route path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/`} element={<AddLiquidity />} />
                    <Route path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/:currencyIdB`} element={<AddLiquidity />} />
                    <Route
                      path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/:currencyIdB/:pairAddress`}
                      element={<AddLiquidity />}
                    />

                    <Route
                      path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/:currencyIdA/:currencyIdB/:pairAddress`}
                      element={<RemoveLiquidity />}
                    />
                    <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/:tokenId`} element={<ProAmmRemoveLiquidity />} />

                    <Route path={`${APP_PATHS.ELASTIC_CREATE_POOL}/`} element={<RedirectDuplicateTokenIds />} />
                    <Route
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA`}
                      element={<RedirectDuplicateTokenIds />}
                    />
                    <Route
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA/:currencyIdB`}
                      element={<RedirectDuplicateTokenIds />}
                    />
                    <Route
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA/:currencyIdB/:feeAmount`}
                      element={<RedirectDuplicateTokenIds />}
                    />

                    <Route
                      path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/:currencyIdA/:currencyIdB/:feeAmount/:tokenId`}
                      element={<IncreaseLiquidity />}
                    />
                    <Route path={`${APP_PATHS.ABOUT}/kyberswap`} element={<AboutKyberSwap />} />
                    <Route path={`${APP_PATHS.ABOUT}/knc`} element={<AboutKNC />} />
                    <Route path={`${APP_PATHS.REFERRAL}`} element={<CreateReferral />} />
                    <Route path={`${APP_PATHS.DISCOVER}`} element={<TrueSight />} />
                    <Route path={`${APP_PATHS.BUY_CRYPTO}`} element={<BuyCrypto />} />
                    <Route path={`${APP_PATHS.CAMPAIGN}`} element={<Campaign />} />
                    <Route path={`${APP_PATHS.CAMPAIGN}/:slug`} element={<Campaign />} />
                    <Route path={`${APP_PATHS.BRIDGE}`} element={<Bridge />} />
                    <Route path={`${APP_PATHS.VERIFY}`} element={<Verify />} />
                    <Route path={`${APP_PATHS.VERIFY_EXTERNAL}`} element={<Verify />} />
                    <Route path={`${APP_PATHS.GRANT_PROGRAMS}`} element={<GrantProgram />} />
                    <Route path={`${APP_PATHS.GRANT_PROGRAMS}/:slug`} element={<GrantProgram />} />

                    <Route path="*" element={<RedirectPathToSwapNetwork />} />
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
