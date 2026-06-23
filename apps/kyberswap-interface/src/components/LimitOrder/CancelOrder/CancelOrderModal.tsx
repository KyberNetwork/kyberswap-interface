import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGetLOConfigQuery } from 'services/limitOrder'

import CancelButtons from 'components/LimitOrder/CancelOrder/CancelButtons'
import CancelStatusCountDown from 'components/LimitOrder/CancelOrder/CancelStatusCountDown'
import {
  useEstimateFee,
  useProcessCancelOrder,
  useRequestCancelOrder,
} from 'components/LimitOrder/CancelOrder/hooks/useRequestCancelOrder'
import { CancelStatus } from 'components/LimitOrder/CancelOrder/types'
import MarketPrice from 'components/LimitOrder/Form/MarketPrice'
import { useLimitOrderChainId } from 'components/LimitOrder/LimitOrderContext'
import { OrderSummary } from 'components/LimitOrder/components'
import { formatAmountOrder } from 'components/LimitOrder/helpers'
import { CancelOrderType, LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { NativeCurrencies } from 'constants/tokens'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { CloseIcon } from 'theme/components'

const EMPTY_ORDERS: LimitOrder[] = []

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
}

const CancelOrderModal = ({ isOpen, onDismiss, isCancelAll, orders = EMPTY_ORDERS }: CancelOrderModalProps) => {
  const order = orders[0]
  const chainId = useLimitOrderChainId(order?.chainId)
  const currencyIn = useCurrencyV2(order?.makerAsset, chainId) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset, chainId) || undefined
  const { tradeInfo: marketPrice } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)

  const {
    takerAssetLogoURL,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    makingAmount,
    takingAmount,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order ?? ({} as LimitOrder)

  const [expiredTime, setExpiredTime] = useState(0)
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>(CancelStatus.WAITING)
  const [cancelType, setCancelType] = useState(CancelOrderType.GAS_LESS_CANCEL)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isOrderSupportGaslessCancel = useIsSupportSoftCancelOrder(chainId)
  const { orderSupportGasless, chainSupportGasless } = isOrderSupportGaslessCancel(order)
  const ordersSoftCancel = useMemo(
    () => orders.filter(order => isOrderSupportGaslessCancel(order).orderSupportGasless),
    [isOrderSupportGaslessCancel, orders],
  )

  const supportGasLessCancel = isCancelAll ? ordersSoftCancel.length > 0 : orderSupportGasless

  const estimateGas = useEstimateFee({ orders, isCancelAll, chainId })
  const isGaslessCancellingOrder = order?.status === LimitOrderStatus.CANCELLING
  const operatorSignatureExpiredAt = isGaslessCancellingOrder ? order?.operatorSignatureExpiredAt ?? 0 : 0

  const { onCancelOrder } = useRequestCancelOrder({
    orders,
    isCancelAll,
    chainId,
    onRequestStart: () => {
      setAttemptingTxn(true)
      setErrorMessage('')
    },
    onRequestSuccess: () => {
      setAttemptingTxn(false)
    },
    onRequestError: message => {
      setAttemptingTxn(false)
      setErrorMessage(message)
    },
  })
  const { onClickGaslessCancel, onClickHardCancel } = useProcessCancelOrder({
    isOpen,
    onDismiss,
    onSubmit: onCancelOrder,
    chainId,
    setExpiredTime,
    setCancelStatus,
    getOrders: (gasLessCancel: boolean) => (isCancelAll && gasLessCancel ? ordersSoftCancel : orders),
  })

  useEffect(() => {
    setAttemptingTxn(false)
    setErrorMessage('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || isCancelAll || !operatorSignatureExpiredAt) return

    setExpiredTime(operatorSignatureExpiredAt)
    setCancelStatus(operatorSignatureExpiredAt * 1000 < Date.now() ? CancelStatus.CANCEL_DONE : CancelStatus.COUNTDOWN)
  }, [isCancelAll, isOpen, operatorSignatureExpiredAt])

  useEffect(() => {
    setCancelType(supportGasLessCancel ? CancelOrderType.GAS_LESS_CANCEL : CancelOrderType.HARD_CANCEL)
  }, [supportGasLessCancel])

  const isWaiting = cancelStatus === CancelStatus.WAITING

  const orderSummary = useMemo(() => {
    if (!order) return undefined

    const native = NativeCurrencies[Number(order.chainId) as ChainId]

    const isNative = order.nativeOutput && takerAssetSymbol.toLowerCase() === native?.wrapped.symbol?.toLowerCase()
    const takerSymbol = isNative ? native?.symbol || takerAssetSymbol : takerAssetSymbol

    return {
      inputCurrency: (
        <div className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-medium text-text">
          <Logo srcs={[makerAssetLogoURL]} style={{ width: 20, height: 20 }} />
          <span>
            {formatAmountOrder(makingAmount, makerAssetDecimals)} {makerAssetSymbol}
          </span>
        </div>
      ),
      outputCurrency: (
        <div className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-medium text-text">
          <Logo
            srcs={[isNative ? NETWORKS_INFO[order.chainId]?.nativeToken.logo || takerAssetLogoURL : takerAssetLogoURL]}
            style={{ width: 20, height: 20 }}
          />
          <span>
            {formatAmountOrder(takingAmount, takerAssetDecimals)} {takerSymbol}
          </span>
        </div>
      ),
    }
  }, [
    makerAssetLogoURL,
    makerAssetSymbol,
    makingAmount,
    takerAssetLogoURL,
    takerAssetSymbol,
    takingAmount,
    order,
    makerAssetDecimals,
    takerAssetDecimals,
  ])

  const disabledCancelAll = isCancelAll && !orders.length
  const disabledGasLessCancel = !supportGasLessCancel || attemptingTxn || disabledCancelAll
  const disabledHardCancel = attemptingTxn || disabledCancelAll
  const cancelGaslessText = isCancelAll ? (
    ordersSoftCancel.length === orders.length || !supportGasLessCancel ? (
      <Trans>Gasless Cancel All Orders</Trans>
    ) : (
      <Trans>
        Gasless Cancel {ordersSoftCancel.length}/{orders.length} Orders
      </Trans>
    )
  ) : (
    <Trans>Gasless Cancel</Trans>
  )

  const handleDismiss = () => onDismiss?.()

  return (
    <Modal maxWidth={480} isOpen={isOpen} onDismiss={handleDismiss} borderRadius={14}>
      <Stack className="w-full gap-5 p-5 max-sm:p-4">
        <HStack className="items-center justify-between gap-4">
          <span className="text-xl font-medium leading-tight text-text">
            {isCancelAll ? t`Bulk Cancellation` : t`Cancel an order`}
          </span>
          <CloseIcon onClick={onDismiss} />
        </HStack>

        <Stack className="gap-4">
          {isCancelAll && isWaiting ? (
            <div className="rounded-xl border border-darkBorder bg-white-04 px-4 py-3 text-sm font-medium text-text">
              {orders.length === 1 ? (
                <Trans>Are you sure you want to cancel this limit order?</Trans>
              ) : (
                <Trans>Are you sure you want to cancel {orders.length} limit orders?</Trans>
              )}
            </div>
          ) : isCancelAll ? null : (
            <OrderSummary
              title={t`I want to cancel my order where`}
              inputCurrency={orderSummary?.inputCurrency}
              outputCurrency={orderSummary?.outputCurrency}
              order={order}
              marketRate={<MarketPrice price={marketPrice} symbolIn={makerAssetSymbol} symbolOut={takerAssetSymbol} />}
            />
          )}

          <CancelStatusCountDown
            expiredTime={expiredTime}
            cancelStatus={cancelStatus}
            setCancelStatus={setCancelStatus}
            attemptingTxn={attemptingTxn}
            errorMessage={errorMessage}
          />

          <CancelButtons
            order={isCancelAll ? undefined : order}
            cancelType={cancelType}
            setCancelType={setCancelType}
            estimateGas={estimateGas}
            buttonInfo={{
              orderSupportGasless: supportGasLessCancel,
              chainSupportGasless,
              disabledGasLessCancel,
              disabledHardCancel,
              cancelGaslessText,
              hardCancelGasless: isCancelAll ? <Trans>Hard Cancel All Orders</Trans> : <Trans>Hard Cancel</Trans>,
              disabledConfirm: attemptingTxn || disabledCancelAll || (disabledGasLessCancel && disabledHardCancel),
              confirmBtnText:
                isCancelAll && orders.length > 1 ? <Trans>Cancel Orders</Trans> : <Trans>Cancel Order</Trans>,
            }}
            cancelStatus={cancelStatus}
            onDismiss={onDismiss}
            onClickGaslessCancel={onClickGaslessCancel}
            onClickHardCancel={onClickHardCancel}
          />
        </Stack>
      </Stack>
    </Modal>
  )
}

export default CancelOrderModal
