import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'react-feather'
import { useGetLOConfigQuery } from 'services/limitOrder'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import CancelButtons from 'components/LimitOrder/CancelOrder/CancelButtons'
import CancelStatusCountDown from 'components/LimitOrder/CancelOrder/CancelStatusCountDown'
import { useCancelOrder } from 'components/LimitOrder/CancelOrder/useCancelOrder'
import MarketPrice from 'components/LimitOrder/Form/MarketPrice'
import { useLimitOrderChainId } from 'components/LimitOrder/LimitOrderContext'
import { OrderSummary } from 'components/LimitOrder/components'
import { formatAmountOrder, getErrorMessage, getPayloadTracking } from 'components/LimitOrder/helpers'
import { CancelOrderType, LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { CloseIcon } from 'theme/components'
import { formatDisplayNumber } from 'utils/numbers'

const EMPTY_ORDERS: LimitOrder[] = []

enum CancelStatus {
  WAITING,
  COUNTDOWN,
  CANCEL_DONE,
}

const useIsSupportSoftCancelOrder = (chainId: ChainId) => {
  const { currentData: config } = useGetLOConfigQuery(chainId)
  return useCallback(
    (order: LimitOrder | undefined) => {
      const features = config?.features || {}
      const orderSupportGasless = !!features?.[order?.contractAddress?.toLowerCase?.() ?? '']?.supportDoubleSignature
      const chainSupportGasless = Object.values(features).some(e => e.supportDoubleSignature)
      return { orderSupportGasless, chainSupportGasless }
    },
    [config],
  )
}

type CancelOrderModalProps = {
  isOpen: boolean
  onDismiss?: () => void
  isCancelAll: boolean
  orders?: LimitOrder[]
  onOrdersCancelling?: (orderIds: number[]) => void
}

const getCancelStatusByExpiredTime = (expiredTime: number) =>
  expiredTime * 1000 < Date.now() ? CancelStatus.CANCEL_DONE : CancelStatus.COUNTDOWN

const getCancellingExpiredTime = (order: LimitOrder | undefined) =>
  order?.status === LimitOrderStatus.CANCELLING ? order.operatorSignatureExpiredAt ?? 0 : 0

const OrderAmount = ({
  logo,
  amount,
  decimals,
  symbol,
}: {
  logo: string
  amount: string
  decimals: number
  symbol: string
}) => (
  <div className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-medium text-text">
    <Logo srcs={[logo]} style={{ width: 20, height: 20 }} />
    <span>
      {formatAmountOrder(amount, decimals)} {symbol}
    </span>
  </div>
)

const SingleOrderSummary = ({ order }: { order: LimitOrder | undefined }) => {
  const chainId = useLimitOrderChainId(order?.chainId)
  const currencyIn = useCurrencyV2(order?.makerAsset, chainId) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset, chainId) || undefined
  const { tradeInfo: marketPrice } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)

  if (!order) return null

  const {
    takerAssetLogoURL,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    makingAmount,
    takingAmount,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order

  const native = NativeCurrencies[Number(order.chainId) as ChainId]
  const isNative = order.nativeOutput && takerAssetSymbol.toLowerCase() === native?.wrapped.symbol?.toLowerCase()
  const takerSymbol = isNative ? native?.symbol || takerAssetSymbol : takerAssetSymbol
  const takerLogo = isNative ? NETWORKS_INFO[order.chainId]?.nativeToken.logo || takerAssetLogoURL : takerAssetLogoURL

  return (
    <OrderSummary
      inputCurrency={
        <OrderAmount
          logo={makerAssetLogoURL}
          amount={makingAmount}
          decimals={makerAssetDecimals}
          symbol={makerAssetSymbol}
        />
      }
      outputCurrency={
        <OrderAmount logo={takerLogo} amount={takingAmount} decimals={takerAssetDecimals} symbol={takerSymbol} />
      }
      order={order}
      marketRate={<MarketPrice price={marketPrice} symbolIn={makerAssetSymbol} symbolOut={takerAssetSymbol} />}
    />
  )
}

