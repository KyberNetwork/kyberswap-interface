import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import Banner from 'components/Banner'
import SwapForm, { SwapFormProps } from 'components/SwapForm'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialKeys } from 'components/Tutorial/TutorialSwap'
import GasPriceTrackerPanel from 'components/swapv2/GasPriceTrackerPanel'
import LimitOrderForm from 'components/swapv2/LimitOrder/LimitOrderForm'
import ListLimitOrder from 'components/swapv2/LimitOrder/ListOrder'
import Tutorial from 'components/swapv2/LimitOrder/Tutorial'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfoTab from 'components/swapv2/TokenInfo'
import { Container, InfoComponentsWrapper, PageWrapper, SwapFormWrapper, highlight } from 'components/swapv2/styleds'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { BodyWrapper } from 'pages/AppBody'
import CrossChain from 'pages/CrossChain'
import CrossChainLink from 'pages/CrossChain/CrossChainLink'
import CrossChainTransfersHistory from 'pages/CrossChain/TransfersHistory'
import { TAB, isSettingTab } from 'pages/SwapV3'
import Header from 'pages/SwapV3/Header'
import Updater from 'state/customizeDexes/updater'
import { Field } from 'state/swap/actions'
import { useDegenModeManager, usePermitData, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { DetailedRouteSummary } from 'types/route'

export const InfoComponents = ({ children }: { children: ReactNode[] }) => {
  return children.filter(Boolean).length ? <InfoComponentsWrapper>{children}</InfoComponentsWrapper> : null
}

export const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 16px;
  margin-top: 0;

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 2s 2 alternate ease-in-out;
  }
`

export const SwitchLocaleLinkWrapper = styled.div`
  margin-bottom: 30px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  margin-bottom: 0px;
`}
`

export const RoutingIconWrapper = styled(RoutingIcon)`
  height: 27px;
  width: 27px;
  margin-right: 10px;
  path {
    fill: ${({ theme }) => theme.subText} !important;
  }
`

