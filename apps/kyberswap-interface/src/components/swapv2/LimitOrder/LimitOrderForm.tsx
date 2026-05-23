import { ChainId, Currency, CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Repeat } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useCreateOrderMutation, useGetLOConfigQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { NotificationType } from 'components/Announcement/type'
import ArrowRotate from 'components/ArrowRotate'
import { ButtonLight } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import { NetworkSelector } from 'components/NetworkSelector'
import NumericalInput from 'components/NumericalInput'
import { RowBetween } from 'components/Row'
import { DefaultSlippageOption } from 'components/SlippageControl'
import Tooltip, { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import ActionButtonLimitOrder from 'components/swapv2/LimitOrder/ActionButtonLimitOrder'
import DeltaRate, { useGetDeltaRateLimitOrder } from 'components/swapv2/LimitOrder/DeltaRate'
import { SummaryNotifyOrderPlaced } from 'components/swapv2/LimitOrder/ListOrder/SummaryNotify'
import ConfirmOrderModal from 'components/swapv2/LimitOrder/Modals/ConfirmOrderModal'
import TradePrice from 'components/swapv2/LimitOrder/TradePrice'
import useSignOrder from 'components/swapv2/LimitOrder/useSignOrder'
import useValidateInputError from 'components/swapv2/LimitOrder/useValidateInputError'
import useWarningCreateOrder from 'components/swapv2/LimitOrder/useWarningCreateOrder'
import useWrapEthStatus from 'components/swapv2/LimitOrder/useWrapEthStatus'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { useTokenAllowance } from 'data/Allowances'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useWrapCallback from 'hooks/useWrapCallback'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { useNotify } from 'state/application/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { getCookieValue } from 'utils'
import { cn } from 'utils/cn'
import { subscribeNotificationOrderCancelled, subscribeNotificationOrderExpired } from 'utils/firebase'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { formatTimeDuration } from 'utils/time'

import ExpirePicker from './ExpirePicker'
import { DEFAULT_EXPIRED, getExpireOptions } from './const'
import {
  calcInvert,
  calcOutput,
  calcRate,
  calcUsdPrices,
  formatAmountOrder,
  getErrorMessage,
  getPayloadCreateOrder,
  parseFraction,
  removeTrailingZero,
} from './helpers'
import { CreateOrderParam, EditOrderInfo, LimitOrder, RateInfo } from './type'

const DropdownIcon = ({ className, ...rest }: React.SVGProps<SVGSVGElement> & { 'data-flip'?: boolean }) => (
  <DropdownSVG
    className={cn('text-subText transition-transform duration-300 data-[flip=true]:rotate-180', className)}
    {...rest}
  />
)

export const Label = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-xs font-medium text-subText', className)} {...rest}>
    {children}
  </div>
)

const Set2Market = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <Label className={cn('m-0 cursor-pointer select-none text-primary', className)} {...rest}>
    {children}
  </Label>
)
const INPUT_HEIGHT = 28

type Props = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  defaultInputAmount?: string
  defaultOutputAmount?: string
  defaultActiveMakingAmount?: string
  defaultExpire?: Date
  note?: string
  orderInfo?: LimitOrder
  flowState: TransactionFlowState
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
  zIndexToolTip?: number
  defaultRate?: RateInfo
  editOrderInfo?: EditOrderInfo
  useUrlParams?: boolean
}

const InputWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-1 flex-col gap-2 rounded-xl bg-buttonBlack p-3 max-sm:w-full', className)} {...rest}>
    {children}
  </div>
)

const useInputAmount = ({
  defaultInputAmount,
  isEdit,
}: {
  defaultInputAmount?: string
  isEdit: boolean
}): [string, (v: string) => void] => {
  const { inputAmount } = useLimitState()
  const { setInputValue } = useLimitActionHandlers()

  const localState = useState(defaultInputAmount || '')
  return isEdit ? localState : [inputAmount, setInputValue]
}

