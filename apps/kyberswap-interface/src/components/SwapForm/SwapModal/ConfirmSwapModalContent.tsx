import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import { useEffect, useMemo, useState } from 'react'
import { Check, Info, Repeat } from 'react-feather'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { calculatePriceImpact } from 'services/route/utils'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { Level } from 'components/SwapForm/SwapModal/SwapDetails/UpdatedBadge'
import SwapModalAreYouSure from 'components/SwapForm/SwapModal/SwapModalAreYouSure'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { MouseoverTooltip } from 'components/Tooltip'
import WarningNote from 'components/WarningNote'
import { Dots, StyledBalanceMaxMini } from 'components/swapv2/styleds'
import { TOKEN_API_URL } from 'constants/env'
import { APP_PATHS, PAIR_CATEGORY } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import { useDefaultSlippageByPair, usePairCategory } from 'state/swap/hooks'
import { useDegenModeManager, useSlippageSettingByPage } from 'state/user/hooks'
import { CloseIcon } from 'theme/components'
import { minimumAmountAfterSlippage, toCurrencyAmount } from 'utils/currencyAmount'
import { checkShouldDisableByPriceImpact } from 'utils/priceImpact'
import { checkPriceImpact } from 'utils/prices'

import SwapBrief from './SwapBrief'
import SwapDetails, { Props as SwapDetailsProps } from './SwapDetails'
import { useGetListOrdersQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'
import { useTokenBalance } from 'state/wallet/hooks'
import { LimitOrderStatus, LimitOrderTab } from 'components/swapv2/LimitOrder/type'
import { calcPercentFilledOrder } from 'components/swapv2/LimitOrder/helpers'
import ValueWithLoadingSkeleton from './SwapDetails/ValueWithLoadingSkeleton'
import { TYPE } from 'theme'

const SHOW_ACCEPT_NEW_AMOUNT_THRESHOLD = -1
const AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD = -5
const SHOW_CONFIRM_MODAL_AFTER_CLICK_SWAP_THRESHOLD = -10

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px;
  gap: 16px;
  border-radius: 20px;
`

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

  return (
    <Text fontWeight={500} style={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}>
      {value}
    </Text>
  )
}

const PriceUpdateWarning = styled.div<{ isAccepted: boolean; $level: 'warning' | 'error' }>`
  margin-top: 1rem;
  border-radius: 16px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  background: ${({ $level, theme, isAccepted }) =>
    isAccepted
      ? transparentize(0.8, theme.subText)
      : $level === 'warning'
      ? transparentize(0.7, theme.warning)
      : transparentize(0.7, theme.red)};
  color: ${({ theme, isAccepted }) => (isAccepted ? theme.subText : theme.text)};
`

type Props = {
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean
  errorWhileBuildRoute: string | undefined
  onDismiss: () => void
  onSwap: () => void
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

  const errorText = useMemo(() => {
    if (!errorWhileBuildRoute) return
    if (errorWhileBuildRoute.toLowerCase().includes('permit')) {
      return (
        <Text>
          <Trans>
            There was an issue while trying to confirm your price. <b>Permit signature invalid</b>
          </Trans>
        </Text>
      )
    }

    if (honeypot?.isHoneypot) {
      return (
        <Text>
          This token might be a honeypot token and could be unsellable. Please consult the project team for further
          assistance
        </Text>
      )
    }

    if (honeypot?.isFOT) {
      return (
        <Text>
          This token has a Fee-on-Transfer. Please increase the slippage to at least {honeypot.tax * 100}% to proceed.
        </Text>
      )
    }

    if (
      errorWhileBuildRoute.includes('enough') ||
      errorWhileBuildRoute.includes('min') ||
      errorWhileBuildRoute.includes('smaller')
    ) {
      return (
        <Text>
          <Trans>
            There was an issue while confirming your price and minimum amount received. You may consider adjusting your{' '}
            <b>Max Slippage</b> and then trying to swap again.
          </Trans>
        </Text>
      )
    }
    if (
      errorWhileBuildRoute.includes(
        'Please use a different wallet to fill an order that you created via the KyberSwap Limit Order',
      )
    )
      return <Text>{errorWhileBuildRoute}</Text>

    return (
      <Text>
        <Trans>There was an issue while trying to confirm your price. Please try to swap again.</Trans>
      </Text>
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

  const warningStyle =
    priceImpactResult.isVeryHigh || priceImpactResult.isInvalid
      ? { background: theme.red, color: theme.text }
      : undefined

  const shouldDisableByPriceImpact = checkShouldDisableByPriceImpact(isAdvancedMode, priceImpactFromBuild)

  const isShowAcceptNewAmount =
    outputChangePercent < SHOW_ACCEPT_NEW_AMOUNT_THRESHOLD || (cat === PAIR_CATEGORY.STABLE && outputChangePercent < 0)
  const disableSwap =
    (isShowAcceptNewAmount && !hasAcceptedNewAmount) || shouldDisableConfirmButton || shouldDisableByPriceImpact

  const { mixpanelHandler } = useMixpanel()

  const handleClickAcceptNewAmount = () => {
    mixpanelHandler(MIXPANEL_TYPE.ACCEPT_NEW_AMOUNT)
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

      <Wrapper>
        <AutoColumn>
          <RowBetween>
            <Text fontWeight={500} fontSize={20}>
              <Trans>Confirm Swap Details</Trans>
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>

          <RowBetween mt="4px">
            <Text fontWeight={400} fontSize={12} color={theme.subText}>
              <Trans>Please review the details of your swap:</Trans>
            </Text>
            {isBuildingRoute && (
              <Flex width="fit-content" height="100%" alignItems="center" sx={{ gap: '4px' }}>
                <Loader size="14px" stroke={theme.primary} />
                <Text as="span" fontSize={12} color={theme.subText}>
                  <Dots>
                    <Trans>Checking price</Trans>
                  </Dots>
                </Text>
              </Flex>
            )}
          </RowBetween>

          {outputChangePercent < 0 && (
            <PriceUpdateWarning
              $level={outputChangePercent <= AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD ? 'error' : 'warning'}
              isAccepted={hasAcceptedNewAmount}
            >
              {hasAcceptedNewAmount && <Check size={20} color={theme.text} />}
              <Text flex={1} color={theme.text}>
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
              </Text>
            </PriceUpdateWarning>
          )}

          <Flex alignItems="center" sx={{ gap: '4px' }} mt="12px">
            <Text fontWeight={400} fontSize={12} color={theme.subText} minWidth="max-content">
              <Trans>Rate:</Trans>
            </Text>
            <ValueWithLoadingSkeleton
              skeletonStyle={{
                width: '160px',
                height: '19px',
              }}
              isShowingSkeleton={isBuildingRoute}
              content={
                getSwapDetailsProps().executionPrice ? (
                  <Flex
                    fontWeight={500}
                    fontSize={12}
                    color={theme.text}
                    sx={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'right',
                    }}
                  >
                    <ExecutionPrice executionPrice={getSwapDetailsProps().executionPrice} showInverted={showInverted} />
                    <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                      <Repeat size={14} color={theme.text} />
                    </StyledBalanceMaxMini>
                  </Flex>
                ) : (
                  <TYPE.black fontSize={12}>--</TYPE.black>
                )
              }
            />
          </Flex>

          {renderSwapBrief()}
        </AutoColumn>

        <SwapDetails {...getSwapDetailsProps()} />

        <Flex sx={{ flexDirection: 'column', gap: '16px' }}>
          <SlippageWarningNote rawSlippage={slippage} />

          <PriceImpactNote isDegenMode={isAdvancedMode} priceImpact={priceImpactFromBuild} />

          {errorWhileBuildRoute && <WarningNote shortText={errorText} />}
          {showLOWwarning && (
            <Text fontStyle="italic" fontSize={12} color={theme.subText} fontWeight={500}>
              <Text fontWeight="500" color={theme.text} as="span">
                Notice
              </Text>
              : Some of your {currencyIn?.symbol} is already reserved by an open Limit Order—review it{' '}
              <Link
                to={`${APP_PATHS.LIMIT}/${networkInfo.route}/${currencyParam}?activeTab=${LimitOrderTab.MY_ORDER}&search=${currencyIn?.wrapped.address}&highlight=true`}
              >
                here.
              </Link>
            </Text>
          )}

          {errorWhileBuildRoute ? (
            isSlippageNotEnough && slippage <= defaultSlp ? (
              <Flex sx={{ gap: '16px' }}>
                <ButtonOutlined onClick={onDismiss} style={{ flex: 1 }}>
                  Dismiss
                </ButtonOutlined>
                {slippage < defaultSlp ? (
                  <ButtonPrimary style={{ flex: 2 }} onClick={() => setRawSlippage(defaultSlp)}>
                    Use Suggested Slippage
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary
                    style={{ flex: 1 }}
                    onClick={() => {
                      searchParams.set('tab', 'settings')
                      setSearchParams(searchParams)
                      onDismiss()
                    }}
                  >
                    Set Custom Slippage
                  </ButtonPrimary>
                )}
              </Flex>
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
                <Text fontSize={14} fontWeight={500} as="span" lineHeight={1}>
                  {honeypot?.isFOT ? 'Adjust Settings' : 'Dismiss'}
                </Text>
              </ButtonPrimary>
            )
          ) : (
            <Flex sx={{ gap: '8px', width: '100%' }}>
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
                style={{
                  ...(disableSwap ? undefined : warningStyle),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {shouldDisableConfirmButton ? (
                  <Text fontSize={14} fontWeight={500} as="span" lineHeight={1}>
                    <Trans>Swap</Trans>
                  </Text>
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
                    <Text>
                      {shouldDisableByPriceImpact ? <Trans>Swap Disabled</Trans> : <Trans>Confirm Swap</Trans>}
                    </Text>
                  </>
                ) : (
                  <Text fontSize={14} fontWeight={500} as="span" lineHeight={1}>
                    <Trans>Confirm Swap</Trans>
                  </Text>
                )}
              </ButtonPrimary>
            </Flex>
          )}
        </Flex>
      </Wrapper>
    </>
  )
}
