import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'

import CancelButtons from 'components/LimitOrder/CancelOrder/CancelButtons'
import CancelStatusCountDown from 'components/LimitOrder/CancelOrder/CancelStatusCountDown'
import {
  useAllActiveOrders,
  useIsSupportSoftCancelOrder,
} from 'components/LimitOrder/CancelOrder/hooks/useFetchActiveAllOrders'
import {
  useEstimateFee,
  useProcessCancelOrder,
  useRequestCancelOrder,
} from 'components/LimitOrder/CancelOrder/hooks/useRequestCancelOrder'
import MarketPrice from 'components/LimitOrder/Form/MarketPrice'
import { Container, Header, Label, Note, OrderSummary, Value } from 'components/LimitOrder/Modals/components'
import { calcPercentFilledOrder, formatAmountOrder } from 'components/LimitOrder/helpers'
import { CancelOrderType, LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import { NativeCurrencies } from 'constants/tokens'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'

export enum CancelStatus {
  WAITING,
  COUNTDOWN,
  CANCEL_DONE,
}

const styleLogo = { width: 20, height: 20 }
const CancelOrderModal = ({
  isCancelAll,
  customChainId,
  order,
  onDismiss,
  isOpen,
}: {
  isCancelAll: boolean
  customChainId?: ChainId
  order: LimitOrder | undefined
  onDismiss?: () => void
  isOpen: boolean
}) => {
  const currencyIn = useCurrencyV2(order?.makerAsset, customChainId) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset, customChainId) || undefined
  const { tradeInfo: marketPrice } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut)

  const {
    takerAssetLogoURL,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    makingAmount,
    takingAmount,
    filledTakingAmount,
    status,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order ?? ({} as LimitOrder)

  const [expiredTime, setExpiredTime] = useState(0)
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>(CancelStatus.WAITING)
  const [cancelType, setCancelType] = useState(CancelOrderType.GAS_LESS_CANCEL)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    orders = [],
    ordersSoftCancel = [],
    supportCancelGaslessAllOrders,
  } = useAllActiveOrders(!isCancelAll, customChainId)

  const isOrderSupportGaslessCancel = useIsSupportSoftCancelOrder()
  const { orderSupportGasless, chainSupportGasless } = isOrderSupportGaslessCancel(order)

  const supportGasLessCancel = isCancelAll ? supportCancelGaslessAllOrders : orderSupportGasless

  const selectedOrders = useMemo(() => (isCancelAll ? orders : order ? [order] : []), [isCancelAll, order, orders])
  const estimateGas = useEstimateFee({ orders: selectedOrders, isCancelAll })

  const { onCancelOrder } = useRequestCancelOrder({
    orders: selectedOrders,
    isCancelAll,
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
    setExpiredTime,
    setCancelStatus,
    getOrders: (gasLessCancel: boolean) =>
      isCancelAll ? (gasLessCancel ? ordersSoftCancel : orders) : order ? [order] : [],
  })

  useEffect(() => {
    setAttemptingTxn(false)
    setErrorMessage('')
  }, [isOpen])

  useEffect(() => {
    setCancelType(supportGasLessCancel ? CancelOrderType.GAS_LESS_CANCEL : CancelOrderType.HARD_CANCEL)
  }, [supportGasLessCancel])

  const isCancelDone = cancelStatus === CancelStatus.CANCEL_DONE
  const isWaiting = cancelStatus === CancelStatus.WAITING

  const orderSummary = useMemo(() => {
    if (!order) return undefined

    const native = NativeCurrencies[Number(order.chainId) as ChainId]

    const isNative = order.nativeOutput && takerAssetSymbol.toLowerCase() === native?.wrapped.symbol?.toLowerCase()
    const takerSymbol = isNative ? native?.symbol || takerAssetSymbol : takerAssetSymbol

    return {
      inputCurrency: (
        <Value>
          <Logo srcs={[makerAssetLogoURL]} style={styleLogo} />
          <span>
            {formatAmountOrder(makingAmount, makerAssetDecimals)} {makerAssetSymbol}
          </span>
        </Value>
      ),
      outputCurrency: (
        <Value>
          <Logo
            srcs={[isNative ? NETWORKS_INFO[order.chainId]?.nativeToken.logo || takerAssetLogoURL : takerAssetLogoURL]}
            style={styleLogo}
          />
          <span>
            {formatAmountOrder(takingAmount, takerAssetDecimals)} {takerSymbol}
          </span>
        </Value>
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

  const disabledGasLessCancel = !supportGasLessCancel || attemptingTxn
  const disabledHardCancel = attemptingTxn
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

  const percent = calcPercentFilledOrder(filledTakingAmount, takingAmount, takerAssetDecimals)

  const handleDismiss = () => onDismiss?.()

  return (
    <Modal
      maxWidth={isCancelAll && !isCancelDone ? 540 : 480}
      isOpen={isOpen}
      onDismiss={handleDismiss}
      borderRadius={14}
    >
      <Container>
        <Header title={isCancelAll ? t`Bulk Cancellation` : t`Cancel an order`} onDismiss={onDismiss} />
        {isCancelAll && isWaiting ? (
          <Label className="rounded-xl border border-darkBorder bg-white-04 px-4 py-3 text-text">
            {orders.length === 1 ? (
              <Trans>Are you sure you want to cancel this limit order?</Trans>
            ) : (
              <Trans>Are you sure you want to cancel {orders.length} limit orders?</Trans>
            )}
          </Label>
        ) : isCancelAll ? null : (
          <OrderSummary
            title={t`I want to cancel my order where`}
            inputCurrency={orderSummary?.inputCurrency}
            outputCurrency={orderSummary?.outputCurrency}
            order={order}
            marketRate={<MarketPrice price={marketPrice} symbolIn={makerAssetSymbol} symbolOut={takerAssetSymbol} />}
          />
        )}
        <Note
          note={
            status === LimitOrderStatus.PARTIALLY_FILLED
              ? t`Note: Your currently existing order is ${percent}% filled`
              : ''
          }
        />
        <CancelStatusCountDown
          expiredTime={expiredTime}
          cancelStatus={cancelStatus}
          setCancelStatus={setCancelStatus}
          attemptingTxn={attemptingTxn}
          errorMessage={errorMessage}
        />
        <CancelButtons
          order={order}
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
            disabledConfirm: attemptingTxn || (disabledGasLessCancel && disabledHardCancel),
            confirmBtnText:
              isCancelAll && orders.length > 1 ? <Trans>Cancel Orders</Trans> : <Trans>Cancel Order</Trans>,
          }}
          cancelStatus={cancelStatus}
          onDismiss={onDismiss}
          onClickGaslessCancel={onClickGaslessCancel}
          onClickHardCancel={onClickHardCancel}
        />
      </Container>
    </Modal>
  )
}

export default CancelOrderModal