export default function PartnerSwap() {
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [searchParams, setSearchParams] = useSearchParams()

  const chainIdFromParam = searchParams.get('chainId')
  const inputTokenFromParam = searchParams.get('inputCurrency')
  const outputTokenFromParam = searchParams.get('outputCurrency')
  const expectedChainId =
    chainIdFromParam && SUPPORTED_NETWORKS.includes(+chainIdFromParam) ? +chainIdFromParam : ChainId.MAINNET

  // sync form chainId and wallet chainId when disconnected
  useEffect(() => {
    if (!account && walletChainId !== expectedChainId) {
      changeNetwork(expectedChainId)
    }
  }, [account, walletChainId, expectedChainId, changeNetwork])

  const currencyIn =
    useCurrencyV2(inputTokenFromParam || undefined, expectedChainId) || NativeCurrencies[expectedChainId as ChainId]
  const currencyOut =
    useCurrencyV2(outputTokenFromParam || undefined, expectedChainId) ||
    DEFAULT_OUTPUT_TOKEN_BY_CHAIN[expectedChainId as ChainId]

  const currencies = useMemo(
    () => ({
      [Field.INPUT]: currencyIn || undefined,
      [Field.OUTPUT]: currencyOut || undefined,
    }),
    [currencyIn, currencyOut],
  )

  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()

  const activeTab = Object.values(TAB).includes(searchParams.get('tab')) ? (searchParams.get('tab') as TAB) : TAB.SWAP
  const setActiveTab = useCallback(
    (tab: TAB) => {
      searchParams.set('tab', tab)
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  const navigate = useNavigate()
  const clientId = searchParams.get('clientId')
  useEffect(() => {
    if (!clientId) navigate('/')
  }, [clientId, navigate])

  const isSetting = isSettingTab(activeTab)
  const previousTab = usePreviousDistinct(!isSetting ? activeTab : undefined)

  const isSwapPage = activeTab === TAB.SWAP || (previousTab === TAB.SWAP && isSetting)
  const isLimitPage = activeTab === TAB.LIMIT || (previousTab === TAB.LIMIT && isSetting)
  const isCrossChainPage = activeTab === TAB.CROSS_CHAIN || (previousTab === TAB.CROSS_CHAIN && isSetting)

  const onBackToSwapTab = () => setActiveTab(previousTab || TAB.SWAP)

  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
    expectedChainId,
  )

  const [ttl] = useUserTransactionTTL()
  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()
  const permitData = usePermitData(currencyIn?.wrapped.address)

  const onChangeCurrencyIn = useCallback(
    (c: Currency) => {
      const value = c.isNative ? c.symbol || c.wrapped.address : c.wrapped.address
      if (value === outputTokenFromParam) searchParams.set('outputCurrency', inputTokenFromParam || '')
      searchParams.set('inputCurrency', value)
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams, inputTokenFromParam, outputTokenFromParam],
  )

  const onChangeCurrencyOut = useCallback(
    (c: Currency) => {
      const value = c.isNative ? c.symbol || c.wrapped.address : c.wrapped.address
      if (value.toLowerCase() === inputTokenFromParam?.toLowerCase()) {
        searchParams.set('inputCurrency', outputTokenFromParam || '')
      }
      searchParams.set('outputCurrency', value)
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams, inputTokenFromParam, outputTokenFromParam],
  )

  const props: SwapFormProps = {
    hidden: activeTab !== TAB.SWAP,
    routeSummary,
    setRouteSummary,
    currencyIn: currencyIn || undefined,
    currencyOut: currencyOut || undefined,
    balanceIn,
    balanceOut,
    isDegenMode,
    slippage,
    transactionTimeout: ttl,
    permit: permitData?.rawSignature,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    customChainId: expectedChainId,
    omniView: true,
  }

  const [showTutorial, setShowTutorial] = useState(!localStorage.getItem(TutorialKeys.SHOWED_LO_GUIDE))

  // modal and loading
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  const currencyName = currencyOut?.wrapped.name
  const currencySymbol = currencyOut?.wrapped.symbol
  return (
    <>
      <PageWrapper>
        <Banner />
        <Container>
          <SwapFormWrapper isShowTutorial={false}>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} customChainId={expectedChainId} />

            <AppBodyWrapped style={[TAB.INFO, TAB.LIMIT].includes(activeTab) ? { padding: 0 } : undefined}>
              {isSwapPage && <SwapForm {...props} />}
              {activeTab === TAB.INFO && <TokenInfoTab currencies={currencies} onBack={onBackToSwapTab} />}
              {activeTab === TAB.SETTINGS && (
                <SettingsPanel
                  isCrossChainPage={isCrossChainPage}
                  isSwapPage={isSwapPage}
                  onBack={onBackToSwapTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickGasPriceTracker={() => setActiveTab(TAB.GAS_PRICE_TRACKER)}
                />
              )}
              {activeTab === TAB.GAS_PRICE_TRACKER && (
                <GasPriceTrackerPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} chainId={expectedChainId} />
              )}
              {activeTab === TAB.LIMIT &&
                (showTutorial ? (
                  <Tutorial
                    onClose={() => {
                      setShowTutorial(false)
                      localStorage.setItem(TutorialKeys.SHOWED_LO_GUIDE, '1')
                    }}
                  />
                ) : (
                  <div style={{ padding: '16px' }}>
                    <LimitOrderForm
                      flowState={flowState}
                      setFlowState={setFlowState}
                      currencyIn={currencyIn}
                      currencyOut={currencyOut}
                      note={
                        currencyOut?.isNative
                          ? t`Note: Once your order is filled, you will receive ${currencyName} (${currencySymbol})`
                          : undefined
                      }
                      useUrlParams
                    />
                  </div>
                ))}
              {isCrossChainPage && <CrossChain visible={activeTab === TAB.CROSS_CHAIN} />}
            </AppBodyWrapped>
            {isCrossChainPage && <CrossChainLink isBridge />}
          </SwapFormWrapper>

          <InfoComponents>
            {isLimitPage && <ListLimitOrder customChainId={expectedChainId} />}
            {isCrossChainPage && <CrossChainTransfersHistory />}
          </InfoComponents>
        </Container>
        <Flex justifyContent="center">
          <SwitchLocaleLinkWrapper>
            <SwitchLocaleLink />
          </SwitchLocaleLinkWrapper>
        </Flex>
      </PageWrapper>

      <Updater customChainId={expectedChainId} />
    </>
  )
}