export type LimitOrderFormHandle = {
  hasChangedOrderInfo: () => boolean
}
const LimitOrderForm = forwardRef<LimitOrderFormHandle, Props>(function LimitOrderForm(
  {
    currencyIn,
    currencyOut,
    defaultInputAmount = '',
    defaultOutputAmount = '',
    defaultActiveMakingAmount = '',
    defaultExpire,
    defaultRate = { rate: '', invertRate: '', invert: false },
    note = '',
    orderInfo,
    flowState,
    setFlowState,
    zIndexToolTip = Z_INDEXS.TOOL_TIP_ERROR_INPUT_SWAP_FORM,
    editOrderInfo,
    useUrlParams,
  },
  ref,
) {
  const { changeNetwork } = useChangeNetwork()
  const isEdit = editOrderInfo?.isEdit || false // else create
  const { account, chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlChainId = searchParams.get('chainId')
  const chainId: ChainId = useUrlParams
    ? urlChainId && SUPPORTED_NETWORKS.includes(+urlChainId)
      ? +urlChainId
      : walletChainId
    : walletChainId

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()
  const notify = useNotify()
  const { trackingHandler } = useTracking()

  const {
    setCurrencyIn: updateCurrencyIn,
    setCurrencyOut: updateCurrencyOut,
    switchCurrency: rotateCurrency,
    removeOrderNeedCreated,
    setOrderEditing,
  } = useLimitActionHandlers()

  const setCurrencyIn = useCallback(
    (currency: Currency | undefined) => {
      if (useUrlParams) {
        searchParams.set(
          'inputCurrency',
          !currency ? '' : currency.isNative ? currency.symbol || '' : currency.wrapped.address,
        )
        setSearchParams(searchParams)
      } else updateCurrencyIn(currency)
      autoFillMarketPrice.current = false
    },
    [useUrlParams, searchParams, setSearchParams, updateCurrencyIn],
  )

  const setCurrencyOut = useCallback(
    (currency: Currency | undefined) => {
      if (useUrlParams) {
        searchParams.set(
          'outputCurrency',
          !currency ? '' : currency.isNative ? currency.symbol || '' : currency.wrapped.address,
        )
        setSearchParams(searchParams)
      } else updateCurrencyOut(currency)
      autoFillMarketPrice.current = false
    },
    [useUrlParams, searchParams, setSearchParams, updateCurrencyOut],
  )

  const switchCurrency = useCallback(() => {
    if (useUrlParams) {
      const cin = searchParams.get('inputCurrency') || ''
      const cout = searchParams.get('outputCurrency') || ''
      searchParams.set('outputCurrency', cin)
      searchParams.set('inputCurrency', cout)
      setSearchParams(searchParams)
    } else rotateCurrency()
  }, [useUrlParams, rotateCurrency, searchParams, setSearchParams])

  const { ordersNeedCreated } = useLimitState()

  const [inputAmount, setInputAmount] = useInputAmount({ defaultInputAmount, isEdit })
  const [outputAmount, setOutputAmount] = useState(defaultOutputAmount)

  const [rateInfo, setRateInfo] = useState<RateInfo>(defaultRate)
  const displayRate = rateInfo.invert ? rateInfo.invertRate : rateInfo.rate

  const [expire, setExpire] = useState(DEFAULT_EXPIRED)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDateExpire, setCustomDateExpire] = useState<Date | undefined>(defaultExpire)

  const [approvalSubmitted, setApprovalSubmitted] = useState(false)
  const { library } = useWeb3React()

  const { loading: loadingTrade, tradeInfo } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)
  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: tradeInfo, rateInfo })

  const { data: activeOrderMakingAmount = defaultActiveMakingAmount, refetch: getActiveMakingAmount } =
    useGetTotalActiveMakingAmountQuery(
      { chainId, tokenAddress: currencyIn?.wrapped.address ?? '', account: account ?? '' },
      { skip: !currencyIn || !account },
    )

  const { execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencyIn,
    currencyOut,
    inputAmount,
    true,
    chainId,
  )
  const showWrap = !!currencyIn?.isNative

  const onSetRate = useCallback(
    (rate: string, invertRate: string) => {
      if (!currencyIn || !currencyOut) return
      const newRate: RateInfo = { ...rateInfo, rate, invertRate, rateFraction: parseFraction(rate) }
      if (!rate && !invertRate) {
        setRateInfo(newRate)
        return
      }

      if (rate) {
        if (inputAmount) {
          const output = calcOutput(inputAmount, newRate.rateFraction || rate, currencyOut.decimals)
          setOutputAmount(output)
        }
        if (!invertRate) {
          newRate.invertRate = calcInvert(rate)
        }
        setRateInfo(newRate)
        return
      }
      if (invertRate) {
        newRate.rate = calcInvert(invertRate)
        newRate.rateFraction = parseFraction(invertRate).invert()
        if (inputAmount) {
          const output = calcOutput(inputAmount, newRate.rateFraction, currencyOut.decimals)
          setOutputAmount(output)
        }
        setRateInfo(newRate)
        return
      }
    },
    [currencyIn, currencyOut, inputAmount, rateInfo],
  )

  const onSetOutput = (output: string) => {
    if (inputAmount && parseFloat(inputAmount) !== 0 && currencyOut && output) {
      const rate = calcRate(inputAmount, output, currencyOut?.decimals)
      setRateInfo({
        ...rateInfo,
        rate,
        rateFraction: parseFraction(rate),
        invertRate: calcInvert(rate),
      })
    }
    setOutputAmount(output)
  }

  const setPriceRateMarket = useCallback(
    (autoFillInput = false) => {
      try {
        !autoFillInput && trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'set price')
        if ((loadingTrade && !autoFillInput) || !tradeInfo) return
        const marketRate = removeTrailingZero(tradeInfo.marketRate.toFixed(16)) ?? ''
        onSetRate(marketRate, removeTrailingZero(tradeInfo.invertRate.toFixed(16)) ?? '')
        if (!autoFillInput) {
          trackingHandler(TRACKING_EVENT_TYPE.LO_PRICE_SET, {
            side: rateInfo.invert ? 'buy' : 'sell',
            limit_price: marketRate,
            market_price: marketRate,
            price_difference_pct: 0,
            from_token: currencyIn?.symbol,
            to_token: currencyOut?.symbol,
            chain: networkInfo.name,
          })
        }
      } catch (error) {}
    },
    [loadingTrade, trackingHandler, onSetRate, tradeInfo, rateInfo.invert, currencyIn, currencyOut, networkInfo.name],
  )

  const onChangeRate = (val: string) => {
    if (currencyOut) {
      onSetRate(rateInfo.invert ? '' : val, rateInfo.invert ? val : '')
    }
  }

  const onSetInput = useCallback(
    (input: string) => {
      setInputAmount(input)
      if (rateInfo.rate && currencyIn && currencyOut && input) {
        setOutputAmount(calcOutput(input, rateInfo.rateFraction || rateInfo.rate, currencyOut.decimals))
      }
    },
    [rateInfo, currencyIn, currencyOut, setInputAmount],
  )

  const onInvertRate = (invert: boolean) => {
    setRateInfo({ ...rateInfo, invert })
  }

  const handleInputSelect = useCallback(
    (currency: Currency, resetRate = true) => {
      if (currencyOut && currency?.equals(currencyOut)) {
        switchCurrency()
        return
      }
      setCurrencyIn(currency)
      resetRate && setRateInfo(rateInfo => ({ ...rateInfo, invertRate: '', rate: '', rateFraction: undefined }))
    },
    [currencyOut, setCurrencyIn, switchCurrency],
  )

  const switchToWeth = useCallback(() => {
    handleInputSelect(currencyIn?.wrapped as Currency, false)
  }, [currencyIn, handleInputSelect])

  const { isWrappingEth, setTxHashWrapped } = useWrapEthStatus(switchToWeth)

  const handleOutputSelect = (currency: Currency) => {
    if (currencyIn && currency?.equals(currencyIn)) {
      switchCurrency()
      return
    }
    setCurrencyOut(currency)
    setRateInfo({ ...rateInfo, invertRate: '', rate: '', rateFraction: undefined })
  }

  const [rotate, setRotate] = useState(false)
  const handleRotateClick = () => {
    if (isEdit) return
    trackingHandler(TRACKING_EVENT_TYPE.LO_SIDE_SELECTED, {
      side: rateInfo.invert ? 'sell' : 'buy',
      from_token: currencyOut?.symbol,
      to_token: currencyIn?.symbol,
      chain: networkInfo.name,
    })
    setRotate(prev => !prev)
    switchCurrency()
    setInputAmount(outputAmount)
    setOutputAmount(inputAmount)
    if (currencyIn) {
      const rate = calcRate(outputAmount, inputAmount, currencyIn?.decimals)
      setRateInfo({
        ...rateInfo,
        rate,
        rateFraction: parseFraction(rate),
        invertRate: calcInvert(rate),
      })
    }
  }

  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  const { currentData } = useGetLOConfigQuery(chainId)
  const limitOrderContract = currentData?.contract

  const currentAllowance = useTokenAllowance(
    currencyIn as Token,
    account ?? undefined,
    limitOrderContract,
  ) as CurrencyAmount<Currency>

  const parsedActiveOrderMakingAmount = useMemo(() => {
    try {
      if (currencyIn && activeOrderMakingAmount) {
        if (currencyIn.isNative) {
          return TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(0))
        }
        const value = TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(activeOrderMakingAmount))
        if (isEdit && orderInfo) {
          const makingAmount = TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(orderInfo.makingAmount))
          return value.greaterThan(makingAmount)
            ? value.subtract(makingAmount)
            : TokenAmount.fromRawAmount(currencyIn, 0)
        }
        return value
      }
    } catch (error) {}
    return undefined
  }, [currencyIn, activeOrderMakingAmount, isEdit, orderInfo])

  const balance = useCurrencyBalance(currencyIn, chainId)
  const maxAmountInput = useMemo(() => {
    return maxAmountSpend(balance)
  }, [balance])

  const handleMaxInput = useCallback(() => {
    if (!maxAmountInput) return
    try {
      onSetInput(maxAmountInput.toExact())
    } catch (error) {}
  }, [maxAmountInput, onSetInput])

  const missingAllowance = useMemo(() => {
    if (currentAllowance?.equalTo(0)) return true
    if (currencyIn?.isNative || !parseInputAmount) return false
    const allowanceSubtracted = parsedActiveOrderMakingAmount
      ? currentAllowance?.subtract(parsedActiveOrderMakingAmount)
      : undefined
    if (
      !allowanceSubtracted ||
      allowanceSubtracted.greaterThan(parseInputAmount) ||
      allowanceSubtracted.equalTo(parseInputAmount)
    )
      return false
    return parseInputAmount.subtract(allowanceSubtracted)
  }, [currencyIn?.isNative, currentAllowance, parseInputAmount, parsedActiveOrderMakingAmount])

  const enoughAllowance = !Boolean(missingAllowance)

  const [approval, approveCallback] = useApproveCallback(
    parseInputAmount,
    limitOrderContract || undefined,
    !enoughAllowance,
  )

  const { inputError, outPutError } = useValidateInputError({
    inputAmount,
    outputAmount,
    balance,
    displayRate,
    parsedActiveOrderMakingAmount: undefined,
    currencyIn,
    wrapInputError,
    showWrap,
    currencyOut,
  })

  const hasInputError = Boolean(inputError || outPutError)
  const checkingAllowance =
    !(currencyIn && parsedActiveOrderMakingAmount?.currency?.equals(currencyIn)) ||
    !(currencyIn && currentAllowance?.currency?.equals(currencyIn))

  const isNotFillAllInput = [outputAmount, inputAmount, currencyIn, currencyOut, displayRate].some(e => !e)

  const expiredAt = customDateExpire?.getTime() || Date.now() + expire * 1000

  const displayTime = customDateExpire ? dayjs(customDateExpire).format('DD/MM/YYYY HH:mm') : formatTimeDuration(expire)

  const getTokenAddress = (currency: Currency | undefined) =>
    currency?.isNative ? 'NATIVE' : currency?.wrapped?.address

  const showPreview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return
    setFlowState({ ...TRANSACTION_STATE_DEFAULT, showConfirm: true })
    if (!isEdit) {
      trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_REVIEW_PLACE_ORDER, {
        from_token: currencyIn.symbol,
        to_token: currencyOut.symbol,
        from_network: chainId,
        trade_qty: inputAmount,
      })
      trackingHandler(TRACKING_EVENT_TYPE.LO_REVIEW_OPENED, {
        side: rateInfo.invert ? 'buy' : 'sell',
        from_token: currencyIn.symbol,
        from_token_address: getTokenAddress(currencyIn),
        to_token: currencyOut.symbol,
        to_token_address: getTokenAddress(currencyOut),
        pair: `${currencyIn.symbol}/${currencyOut.symbol}`,
        limit_price: displayRate,
        amount_in: inputAmount,
        amount_in_usd: estimateUSD.rawInput || undefined,
        amount_out_estimated: outputAmount,
        expiry: displayTime,
        market_price: tradeInfo ? removeTrailingZero(tradeInfo.marketRate.toFixed(16)) : undefined,
        price_difference_pct: deltaRate.rawPercent ? Number(deltaRate.rawPercent) : undefined,
        chain: networkInfo.name,
      })
    }
  }

  const hidePreview = useCallback(() => {
    setFlowState(state => ({ ...state, showConfirm: false }))
  }, [setFlowState])

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker)
  }

  const onChangeExpire = (val: Date | number) => {
    const previousExpiry = displayTime
    if (typeof val === 'number') {
      setExpire(val)
      setCustomDateExpire(undefined)
      trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'choose date')
      trackingHandler(TRACKING_EVENT_TYPE.LO_EXPIRY_CHANGED, {
        previous_expiry: previousExpiry,
        new_expiry: formatTimeDuration(val),
        custom_expiry_minutes: null,
        chain: networkInfo.name,
      })
    } else {
      setCustomDateExpire(val)
      trackingHandler(TRACKING_EVENT_TYPE.LO_EXPIRY_CHANGED, {
        previous_expiry: previousExpiry,
        new_expiry: 'custom',
        custom_expiry_minutes: Math.round((val.getTime() - Date.now()) / 60000),
        chain: networkInfo.name,
      })
    }
  }

  const onResetForm = () => {
    setInputAmount(defaultInputAmount)
    setOutputAmount(defaultOutputAmount)
    setRateInfo(defaultRate)
    setExpire(DEFAULT_EXPIRED)
    setCustomDateExpire(undefined)
    refreshActiveMakingAmount()
  }

  const handleError = useCallback(
    (error: any) => {
      const errorMessage = getErrorMessage(error)
      const isUserRejected =
        errorMessage.toLowerCase().includes('user denied') || errorMessage.toLowerCase().includes('user rejected')
      trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_FAILED, {
        side: rateInfo.invert ? 'buy' : 'sell',
        from_token: currencyIn?.symbol,
        to_token: currencyOut?.symbol,
        pair: currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
        limit_price: displayRate,
        amount_in: inputAmount,
        error_type: isUserRejected ? 'user_rejected' : 'tx_failed',
        error_message: errorMessage,
        chain: networkInfo.name,
      })
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage,
      }))
    },
    [
      setFlowState,
      trackingHandler,
      rateInfo.invert,
      currencyIn,
      currencyOut,
      displayRate,
      inputAmount,
      networkInfo.name,
    ],
  )

  const signOrder = useSignOrder(setFlowState)

  const [submitOrder] = useCreateOrderMutation()
  const onSubmitCreateOrder = async (params: CreateOrderParam) => {
    try {
      const { currencyIn, currencyOut, account, inputAmount, outputAmount, expiredAt } = params
      if (!library || !currencyIn || !currencyOut || !account || !inputAmount || !outputAmount || !expiredAt) {
        throw new Error('wrong input')
      }

      const refCode = getCookieValue('refCode')
      const clientId = searchParams.get('clientId')

      const { signature, salt } = await signOrder({ ...params, referral: refCode })
      const payload = getPayloadCreateOrder(params)
      setFlowState(state => ({ ...state, pendingText: t`Placing order` }))
      const response = await submitOrder({ ...payload, salt, signature, referral: refCode, clientId }).unwrap()
      setFlowState(state => ({ ...state, showConfirm: false }))

      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Order Placed`,
          summary: <SummaryNotifyOrderPlaced {...{ currencyIn, currencyOut, inputAmount, outputAmount }} />,
        },
        10000,
      )
      onResetForm()
      return response?.id
    } catch (error) {
      handleError(error)
      return
    }
  }

  const onWrapToken = async () => {
    try {
      if (isNotFillAllInput || wrapInputError || isWrappingEth || hasInputError) return
      const amount = formatAmountOrder(inputAmount)
      const wethSymbol = WETH[chainId].symbol
      const inSymbol = currencyIn?.symbol
      setFlowState(state => ({
        ...state,
        attemptingTxn: true,
        showConfirm: true,
        pendingText: t`Wrapping ${amount} ${inSymbol} to ${amount} ${wethSymbol}`,
      }))
      const hash = await onWrap?.()
      hash && setTxHashWrapped(hash)
      setFlowState(state => ({ ...state, showConfirm: false }))
    } catch (error) {
      handleError(error)
    }
  }

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const refreshActiveMakingAmount = useCallback(() => {
    try {
      getActiveMakingAmount()
    } catch (error) {}
  }, [getActiveMakingAmount])

  useEffect(() => {
    if (!isEdit || !orderInfo?.id) return
    setOrderEditing({
      orderId: orderInfo.id,
      account,
      chainId,
      currencyIn,
      currencyOut,
      inputAmount,
      outputAmount,
      expiredAt,
      nativeOutput: currencyOut?.isNative || false,
    })
  }, [
    setOrderEditing,
    account,
    chainId,
    currencyIn,
    currencyOut,
    inputAmount,
    outputAmount,
    expiredAt,
    orderInfo?.id,
    isEdit,
  ])

  // use ref to prevent too many api call when firebase update status
  const refSubmitCreateOrder = useRef(onSubmitCreateOrder)
  refSubmitCreateOrder.current = onSubmitCreateOrder
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!account) return
    // call when cancel expired/cancelled
    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, data => {
      data?.orders.forEach(order => {
        const findInfo = ordersNeedCreated.find(e => e.orderId === order.id)
        if (!findInfo?.orderId) return
        removeOrderNeedCreated(findInfo.orderId)
        // when cancel order success => create a new order
        if (order.isSuccessful && !isEdit) {
          refSubmitCreateOrder.current(findInfo)
        }
      })
      refreshActiveMakingAmount()
    })
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, refreshActiveMakingAmount)
    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
    }
  }, [account, chainId, ordersNeedCreated, removeOrderNeedCreated, refreshActiveMakingAmount, isEdit])

  const autoFillMarketPrice = useRef(false)
  useEffect(() => {
    if (tradeInfo && !autoFillMarketPrice.current && !loadingTrade && !defaultRate?.rate) {
      autoFillMarketPrice.current = true
      setPriceRateMarket(true)
    }
  }, [tradeInfo, setPriceRateMarket, loadingTrade, defaultRate?.rate])

  const trackingTouchInput = useCallback(() => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter amount box')
  }, [trackingHandler])

  const trackingPriceSetOnBlur = useCallback(() => {
    if (!displayRate || !currencyIn || !currencyOut) return
    trackingHandler(TRACKING_EVENT_TYPE.LO_PRICE_SET, {
      side: rateInfo.invert ? 'buy' : 'sell',
      limit_price: displayRate,
      market_price: tradeInfo ? removeTrailingZero(tradeInfo.marketRate.toFixed(16)) : undefined,
      price_difference_pct: deltaRate.rawPercent ? Number(deltaRate.rawPercent) : undefined,
      from_token: currencyIn.symbol,
      to_token: currencyOut.symbol,
      chain: networkInfo.name,
    })
  }, [
    displayRate,
    currencyIn,
    currencyOut,
    rateInfo.invert,
    tradeInfo,
    deltaRate.rawPercent,
    networkInfo.name,
    trackingHandler,
  ])

  const trackingTouchSelectToken = useCallback(() => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter token box')
  }, [trackingHandler])

  const trackingPlaceOrder = (type: TRACKING_EVENT_TYPE, data = {}) => {
    trackingHandler(type, {
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      from_network: networkInfo.name,
      trade_qty: inputAmount,
      ...data,
    })
  }

  const onSubmitCreateOrderWithTracking = async () => {
    trackingPlaceOrder(TRACKING_EVENT_TYPE.LO_CLICK_PLACE_ORDER)
    const order_id = await onSubmitCreateOrder({
      currencyIn,
      currencyOut,
      chainId,
      account,
      inputAmount,
      outputAmount,
      expiredAt,
      nativeOutput: currencyOut?.isNative || false,
    })
    if (order_id) {
      trackingPlaceOrder(TRACKING_EVENT_TYPE.LO_PLACE_ORDER_SUCCESS, { order_id })
      trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_PLACED, {
        side: rateInfo.invert ? 'buy' : 'sell',
        from_token: currencyIn?.symbol,
        from_token_address: getTokenAddress(currencyIn),
        to_token: currencyOut?.symbol,
        to_token_address: getTokenAddress(currencyOut),
        pair: currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
        limit_price: displayRate,
        market_price: tradeInfo ? removeTrailingZero(tradeInfo.marketRate.toFixed(16)) : undefined,
        price_difference_pct: deltaRate.rawPercent ? Number(deltaRate.rawPercent) : undefined,
        amount_in: inputAmount,
        amount_in_usd: estimateUSD.rawInput || undefined,
        amount_out_estimated: outputAmount,
        expiry: displayTime,
        chain: networkInfo.name,
        order_id,
        volume: estimateUSD.rawInput || undefined,
      })
    }
  }

  const styleTooltip = { maxWidth: '250px', zIndex: zIndexToolTip }
  const estimateUSD = useMemo(() => {
    return calcUsdPrices({
      inputAmount,
      outputAmount,
      priceUsdIn: tradeInfo?.priceUsdIn,
      priceUsdOut: tradeInfo?.priceUsdOut,
      currencyIn,
      currencyOut,
    })
  }, [inputAmount, outputAmount, tradeInfo, currencyIn, currencyOut])

  const showApproveFlow =
    !checkingAllowance &&
    !showWrap &&
    !isNotFillAllInput &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      !enoughAllowance ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const warningMessage = useWarningCreateOrder({
    estimateUSD: estimateUSD.rawInput,
    currencyIn,
    outputAmount,
    displayRate,
    deltaRate,
    missingAllowance,
  })

  useImperativeHandle(ref, () => ({
    hasChangedOrderInfo() {
      return (
        isEdit &&
        !hasInputError &&
        (defaultInputAmount !== inputAmount ||
          defaultRate?.rate !== rateInfo.rate ||
          defaultExpire?.getTime() !== expiredAt)
      )
    },
  }))

  const renderActionBtn = () =>
    chainId !== walletChainId ? (
      <ButtonLight onClick={() => changeNetwork(chainId)}>
        <Trans>Switch to {NETWORKS_INFO[chainId].name}</Trans>
      </ButtonLight>
    ) : (
      <ActionButtonLimitOrder
        {...{
          currencyIn,
          currencyOut,
          approval,
          showWrap,
          isWrappingEth,
          isNotFillAllInput,
          approvalSubmitted,
          hasInputError,
          enoughAllowance,
          checkingAllowance,
          wrapInputError,
          approveCallback,
          onWrapToken,
          showPreview,
          showApproveFlow,
          showWarning: warningMessage.length > 0,
          editOrderInfo,
        }}
      />
    )
  const renderConfirmModal = (showConfirmContent = false) => (
    <ConfirmOrderModal
      {...{
        onDismiss: hidePreview,
        onSubmit: onSubmitCreateOrderWithTracking,
        flowState,
        currencyIn,
        currencyOut,
        inputAmount,
        outputAmount,
        expiredAt,
        rateInfo,
        note,
        editOrderInfo,
        warningMessage,
        marketPrice: tradeInfo,
        showConfirmContent,
        percentDiff: Number(deltaRate.rawPercent),
      }}
    />
  )

  if (isEdit && flowState.showConfirm)
    return (
      <>
        {renderConfirmModal(true)}
        {renderActionBtn()}
      </>
    )
  return (
    <>
      <div className="flex flex-col gap-4">
        {useUrlParams ? <NetworkSelector chainId={chainId} /> : null}
        <Tooltip
          text={inputError}
          show={!!inputError}
          placement="top"
          style={styleTooltip}
          width="fit-content"
          dataTestId="error-message"
        >
          <CurrencyInputPanel
            error={!!inputError}
            value={inputAmount}
            positionMax="top"
            onUserInput={onSetInput}
            onMax={handleMaxInput}
            onHalf={null}
            otherCurrency={currencyOut}
            estimatedUsd={estimateUSD.input}
            onFocus={trackingTouchInput}
            onCurrencySelect={handleInputSelect}
            currency={currencyIn}
            showCommonBases
            id="create-limit-order-input-tokena"
            dataTestId="limit-order-input-tokena"
            maxCurrencySymbolLength={6}
            filterWrap
            onClickSelect={trackingTouchSelectToken}
            lockIcon={showApproveFlow}
            disableCurrencySelect={isEdit}
            label={
              <Label>
                <Trans>You Sell</Trans>
              </Label>
            }
            positionLabel="in"
            customChainId={chainId}
          />
        </Tooltip>

        <RowBetween gap="1rem" flexDirection={upToSmall ? 'column' : 'row'}>
          <InputWrapper>
            <div className="flex items-center justify-between">
              <DeltaRate
                invert={rateInfo.invert}
                symbol={(rateInfo.invert ? currencyOut?.symbol : currencyIn?.symbol) ?? ''}
                marketPrice={tradeInfo}
                rateInfo={rateInfo}
              />
              {tradeInfo && (
                <Set2Market onClick={() => setPriceRateMarket()}>
                  <Trans>Market</Trans>
                </Set2Market>
              )}
            </div>
            <div className="flex items-center rounded-xl bg-buttonBlack">
              <NumericalInput
                maxLength={50}
                style={{ fontSize: 14, height: INPUT_HEIGHT }}
                data-testid="input-selling-rate"
                value={displayRate}
                onUserInput={onChangeRate}
                onFocus={trackingTouchInput}
                onBlur={trackingPriceSetOnBlur}
              />
              {currencyIn && currencyOut && (
                <div className="flex cursor-pointer gap-1.5" onClick={() => onInvertRate(!rateInfo.invert)}>
                  <CurrencyLogo size={'18px'} currency={rateInfo.invert ? currencyIn : currencyOut} />
                  <span className="select-none text-sm text-subText">
                    {rateInfo.invert ? currencyIn?.symbol : currencyOut?.symbol}
                  </span>
                  <div>
                    <Repeat color={theme.subText} size={12} />
                  </div>
                </div>
              )}
            </div>
          </InputWrapper>
        </RowBetween>

        <RowBetween>
          {currencyIn && currencyOut ? (
            <TradePrice
              price={tradeInfo}
              style={{ width: 'fit-content', fontStyle: 'italic' }}
              color={theme.text}
              label={t`Est. Market Price:`}
              loading={loadingTrade}
              symbolIn={currencyIn?.symbol}
              symbolOut={currencyOut?.symbol}
            />
          ) : (
            <div />
          )}
          <ArrowRotate
            rotate={rotate}
            onClick={isEdit ? undefined : handleRotateClick}
            style={{ width: 25, height: 25, padding: 4, background: theme.buttonGray }}
          />
        </RowBetween>

        <Tooltip text={outPutError} show={!!outPutError} placement="top" style={styleTooltip} width="fit-content">
          <CurrencyInputPanel
            maxLength={16}
            value={outputAmount}
            error={!!outPutError}
            currency={currencyOut}
            onUserInput={onSetOutput}
            otherCurrency={currencyIn}
            onMax={null}
            onHalf={null}
            estimatedUsd={estimateUSD.output}
            onFocus={trackingTouchInput}
            id="create-limit-order-input-tokenb"
            dataTestId="limit-order-input-tokenb"
            onCurrencySelect={handleOutputSelect}
            positionMax="top"
            showCommonBases
            maxCurrencySymbolLength={6}
            filterWrap
            onClickSelect={trackingTouchSelectToken}
            disableCurrencySelect={isEdit}
            label={
              <Label>
                <Trans>You Buy</Trans>
              </Label>
            }
            positionLabel="in"
            customChainId={chainId}
          />
        </Tooltip>

        <div>
          <div className="flex items-center gap-1">
            <TextDashed
              color={theme.subText}
              fontSize={12}
              fontWeight={500}
              className="flex h-fit items-center leading-none"
            >
              <MouseoverTooltip
                placement="right"
                text={t`Once an order expires, it will be cancelled automatically. No gas fees will be charged.`}
              >
                <Trans>Expires in</Trans>
              </MouseoverTooltip>
            </TextDashed>
            <div className="flex cursor-pointer items-center gap-1" role="button" onClick={() => setExpanded(e => !e)}>
              <span className="text-sm font-medium leading-none text-text">{displayTime}</span>
              <DropdownIcon data-flip={expanded} />
            </div>
          </div>

          <div className={cn('flex overflow-hidden transition-all duration-100', expanded ? 'h-9 pt-2' : 'h-0 pt-0')}>
            <div className="flex h-7 w-full max-w-full justify-between rounded-[20px] bg-tabBackground p-0.5">
              {[...getExpireOptions(), { label: 'Custom', onSelect: toggleDatePicker }].map((item: any) => {
                return (
                  <DefaultSlippageOption
                    key={item.label}
                    onClick={() => {
                      if (item.label === 'Custom') item.onSelect()
                      else onChangeExpire(item.value)
                    }}
                    data-active={customDateExpire ? item.label === 'Custom' : item.value === expire}
                  >
                    {item.label}
                  </DefaultSlippageOption>
                )
              })}
            </div>
          </div>
        </div>

        {warningMessage.map((mess, i) => (
          <ErrorWarningPanel type="warn" key={i} title={mess} />
        ))}

        {renderActionBtn()}
      </div>

      {renderConfirmModal()}

      <ExpirePicker
        defaultDate={customDateExpire}
        expire={expire}
        isOpen={showDatePicker}
        onDismiss={toggleDatePicker}
        onSetDate={onChangeExpire}
      />
    </>
  )
})

export default memo(LimitOrderForm)
