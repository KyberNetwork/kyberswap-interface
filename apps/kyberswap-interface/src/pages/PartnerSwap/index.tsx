import { ChainId, Currency, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'
import { useGetTipLinkQuery } from 'services/tipLink'

import Banner from 'components/Banner'
import SwapForm, { SwapFormProps } from 'components/SwapForm'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TIP_LINK_CLIENT_ID } from 'components/TipLinkGeneratorModal/shared'
import LimitOrderForm from 'components/swapv2/LimitOrder/LimitOrderForm'
import ListLimitOrder from 'components/swapv2/LimitOrder/ListLimitOrder'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfoTab from 'components/swapv2/TokenInfo'
import { Container, InfoComponentsWrapper, PageWrapper, SwapFormWrapper } from 'components/swapv2/styleds'
import { MAX_FEE_IN_BIPS, TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies, PRICE_CHART_QUOTE_TOKEN_BY_CHAIN } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useCurrencyV2 } from 'hooks/Tokens'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { BodyWrapper } from 'pages/AppBody'
import CrossChainSwap from 'pages/CrossChainSwap'
import { CrossChainSwapSources } from 'pages/CrossChainSwap/components/CrossChainSwapSources'
import { TransactionHistory } from 'pages/CrossChainSwap/components/TransactionHistory'
import { TAB, isSettingTab } from 'pages/SwapV3'
import SwapTradeRoute from 'pages/SwapV3/Components/SwapTradeRoute'
import TokenPriceChart from 'pages/SwapV3/Components/TokenPriceChart'
import Header from 'pages/SwapV3/Header'
import Updater from 'state/customizeDexes/updater'
import { Field } from 'state/swap/actions'
import { usePermitData } from 'state/swap/hooks'
import { useDegenModeManager, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { ChargeFeeBy, DetailedRouteSummary } from 'types/route'
import { isAddress } from 'utils'
import { getTradeComposition } from 'utils/aggregationRouting'
import { cn } from 'utils/cn'

export const InfoComponents = ({ children }: { children: ReactNode[] }) => {
  return children.filter(Boolean).length ? <InfoComponentsWrapper>{children}</InfoComponentsWrapper> : null
}

export const AppBodyWrapped = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <BodyWrapper
    className={cn('mt-0 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] data-[highlight=true]:animate-highlight', className)}
    {...rest}
  >
    {children}
  </BodyWrapper>
)

export const SwitchLocaleLinkWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-[30px] max-md:mb-0', className)} {...rest}>
    {children}
  </div>
)

const getSupportedChainId = (chainId?: string | null) => {
  const parsed = Number(chainId)
  return SUPPORTED_NETWORKS.includes(parsed) ? parsed : undefined
}

const getTipCurrencyParam = (currency: string | undefined, chainId: number) => {
  if (!currency) return currency
  const native = NativeCurrencies[chainId as ChainId]
  const wrappedNative = WETH[chainId as ChainId]
  return wrappedNative?.address?.toLowerCase() === currency.toLowerCase() ? native.symbol || currency : currency
}

const getFeeAmountFallback = (feeAmount: string | null) => {
  const trimmedFeeAmount = feeAmount?.trim()
  const parsedFeeAmount = Number(trimmedFeeAmount)
  const isFeeAmountNumber =
    !!trimmedFeeAmount && /^\d+$/.test(trimmedFeeAmount) && Number.isSafeInteger(parsedFeeAmount)

  if (!isFeeAmountNumber) return '0'
  if (parsedFeeAmount > MAX_FEE_IN_BIPS) return String(MAX_FEE_IN_BIPS)

  return null
}

type Props = {
  mode?: 'partner' | 'user'
}