const CancelOrderModal = ({
  isOpen,
  onDismiss,
  isCancelAll,
  orders = EMPTY_ORDERS,
  onOrdersCancelling,
}: CancelOrderModalProps) => {
  const order = orders[0]
  const chainId = useLimitOrderChainId(order?.chainId)

  const [expiredTime, setExpiredTime] = useState(0)
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>(CancelStatus.WAITING)
  const [cancelType, setCancelType] = useState(CancelOrderType.GAS_LESS_CANCEL)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const requestController = useRef(new AbortController())

  const { networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()

  const getGaslessSupport = useIsSupportSoftCancelOrder(chainId)
  const { orderSupportGasless, chainSupportGasless } = getGaslessSupport(order)

  const gaslessCancelableOrders = useMemo(
    () => orders.filter(order => getGaslessSupport(order).orderSupportGasless),
    [getGaslessSupport, orders],
  )

  const supportsGaslessCancel = isCancelAll ? gaslessCancelableOrders.length > 0 : orderSupportGasless
  const cancellingExpiredTime = getCancellingExpiredTime(order)
  const { estimateGas, onCancelOrder } = useCancelOrder({ chainId, orders, isCancelAll })

  const resetCancelProgress = useCallback(() => {
    setExpiredTime(0)
    setCancelStatus(CancelStatus.WAITING)
  }, [])

  const getOrdersByCancelType = useCallback(
    (type: CancelOrderType) =>
      isCancelAll && type === CancelOrderType.GAS_LESS_CANCEL ? gaslessCancelableOrders : orders,
    [gaslessCancelableOrders, isCancelAll, orders],
  )

  const handleCancel = useCallback(
    async (type: CancelOrderType) => {
      const signal = requestController.current.signal
      const gaslessCancel = type === CancelOrderType.GAS_LESS_CANCEL

      try {
        setAttemptingTxn(true)
        setErrorMessage('')

        const cancelOrders = getOrdersByCancelType(type)
        const data = await onCancelOrder({
          orders: cancelOrders,
          isCancelAll,
          cancelType: type,
        })
        if (signal.aborted) return

        onOrdersCancelling?.(cancelOrders.map(order => order.id))

        if (!gaslessCancel) {
          setExpiredTime(0)
          setCancelStatus(CancelStatus.CANCEL_DONE)
          return
        }

        const expired = data?.orders?.[0]?.operatorSignatureExpiredAt
        if (!expired) {
          setExpiredTime(0)
          setCancelStatus(CancelStatus.CANCEL_DONE)
          return
        }

        setExpiredTime(expired)
        setCancelStatus(getCancelStatusByExpiredTime(expired))
      } catch (error) {
        if (!signal.aborted) {
          setErrorMessage(getErrorMessage(error))
        }
      } finally {
        if (!signal.aborted) {
          setAttemptingTxn(false)
        }
      }
    },
    [getOrdersByCancelType, isCancelAll, onCancelOrder, onOrdersCancelling],
  )

  const handleHardCancel = useCallback(() => handleCancel(CancelOrderType.HARD_CANCEL), [handleCancel])
  const handleConfirm = useCallback(() => handleCancel(cancelType), [cancelType, handleCancel])
  const handleCountdownEnd = useCallback(() => setCancelStatus(CancelStatus.CANCEL_DONE), [])
  const handleChangeCancelType = useCallback(
    (type: CancelOrderType) => {
      setCancelType(type)
      setErrorMessage('')
      if (!order || isCancelAll) return

      trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_CANCEL_TYPE, {
        ...getPayloadTracking(order, NETWORKS_INFO[order.chainId]?.name || networkInfo.name),
        cancel_type: type === CancelOrderType.GAS_LESS_CANCEL ? 'Gasless' : 'Hard',
      })
    },
    [isCancelAll, networkInfo.name, order, trackingHandler],
  )

  useEffect(() => {
    setAttemptingTxn(false)
    setErrorMessage('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      resetCancelProgress()
    }

    return () => {
      requestController.current.abort()
      requestController.current = new AbortController()
    }
  }, [isOpen, resetCancelProgress])

  useEffect(() => {
    resetCancelProgress()
  }, [chainId, resetCancelProgress])

  useEffect(() => {
    if (!isOpen || isCancelAll || !cancellingExpiredTime) return

    setExpiredTime(cancellingExpiredTime)
    setCancelStatus(getCancelStatusByExpiredTime(cancellingExpiredTime))
  }, [cancellingExpiredTime, isCancelAll, isOpen])

  useEffect(() => {
    setCancelType(supportsGaslessCancel ? CancelOrderType.GAS_LESS_CANCEL : CancelOrderType.HARD_CANCEL)
  }, [supportsGaslessCancel])

  const isCountDown = cancelStatus === CancelStatus.COUNTDOWN
  const isCancelDone = cancelStatus === CancelStatus.CANCEL_DONE

  const disabledBecauseNoOrders = isCancelAll && !orders.length
  const disabledGasLessCancel = !supportsGaslessCancel || attemptingTxn || disabledBecauseNoOrders
  const disabledHardCancel = attemptingTxn || disabledBecauseNoOrders
  const disabledConfirm = attemptingTxn || disabledBecauseNoOrders || (disabledGasLessCancel && disabledHardCancel)

  const cancelGaslessText = isCancelAll ? (
    gaslessCancelableOrders.length === orders.length || !supportsGaslessCancel ? (
      <Trans>Gasless Cancel All Orders</Trans>
    ) : (
      <Trans>
        Gasless Cancel {gaslessCancelableOrders.length}/{orders.length} Orders
      </Trans>
    )
  ) : (
    <Trans>Gasless Cancel</Trans>
  )

  const gasAmountDisplay = estimateGas
    ? formatDisplayNumber(estimateGas, { style: 'currency', significantDigits: 4 })
    : ''

  const errorLine = <div className="min-h-4 text-xs leading-4 text-red">{errorMessage}</div>

  return (
    <Modal maxWidth={480} isOpen={isOpen} onDismiss={onDismiss} borderRadius={14}>
      <Stack className="w-full gap-5 p-5 max-sm:p-4">
        <HStack className="items-center justify-between gap-4">
          <span className="text-xl font-medium leading-tight text-text">
            {isCancelAll ? t`Bulk Cancellation` : t`Cancel an order`}
          </span>
          <CloseIcon onClick={onDismiss} />
        </HStack>

        <Stack className="gap-4">
          <Stack className="gap-3">
            <div className="text-sm font-medium text-subText">
              {isCancelAll ? (
                <Trans>You are canceling {orders.length} active orders</Trans>
              ) : (
                <Trans>I want to cancel my order where</Trans>
              )}
            </div>
            {!isCancelAll && <SingleOrderSummary order={order} />}
          </Stack>

          {isCancelDone ? (
            <Stack className="gap-3">
              <div className="flex items-center gap-1 text-sm text-primary">
                <Check size={16} />
                <Trans>Order has been successfully cancelled.</Trans>
              </div>
              <ButtonOutlined onClick={onDismiss}>
                <Trans>Close</Trans>
              </ButtonOutlined>
            </Stack>
          ) : isCountDown ? (
            <Stack className="gap-3">
              <CancelStatusCountDown expiredTime={expiredTime} onCountdownEnd={handleCountdownEnd} />

              <CancelButtons
                readOnly
                value={CancelOrderType.HARD_CANCEL}
                gasless={undefined}
                hard={{ title: <Trans>Hard Cancel Instead</Trans>, disabled: disabledHardCancel }}
                gasAmountDisplay={gasAmountDisplay}
                onChange={handleChangeCancelType}
              />

              {errorLine}
              <HStack className="gap-3 max-sm:flex-col">
                <ButtonOutlined className="flex-1" onClick={onDismiss}>
                  <Trans>Close</Trans>
                </ButtonOutlined>
                <Stack className="flex-1 gap-1">
                  <ButtonPrimary disabled={disabledHardCancel} onClick={handleHardCancel}>
                    <Dots absolute loading={attemptingTxn}>
                      <Trans>Hard Cancel</Trans>
                    </Dots>
                  </ButtonPrimary>
                </Stack>
              </HStack>
            </Stack>
          ) : (
            <Stack className="gap-3">
              <CancelButtons
                value={cancelType}
                gasless={{
                  title: cancelGaslessText,
                  disabled: disabledGasLessCancel,
                  chainSupport: chainSupportGasless,
                  orderSupport: supportsGaslessCancel,
                }}
                hard={{
                  title: isCancelAll ? <Trans>Hard Cancel All Orders</Trans> : <Trans>Hard Cancel</Trans>,
                  disabled: disabledHardCancel,
                }}
                gasAmountDisplay={gasAmountDisplay}
                onChange={handleChangeCancelType}
              />

              {errorLine}
              <ButtonPrimary disabled={disabledConfirm} onClick={handleConfirm}>
                <Dots absolute loading={attemptingTxn}>
                  {isCancelAll ? <Trans>Cancel All Orders</Trans> : <Trans>Cancel Order</Trans>}
                </Dots>
              </ButtonPrimary>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Modal>
  )
}

export default CancelOrderModal
