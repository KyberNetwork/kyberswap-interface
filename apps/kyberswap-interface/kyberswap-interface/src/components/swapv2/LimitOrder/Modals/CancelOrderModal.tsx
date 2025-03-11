import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'

import Logo from 'components/Logo'
import Modal from 'components/Modal'
import { useEstimateFee, useProcessCancelOrder } from 'components/swapv2/LimitOrder/ListOrder/useRequestCancelOrder'
import CancelButtons from 'components/swapv2/LimitOrder/Modals/CancelButtons'
import CancelStatusCountDown from 'components/swapv2/LimitOrder/Modals/CancelStatusCountDown'
import useAllActiveOrders, { useIsSupportSoftCancelOrder } from 'components/swapv2/LimitOrder/useFetchActiveAllOrders'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { TransactionFlowState } from 'types/TransactionFlowState'

import { calcPercentFilledOrder, formatAmountOrder } from '../helpers'
import { CancelOrderFunction, CancelOrderType, LimitOrder, LimitOrderStatus } from '../type'
import { Container, Header, Label, ListInfo, Note, Rate, Value } from './styled'

export enum CancelStatus {
  WAITING,
  COUNTDOWN,
  TIMEOUT,
  CANCEL_DONE,
}

const styleLogo = { width: 20, height: 20 }
function CancelOrderModal({
  isCancelAll,
  customChainId,
  order,
  onSubmit,
  onDismiss,
  flowState,
  isOpen,
}: {
  isCancelAll: boolean
  customChainId?: ChainId
  order: LimitOrder | undefined
  onSubmit: CancelOrderFunction
  onDismiss: () => void
  flowState: TransactionFlowState
  isOpen: boolean
}) {
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

  const {
    orders = [],
    ordersSoftCancel = [],
    supportCancelGaslessAllOrders,
  } = useAllActiveOrders(!isCancelAll, customChainId)

  const isOrderSupportGaslessCancel = useIsSupportSoftCancelOrder()
  const { orderSupportGasless, chainSupportGasless } = isOrderSupportGaslessCancel(order)

  const supportGasLessCancel = isCancelAll ? supportCancelGaslessAllOrders : orderSupportGasless

  const { onClickGaslessCancel, onClickHardCancel, expiredTime, cancelStatus, setCancelStatus } = useProcessCancelOrder(
    {
      isOpen,
      onDismiss,
      onSubmit,
      getOrders: (gasLessCancel: boolean) =>
        isCancelAll ? (gasLessCancel ? ordersSoftCancel : orders) : order ? [order] : [],
    },
  )
  const [cancelType, setCancelType] = useState(CancelOrderType.GAS_LESS_CANCEL)
  useEffect(() => {
    setCancelType(supportGasLessCancel ? CancelOrderType.GAS_LESS_CANCEL : CancelOrderType.HARD_CANCEL)
  }, [supportGasLessCancel])

  const isCancelDone = cancelStatus === CancelStatus.CANCEL_DONE
  const isWaiting = cancelStatus === CancelStatus.WAITING

  const renderContentCancelAll = () => {
    if (!isWaiting) return null
    return (
      <Label>
        {orders.length === 1 ? (
          <Trans>Are you sure you want to cancel this limit order?</Trans>
        ) : (
          <Trans>Are you sure you want to cancel {orders.length} limit orders?</Trans>
        )}
      </Label>
    )
  }
  const listData = useMemo(() => {
    return !order
      ? []
      : [
          {
            label: t`I pay`,
            content: (
              <Value>
                <Logo srcs={[makerAssetLogoURL]} style={styleLogo} />
                <Text>
                  {formatAmountOrder(makingAmount, makerAssetDecimals)} {makerAssetSymbol}
                </Text>
              </Value>
            ),
          },
          {
            label: t`and receive`,
            content: (
              <Value>
                <Logo srcs={[takerAssetLogoURL]} style={styleLogo} />
                <Text>
                  {formatAmountOrder(takingAmount, takerAssetDecimals)} {takerAssetSymbol}
                </Text>
              </Value>
            ),
          },
          {
            label: t`at`,
            content: <Rate order={order} />,
          },
        ]
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

  const formatOrders = useMemo(() => (isCancelAll ? orders : order ? [order] : []), [order, isCancelAll, orders])
  const estimateGas = useEstimateFee({ orders: formatOrders, isCancelAll })
  const disabledGasLessCancel = !supportGasLessCancel || flowState.attemptingTxn
  const disabledHardCancel = flowState.attemptingTxn
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

  return (
    <Modal maxWidth={isCancelAll && !isCancelDone ? 540 : 480} isOpen={isOpen} onDismiss={onDismiss}>
      <Container>
        <Header title={isCancelAll ? t`Bulk Cancellation` : t`Cancel an order`} onDismiss={onDismiss} />
        {isCancelAll ? (
          renderContentCancelAll()
        ) : (
          <ListInfo
            title={t`I want to cancel my order where`}
            listData={listData}
            marketPrice={marketPrice}
            symbolIn={makerAssetSymbol}
            symbolOut={takerAssetSymbol}
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
          flowState={flowState}
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
            disabledConfirm: flowState.attemptingTxn || (disabledGasLessCancel && disabledHardCancel),
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
