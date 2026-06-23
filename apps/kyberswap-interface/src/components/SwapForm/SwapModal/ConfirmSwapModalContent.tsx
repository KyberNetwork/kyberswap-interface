import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Check, Info, Repeat } from 'react-feather'
import { useParams, useSearchParams } from 'react-router-dom'
import { useGetListOrdersQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'
import { calculatePriceImpact } from 'services/route/utils'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import InfoHelper from 'components/InfoHelper'
import { ReservedOrderNotice } from 'components/LimitOrder/components'
import { calcPercentFilledOrder } from 'components/LimitOrder/helpers'
import { LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import Loader from 'components/Loader'
import SlippageWarningNote from 'components/SlippageWarningNote'
import { HStack, Stack } from 'components/Stack'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import SwapBrief from 'components/SwapForm/SwapModal/SwapBrief'
import SwapDetails, { Props as SwapDetailsProps } from 'components/SwapForm/SwapModal/SwapDetails'
import { Level } from 'components/SwapForm/SwapModal/SwapDetails/UpdatedBadge'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import SwapModalAreYouSure from 'components/SwapForm/SwapModal/SwapModalAreYouSure'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { MouseoverTooltip } from 'components/Tooltip'
import { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import WarningNote from 'components/WarningNote'
import { StyledBalanceMaxMini } from 'components/swapv2/styleds'
import { TOKEN_API_URL } from 'constants/env'
import { APP_PATHS, PAIR_CATEGORY } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import { useDefaultSlippageByPair, usePairCategory } from 'state/swap/hooks'
import { useDegenModeManager, useSlippageSettingByPage } from 'state/user/hooks'
import { useTokenBalance } from 'state/wallet/hooks'
import { CloseIcon } from 'theme/components'
import { cn } from 'utils/cn'
import { minimumAmountAfterSlippage, toCurrencyAmount } from 'utils/currencyAmount'
import { checkShouldDisableByPriceImpact } from 'utils/priceImpact'
import { checkPriceImpact } from 'utils/prices'

const SHOW_ACCEPT_NEW_AMOUNT_THRESHOLD = -1
const AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD = -5
const SHOW_CONFIRM_MODAL_AFTER_CLICK_SWAP_THRESHOLD = -10

function ExecutionPrice({
  executionPrice,
  showInverted,
}: {
  executionPrice?: Price<Currency, Currency>
  showInverted?: boolean
}) {
  if (!executionPrice) {
    return null
  }

  const inputSymbol = executionPrice.baseCurrency?.symbol
  const outputSymbol = executionPrice.quoteCurrency?.symbol

  const formattedPrice = showInverted ? executionPrice?.invert()?.toSignificant(6) : executionPrice?.toSignificant(6)
  const value = showInverted
    ? `1 ${outputSymbol} = ${formattedPrice} ${inputSymbol}`
    : `1 ${inputSymbol} = ${formattedPrice} ${outputSymbol}`

  return <span className="min-w-max whitespace-nowrap font-medium">{value}</span>
}

const PriceUpdateWarning = ({
  isAccepted,
  level,
  children,
}: {
  isAccepted: boolean
  level: 'warning' | 'error'
  children: React.ReactNode
}) => (
  <div
    className={cn(
      'flex items-center gap-2 rounded-2xl px-3 py-2 text-xs',
      isAccepted
        ? 'bg-subText/20 text-subText'
        : level === 'warning'
        ? 'bg-warning/30 text-text'
        : 'bg-red/30 text-text',
    )}
  >
    {children}
  </div>
)

type Props = {
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean
  errorWhileBuildRoute: string | undefined
  onDismiss: () => void
  onSwap: () => void
}

const cap = {
  [PAIR_CATEGORY.STABLE]: 20,
  [PAIR_CATEGORY.CORRELATED]: 50,
  [PAIR_CATEGORY.EXOTIC]: 200,
  [PAIR_CATEGORY.HIGH_VOLATILITY]: 500,
}

export default function ConfirmSwapModalContent({
  buildResult,
  isBuildingRoute,
  errorWhileBuildRoute,
  onDismiss,
  onSwap,
}: Props) {
  const theme = useTheme()
  const { routeSummary, slippage, isAdvancedMode } = useSwapFormContext()
  const [hasAcceptedNewAmount, setHasAcceptedNewAmount] = useState(false)
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false)
  const [isDegenMode] = useDegenModeManager()
  const cat = usePairCategory()
  const { setRawSlippage } = useSlippageSettingByPage()

  const shouldDisableConfirmButton = isBuildingRoute || !!errorWhileBuildRoute

  const { currency: currencyParam } = useParams()
  const { currencyIn } = useCurrenciesByPage()
  const { chainId, account, networkInfo } = useActiveWeb3React()
  const [honeypot, setHoneypot] = useState<{ isHoneypot: boolean; isFOT: boolean; tax: number } | null>(null)
  useEffect(() => {
    if (!currencyIn?.wrapped.address) return
    fetch(
      `${TOKEN_API_URL}/v1/public/tokens/honeypot-fot-info?address=${currencyIn.wrapped.address.toLowerCase()}&chainId=${chainId}`,
    )
      .then(res => res.json())
      .then(res => {
        setHoneypot(res.data)
      })
  }, [currencyIn?.wrapped.address, chainId])

  const isSlippageNotEnough =
    !!errorWhileBuildRoute &&
    (errorWhileBuildRoute.includes('enough') ||
      errorWhileBuildRoute.includes('min') ||
      errorWhileBuildRoute.includes('smaller'))
  const apiSuggestedSlp = buildResult && 'suggestedSlippage' in buildResult ? buildResult?.suggestedSlippage : undefined
  const dynamicSuggestedSlippage = apiSuggestedSlp && Math.min(apiSuggestedSlp, cap[cat])

  const errorText = useMemo(() => {
    if (!errorWhileBuildRoute) return
    if (errorWhileBuildRoute.toLowerCase().includes('permit')) {
      return (
        <div>
          <Trans>
            There was an issue while trying to confirm your price. <b>Permit signature invalid</b>
          </Trans>
        </div>
      )
    }

    if (honeypot?.isHoneypot) {
      return (
        <div>
          This token might be a honeypot token and could be unsellable. Please consult the project team for further
          assistance
        </div>
      )
    }

    if (honeypot?.isFOT) {
      return (
        <div>
          This token has a Fee-on-Transfer. Please increase the slippage to at least {honeypot.tax * 100}% to proceed.
        </div>
      )
    }

    if (
      errorWhileBuildRoute.includes('enough') ||
      errorWhileBuildRoute.includes('min') ||
      errorWhileBuildRoute.includes('smaller')
    ) {
      return (
        <div>
          <Trans>
            There was an issue while confirming your price and minimum amount received. You may consider adjusting your{' '}
            <b>Max Slippage</b> and then trying to swap again.
          </Trans>
        </div>
      )
    }
    if (
      errorWhileBuildRoute.includes(
        'Please use a different wallet to fill an order that you created via the KyberSwap Limit Order',
      )
    )
      return <div>{errorWhileBuildRoute}</div>

    return (
      <div>
        <Trans>There was an issue while trying to confirm your price. Please try to swap again.</Trans>
      </div>
    )
  }, [errorWhileBuildRoute, honeypot?.isHoneypot, honeypot?.isFOT, honeypot?.tax])

  const priceImpactFromBuild = buildResult?.data
    ? calculatePriceImpact(Number(buildResult?.data?.amountInUsd || 0), Number(buildResult?.data?.amountOutUsd || 0))
    : undefined

  const priceImpactResult = checkPriceImpact(priceImpactFromBuild)
  const defaultSlp = useDefaultSlippageByPair()

  const outputChangePercent = Number(buildResult?.data?.outputChange?.percent) || 0
  const formattedOutputChangePercent =
    -0.001 < outputChangePercent && outputChangePercent < 0
      ? '> -0.001'
      : 0 < outputChangePercent && outputChangePercent < 0.001
      ? '< 0.001'
      : outputChangePercent.toFixed(3)

  const getSwapDetailsProps = (): SwapDetailsProps => {
    if (!buildResult?.data || !routeSummary) {
      return {
        isLoading: isBuildingRoute,

        gasUsd: undefined,
        minimumAmountOut: undefined,
        executionPrice: undefined,
        priceImpact: undefined,

        buildData: undefined,
      }
    }

    const { amountIn, amountOut, gasUsd } = buildResult.data
    const parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
    const parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
    const executionPrice = new Price(
      parsedAmountIn.currency,
      parsedAmountOut.currency,
      parsedAmountIn.quotient,
      parsedAmountOut.quotient,
    )
    // Min amount out is calculated from get route api amount out.
    const minimumAmountOut = minimumAmountAfterSlippage(routeSummary.parsedAmountOut, slippage)

    return {
      isLoading: isBuildingRoute,

      gasUsd,
      executionPrice,
      minimumAmountOut,
      priceImpact: priceImpactFromBuild,

      buildData: buildResult.data,
    }
  }

  let parsedAmountIn: CurrencyAmount<Currency> | undefined
  let parsedAmountOut: CurrencyAmount<Currency> | undefined
  let parsedAmountOutFromBuild: CurrencyAmount<Currency> | undefined
  let amountInUsd: string | undefined
  let amountOutUsdFromBuild: string | undefined
  if (routeSummary) {
    parsedAmountIn = routeSummary.parsedAmountIn
    parsedAmountOut = routeSummary.parsedAmountOut
    amountInUsd = routeSummary.amountInUsd

    if (buildResult?.data) {
      const { amountOut } = buildResult.data
      parsedAmountOutFromBuild = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)

      amountOutUsdFromBuild = buildResult.data.amountOutUsd
      amountInUsd = buildResult.data.amountInUsd
    }
  }

  const renderSwapBrief = () => {
    if (!parsedAmountIn || amountInUsd === undefined || !parsedAmountOut) {
      return null
    }

    let level: Level
    if (0 < outputChangePercent) {
      level = 'better'
    } else if (AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD < outputChangePercent && outputChangePercent < 0) {
      level = 'worse'
    } else if (outputChangePercent <= -5) {
      level = 'worst'
    }

    return (
      <SwapBrief
        $level={level}
        inputAmount={parsedAmountIn}
        amountInUsd={amountInUsd}
        outputAmount={parsedAmountOut}
        outputAmountFromBuild={parsedAmountOutFromBuild}
        amountOutUsdFromBuild={amountOutUsdFromBuild}
        currencyOut={parsedAmountOut.currency}
        isLoading={isBuildingRoute}
      />
    )
  }

  const showWarningStyle = priceImpactResult.isVeryHigh || priceImpactResult.isInvalid

  const shouldDisableByPriceImpact = checkShouldDisableByPriceImpact(isAdvancedMode, priceImpactFromBuild)

  const isShowAcceptNewAmount =
    outputChangePercent < SHOW_ACCEPT_NEW_AMOUNT_THRESHOLD || (cat === PAIR_CATEGORY.STABLE && outputChangePercent < 0)
  const disableSwap =
    (isShowAcceptNewAmount && !hasAcceptedNewAmount) || shouldDisableConfirmButton || shouldDisableByPriceImpact

  const { trackingHandler } = useTracking()

  const handleClickAcceptNewAmount = () => {
    trackingHandler(TRACKING_EVENT_TYPE.ACCEPT_NEW_AMOUNT)
    if (outputChangePercent > SHOW_CONFIRM_MODAL_AFTER_CLICK_SWAP_THRESHOLD) {
      setHasAcceptedNewAmount(true)
      return
    }

    setShowAreYouSureModal(true)
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const { data: loActiveMakingAmount } = useGetTotalActiveMakingAmountQuery(
    { chainId, tokenAddress: currencyIn?.wrapped.address ?? '', account: account ?? '' },
    { skip: !currencyIn || !account || currencyIn.isNative },
  )
  const { data: { orders = [] } = {} } = useGetListOrdersQuery(
    {
      chainId,
      maker: account,
      status: LimitOrderStatus.ACTIVE,
      query: currencyIn?.wrapped.address,
      page: 1,
      pageSize: 20,
    },
    { skip: !account || currencyIn?.isNative, refetchOnFocus: true },
  )

  const ignoredOrders = useMemo(() => {
    return orders.filter(order => {
      const filledPercent = calcPercentFilledOrder(
        order.filledTakingAmount,
        order.takingAmount,
        order.takerAssetDecimals,
      )
      return filledPercent === '99.99'
    })
  }, [orders])

  const activeMakingAmount =
    BigInt(loActiveMakingAmount || 0) -
    ignoredOrders.reduce((acc, order) => {
      return acc + BigInt(order.makingAmount) - BigInt(order.filledMakingAmount)
    }, 0n)

  const balance = useTokenBalance(currencyIn?.wrapped)

  const remainAmount = BigInt(balance?.quotient.toString() || 0) - BigInt(buildResult?.data?.amountIn || 0)

  const showLOWwarning = currencyIn?.isNative ? false : !!loActiveMakingAmount && remainAmount < activeMakingAmount

  const [showInverted, setShowInverted] = useState<boolean>(false)
  const [retry, setRetry] = useState(0)

  if (errorWhileBuildRoute && dynamicSuggestedSlippage) {
    return (
      <TransactionErrorContent
        onDismiss={onDismiss}
        confirmAction={() => {
          if (retry < 1 && slippage !== dynamicSuggestedSlippage) {
            setRetry(prev => prev + 1)
            setRawSlippage(dynamicSuggestedSlippage)
          } else {
            searchParams.set('action', 'open-slippage-panel')
            setSearchParams(searchParams)
            onDismiss()
          }
        }}
        confirmText={
          retry < 1 && slippage !== dynamicSuggestedSlippage ? t`Use Suggested Slippage` : t`Set Custom Slippage`
        }
        message={
          retry < 1 && slippage !== dynamicSuggestedSlippage
            ? errorWhileBuildRoute
            : t`This route may currently be too volatile to execute. Try to custom your own slippage to continue.`
        }
        confirmBtnStyle={{ flex: 2 }}
        dismissBtnStyle={{ flex: 1 }}
        suggestionMessage={
          retry < 1 &&
          slippage !== dynamicSuggestedSlippage && (
            <div className="text-base text-text">
              <Trans>New Suggested Slippage:</Trans> {(dynamicSuggestedSlippage * 100) / 10_000}%{' '}
              <InfoHelper
                text={
                  <Trans>
                    This suggestion is based on your trade&apos;s estimated slippage and token pair volatility, with a
                    cap applied.
                  </Trans>
                }
              />{' '}
            </div>
          )
        }
      />
    )
  }

  return (
    <>
      <SwapModalAreYouSure
        show={showAreYouSureModal}
        setShow={setShowAreYouSureModal}
        setHasAcceptedNewAmount={setHasAcceptedNewAmount}
        parsedAmountOut={parsedAmountOut}
        parsedAmountOutFromBuild={parsedAmountOutFromBuild}
        formattedOutputChangePercent={formattedOutputChangePercent}
      />

      <Stack className="w-full gap-4 p-5">
        <Stack className="gap-3">
          <Stack className="gap-1">
            <HStack className="w-full items-center justify-between">
              <span className="text-xl font-medium">
                <Trans>Confirm Swap Details</Trans>
              </span>
              <CloseIcon onClick={onDismiss} />
            </HStack>

            <div className="text-xs text-subText">
              <Trans>Please review the details of your swap:</Trans>
            </div>
          </Stack>

          {outputChangePercent < 0 && (
            <PriceUpdateWarning
              level={outputChangePercent <= AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD ? 'error' : 'warning'}
              isAccepted={hasAcceptedNewAmount}
            >
              {hasAcceptedNewAmount && <Check size={20} className="text-text" />}
              <div className="flex-1 text-text">
                {hasAcceptedNewAmount ? (
                  <Trans>New Amount Accepted</Trans>
                ) : (
                  <Trans>
                    Due to market conditions, your output has been updated from{' '}
                    {parsedAmountOut?.toSignificant(10) || ''} {parsedAmountOut?.currency?.symbol} to{' '}
                    {parsedAmountOutFromBuild?.toSignificant(10) || ''} {parsedAmountOut?.currency?.symbol} (
                    {formattedOutputChangePercent}%){' '}
                    {isShowAcceptNewAmount ? '. Please accept the new amount before swapping' : ''}
                  </Trans>
                )}
              </div>
            </PriceUpdateWarning>
          )}

          <Stack className="gap-1">
            <HStack className="items-center justify-between gap-4">
              <div className="flex min-h-6 items-center gap-1">
                <span className="min-w-max text-xs font-normal text-subText">
                  <Trans>Rate:</Trans>
                </span>
                <ValueWithLoadingSkeleton
                  skeletonStyle={{ width: '160px' }}
                  isShowingSkeleton={isBuildingRoute}
                  content={
                    getSwapDetailsProps().executionPrice ? (
                      <div className="flex items-center justify-center text-right text-xs font-medium text-text">
                        <ExecutionPrice
                          executionPrice={getSwapDetailsProps().executionPrice}
                          showInverted={showInverted}
                        />
                        <StyledBalanceMaxMini
                          className="hover:brightness-[0.85]"
                          onClick={() => setShowInverted(!showInverted)}
                        >
                          <Repeat size={14} className="text-text" />
                        </StyledBalanceMaxMini>
                      </div>
                    ) : (
                      <p className="m-0 text-[12px] font-medium text-text">--</p>
                    )
                  }
                />
              </div>

              {isBuildingRoute && (
                <div className="flex h-full w-fit items-center gap-1">
                  <Loader size="14px" className="text-primary" />
                  <span className="text-xs text-subText">
                    <Dots>
                      <Trans>Checking price</Trans>
                    </Dots>
                  </span>
                </div>
              )}
            </HStack>

            {renderSwapBrief()}
          </Stack>
        </Stack>

        <SwapDetails {...getSwapDetailsProps()} />

        <div className="flex flex-col gap-4">
          <SlippageWarningNote rawSlippage={slippage} />

          <PriceImpactNote isDegenMode={isAdvancedMode} priceImpact={priceImpactFromBuild} />

          {errorWhileBuildRoute && <WarningNote shortText={errorText} />}
          {showLOWwarning && (
            <ReservedOrderNotice
              symbol={currencyIn?.symbol}
              to={`${APP_PATHS.LIMIT}/${networkInfo.route}/${currencyParam}?tab=${LimitOrderTab.MY_ORDER}&orderTab=${LimitOrderStatus.ACTIVE}&search=${currencyIn?.wrapped.address}`}
            />
          )}

          {errorWhileBuildRoute ? (
            isSlippageNotEnough && slippage <= defaultSlp ? (
              <div className="flex gap-4">
                <ButtonOutlined onClick={onDismiss} className="flex-1">
                  Dismiss
                </ButtonOutlined>
                {slippage < defaultSlp ? (
                  <ButtonPrimary className="flex-[2]" onClick={() => setRawSlippage(defaultSlp)}>
                    Use Suggested Slippage
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary
                    className="flex-1"
                    onClick={() => {
                      searchParams.set('action', 'open-slippage-panel')
                      setSearchParams(searchParams)
                      onDismiss()
                    }}
                  >
                    Set Custom Slippage
                  </ButtonPrimary>
                )}
              </div>
            ) : (
              <ButtonPrimary
                onClick={() => {
                  if (honeypot?.isFOT) {
                    searchParams.set('tab', 'settings')
                    setSearchParams(searchParams)
                  }
                  onDismiss()
                }}
              >
                <span className="text-sm font-medium leading-none">
                  {honeypot?.isFOT ? 'Adjust Settings' : 'Dismiss'}
                </span>
              </ButtonPrimary>
            )
          ) : (
            <div className="flex w-full gap-2">
              {isShowAcceptNewAmount && (
                <ButtonPrimary
                  style={
                    hasAcceptedNewAmount || (priceImpactResult.isVeryHigh && !isDegenMode)
                      ? undefined
                      : {
                          backgroundColor:
                            priceImpactResult.isVeryHigh ||
                            priceImpactResult.isInvalid ||
                            outputChangePercent <= AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD
                              ? theme.red
                              : theme.warning,
                        }
                  }
                  onClick={handleClickAcceptNewAmount}
                  disabled={hasAcceptedNewAmount || (priceImpactResult.isVeryHigh && !isDegenMode)}
                >
                  Accept New Amount
                </ButtonPrimary>
              )}

              <ButtonPrimary
                onClick={onSwap}
                disabled={disableSwap}
                id="confirm-swap-or-send"
                className={cn('flex items-center gap-1', !disableSwap && showWarningStyle && '!bg-red !text-text')}
              >
                {shouldDisableConfirmButton ? (
                  <span className="text-sm font-medium leading-none">
                    <Trans>Swap</Trans>
                  </span>
                ) : disableSwap ? (
                  <>
                    {shouldDisableByPriceImpact && (
                      <MouseoverTooltip
                        text={
                          <Trans>
                            To ensure you dont lose funds due to very high price impact (≥10%), swap has been disabled
                            for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.
                          </Trans>
                        }
                      >
                        <Info size={14} />
                      </MouseoverTooltip>
                    )}
                    <span>
                      {shouldDisableByPriceImpact ? <Trans>Swap Disabled</Trans> : <Trans>Confirm Swap</Trans>}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium leading-none">
                    <Trans>Confirm Swap</Trans>
                  </span>
                )}
              </ButtonPrimary>
            </div>
          )}
        </div>
      </Stack>
    </>
  )
}