export default function PartnerSwap({ mode = 'partner' }: Props) {
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tipsId = '' } = useParams()

  const isUserSwap = mode === 'user'
  const defaultTokens = useAllTokens()

  const { data: tipConfig } = useGetTipLinkQuery(tipsId, { skip: !isUserSwap || !tipsId })
  const appliedTipRef = useRef('')

  const clientId = searchParams.get('clientId')
  const tabFromUrl = searchParams.get('tab')
  const activeTab = Object.values(TAB).includes(tabFromUrl as TAB) ? (tabFromUrl as TAB) : TAB.SWAP

  const chainIdFromUrl = getSupportedChainId(searchParams.get('chainId'))
  const chainIdFromTip = isUserSwap ? getSupportedChainId(tipConfig?.chainId) : undefined
  const swapChainId = chainIdFromUrl || chainIdFromTip || ChainId.MAINNET

  const tipInputCurrency = isUserSwap ? getTipCurrencyParam(tipConfig?.inputCurrency, swapChainId) : undefined
  const tipOutputCurrency = isUserSwap ? getTipCurrencyParam(tipConfig?.outputCurrency, swapChainId) : undefined
  const inputCurrencyId = searchParams.get('inputCurrency') || tipInputCurrency
  const outputCurrencyId = searchParams.get('outputCurrency') || tipOutputCurrency

  const isInvalidFeeConfig = useMemo(() => {
    const feeAmount = searchParams.get('feeAmount')
    const feeReceiver = searchParams.get('feeReceiver')
    const chargeFeeBy = searchParams.get('chargeFeeBy')
    const hasFeeConfig = Boolean(
      searchParams.get('enableTip') || searchParams.get('isInBps') || feeAmount || feeReceiver || chargeFeeBy,
    )
    if (!hasFeeConfig) return false

    const isValidFeeReceiver = Boolean(feeReceiver && isAddress(swapChainId, feeReceiver))
    const isValidChargeFeeBy = chargeFeeBy === ChargeFeeBy.CURRENCY_IN || chargeFeeBy === ChargeFeeBy.CURRENCY_OUT

    return !isValidFeeReceiver || !isValidChargeFeeBy
  }, [searchParams, swapChainId])

  useEffect(() => {
    if (!isUserSwap || !tipsId || !tipConfig || appliedTipRef.current === tipsId) return

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('chainId', String(swapChainId))
    nextSearchParams.set('inputCurrency', tipInputCurrency || '')
    nextSearchParams.set('outputCurrency', tipOutputCurrency || '')
    nextSearchParams.set('enableTip', 'true')
    nextSearchParams.set('feeReceiver', tipConfig.tipReceiver)
    nextSearchParams.set('clientId', TIP_LINK_CLIENT_ID)
    if (tipConfig.creatorName) nextSearchParams.set('creatorName', tipConfig.creatorName)
    if (!nextSearchParams.get('feeAmount')) nextSearchParams.set('feeAmount', '0')
    if (!nextSearchParams.get('chargeFeeBy')) nextSearchParams.set('chargeFeeBy', ChargeFeeBy.CURRENCY_OUT)

    appliedTipRef.current = tipsId
    setSearchParams(nextSearchParams, { replace: true })
  }, [isUserSwap, searchParams, setSearchParams, swapChainId, tipConfig, tipInputCurrency, tipOutputCurrency, tipsId])

  useEffect(() => {
    const feeAmount = searchParams.get('feeAmount')
    const feeReceiver = searchParams.get('feeReceiver')
    const chargeFeeBy = searchParams.get('chargeFeeBy')
    const hasFeeConfig = Boolean(
      searchParams.get('enableTip') || searchParams.get('isInBps') || feeAmount || feeReceiver || chargeFeeBy,
    )
    const fallbackFeeAmount = hasFeeConfig ? getFeeAmountFallback(feeAmount) : null

    if (fallbackFeeAmount !== null) {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.set('feeAmount', fallbackFeeAmount)
      setSearchParams(nextSearchParams, { replace: true })
      return
    }

    if (isInvalidFeeConfig || (!isUserSwap && !clientId)) {
      navigate('/', { replace: true })
    }
  }, [clientId, isInvalidFeeConfig, isUserSwap, navigate, searchParams, setSearchParams])

  // sync form chainId and wallet chainId when disconnected
  useEffect(() => {
    if (!account && walletChainId !== swapChainId) {
      changeNetwork(swapChainId)
    }
  }, [account, walletChainId, swapChainId, changeNetwork])

  const currencyIn =
    useCurrencyV2(inputCurrencyId || undefined, swapChainId) || NativeCurrencies[swapChainId as ChainId]
  const currencyOut =
    useCurrencyV2(outputCurrencyId || undefined, swapChainId) || DEFAULT_OUTPUT_TOKEN_BY_CHAIN[swapChainId as ChainId]

  const currencies = useMemo(
    () => ({
      [Field.INPUT]: currencyIn || undefined,
      [Field.OUTPUT]: currencyOut || undefined,
    }),
    [currencyIn, currencyOut],
  )

  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()

  const [isShowPricingChart, setIsShowPricingChart] = useState(false)
  const [isShowTradeRoutes, setIsShowTradeRoutes] = useState(false)
  const togglePricingChart = useCallback(() => setIsShowPricingChart(prev => !prev), [])
  const toggleTradeRoutes = useCallback(() => setIsShowTradeRoutes(prev => !prev), [])

  const tradeRouteComposition = useMemo(
    () => getTradeComposition(swapChainId, routeSummary?.parsedAmountIn, undefined, routeSummary?.route, defaultTokens),
    [defaultTokens, routeSummary, swapChainId],
  )

  const isSmartSettlementActive = useMemo(
    () => routeSummary?.route?.some(route => route.some(swap => swap.extra?._ce)),
    [routeSummary?.route],
  )
  const hasSupportedTokenPriceChart = Boolean(PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[swapChainId])

  const setActiveTab = useCallback(
    (tab: TAB) => {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.set('tab', tab)
      setSearchParams(nextSearchParams)
    },
    [searchParams, setSearchParams],
  )

  const isSetting = isSettingTab(activeTab)
  const previousTab = usePreviousDistinct(!isSetting ? activeTab : undefined)
  const activeMainTab = isSetting ? previousTab || TAB.SWAP : activeTab

  const isSwapPage = activeMainTab === TAB.SWAP
  const isLimitPage = activeMainTab === TAB.LIMIT
  const isCrossChainPage = activeMainTab === TAB.CROSS_CHAIN

  const onBackToSwapTab = () => setActiveTab(activeMainTab)

  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
    swapChainId,
  )

  const [ttl] = useUserTransactionTTL()
  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()
  const permitData = usePermitData(currencyIn?.wrapped.address)

  const onChangeCurrencyIn = useCallback(
    (c: Currency) => {
      const value = c.isNative ? c.symbol || c.wrapped.address : c.wrapped.address
      if (value === outputCurrencyId) searchParams.set('outputCurrency', inputCurrencyId || '')
      searchParams.set('inputCurrency', value)
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams, inputCurrencyId, outputCurrencyId],
  )

  const onChangeCurrencyOut = useCallback(
    (c: Currency) => {
      const value = c.isNative ? c.symbol || c.wrapped.address : c.wrapped.address
      if (value.toLowerCase() === inputCurrencyId?.toLowerCase()) {
        searchParams.set('inputCurrency', outputCurrencyId || '')
      }
      searchParams.set('outputCurrency', value)
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams, inputCurrencyId, outputCurrencyId],
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
    customChainId: swapChainId,
    omniView: !isUserSwap,
  }

  // modal and loading
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  const currencyName = currencyOut?.wrapped.name
  const currencySymbol = currencyOut?.wrapped.symbol
  return (
    <>
      <PageWrapper>
        <Banner />
        <Container>
          <SwapFormWrapper>
            <Header
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              customChainId={swapChainId}
              activeMainTab={activeMainTab}
            />

            <AppBodyWrapped className={[TAB.INFO, TAB.LIMIT].includes(activeTab) ? '!p-0' : undefined}>
              {isSwapPage && <SwapForm {...props} />}
              {activeTab === TAB.INFO && <TokenInfoTab currencies={currencies} onBack={onBackToSwapTab} />}
              {activeTab === TAB.SETTINGS && (
                <SettingsPanel
                  displaySettings={{
                    isShowPricingChart,
                    isShowTradeRoutes,
                    togglePricingChart,
                    toggleTradeRoutes,
                  }}
                  isCrossChainPage={isCrossChainPage}
                  isSwapPage={isSwapPage}
                  onBack={onBackToSwapTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
                />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} chainId={swapChainId} />
              )}
              {activeTab === TAB.LIMIT && (
                <div className="p-4">
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
              )}
              {activeTab === TAB.CROSS_CHAIN && <CrossChainSwap />}
              {activeTab === TAB.CROSS_CHAIN_SOURCES && (
                <CrossChainSwapSources onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
            </AppBodyWrapped>
          </SwapFormWrapper>

          <InfoComponents>
            {isSwapPage && isShowPricingChart && <TokenPriceChart tokens={[currencyIn, currencyOut]} />}
            {isSwapPage && isShowTradeRoutes && (
              <SwapTradeRoute
                tradeComposition={tradeRouteComposition}
                currencyIn={currencyIn}
                currencyOut={currencyOut}
                defaultCollapsed={hasSupportedTokenPriceChart && isShowPricingChart}
                inputAmount={routeSummary?.parsedAmountIn}
                outputAmount={routeSummary?.parsedAmountOut}
                isSmartSettlementActive={isSmartSettlementActive}
              />
            )}
            {isLimitPage && <ListLimitOrder customChainId={swapChainId} />}
            {isCrossChainPage && <TransactionHistory />}
          </InfoComponents>
        </Container>
        <div className="flex justify-center">
          <SwitchLocaleLinkWrapper>
            <SwitchLocaleLink />
          </SwitchLocaleLinkWrapper>
        </div>
      </PageWrapper>

      <Updater customChainId={swapChainId} />
    </>
  )
}
