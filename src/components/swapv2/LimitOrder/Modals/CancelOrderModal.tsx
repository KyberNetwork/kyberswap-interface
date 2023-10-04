import { Trans, t } from '@lingui/macro'
import { useMemo } from 'react'
import { Text } from 'rebass'

import Logo from 'components/Logo'
import Modal from 'components/Modal'
import { useEstimateFee, useProcessCancelOrder } from 'components/swapv2/LimitOrder/ListOrder/useRequestCancelOrder'
import CancelButtons from 'components/swapv2/LimitOrder/Modals/CancelButtons'
import CancelStatusCountDown from 'components/swapv2/LimitOrder/Modals/CancelStatusCountDown'
import useAllActiveOrders, { useIsSupportSoftCancelOrder } from 'components/swapv2/LimitOrder/useFetchActiveAllOrders'
import { useCurrencyV2 } from 'hooks/Tokens'
import { TransactionFlowState } from 'types/TransactionFlowState'

import { useBaseTradeInfoLimitOrder } from '../../../../hooks/useBaseTradeInfo'
import { calcPercentFilledOrder, formatAmountOrder } from '../helpers'
import { CancelOrderFunction, LimitOrder, LimitOrderStatus } from '../type'
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
  order,
  onSubmit,
  onDismiss,
  flowState,
  isOpen,
}: {
  isCancelAll: boolean
  order: LimitOrder | undefined
  onSubmit: CancelOrderFunction
  onDismiss: () => void
  flowState: TransactionFlowState
  isOpen: boolean
}) {
  const currencyIn = useCurrencyV2(order?.makerAsset) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset) || undefined
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
  } = useAllActiveOrders(false && !isCancelAll)

  const isOrderSupportGaslessCancel = useIsSupportSoftCancelOrder()

  const supportGasLessCancel = isCancelAll ? supportCancelGaslessAllOrders : isOrderSupportGaslessCancel(order)

  const { onClickGaslessCancel, onClickHardCancel, expiredTime, cancelStatus, setCancelStatus } = useProcessCancelOrder(
    {
      isOpen,
      onDismiss,
      onSubmit,
      getOrders: (gasLessCancel: boolean) =>
        isCancelAll ? (gasLessCancel ? ordersSoftCancel : orders) : order ? [order] : [],
    },
  )

  const isCancelDone = cancelStatus === CancelStatus.CANCEL_DONE

  const renderContentCancelAll = () => {
    return (
      <Label>
        <Trans>Are you sure you want to cancel {orders.length} limit orders?</Trans>
      </Label>
    )
  }
  const listData = useMemo(() => {
    return !order
      ? []
      : [
          {
            label: t`I want to cancel my order where`,
            content: <Value />,
          },
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
  return (
    <Modal maxWidth={isCancelAll && !isCancelDone ? 540 : 480} isOpen={isOpen} onDismiss={onDismiss}>
      <Container>
        <Header title={isCancelAll ? t`Bulk Cancellation` : t`Cancel an order`} onDismiss={onDismiss} />
        {isCancelAll ? (
          renderContentCancelAll()
        ) : (
          <ListInfo
            listData={listData}
            marketPrice={marketPrice}
            symbolIn={makerAssetSymbol}
            symbolOut={takerAssetSymbol}
          />
        )}
        <Note
          note={
            status === LimitOrderStatus.PARTIALLY_FILLED
              ? t`Note: Your currently existing order is ${calcPercentFilledOrder(
                  filledTakingAmount,
                  takingAmount,
                  takerAssetDecimals,
                )}% filled`
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
          estimateGas={estimateGas}
          supportCancelGasless={supportGasLessCancel}
          loading={flowState.attemptingTxn}
          cancelStatus={cancelStatus}
          onOkay={onDismiss}
          onClickGaslessCancel={onClickGaslessCancel}
          onClickHardCancel={onClickHardCancel}
          isCancelAll={isCancelAll}
          totalOrder={
            isCancelAll ? (
              ordersSoftCancel.length === orders.length || !supportGasLessCancel ? (
                <Trans>Gasless Cancel All Orders</Trans>
              ) : (
                <Trans>
                  Gasless Cancel {ordersSoftCancel.length}/{orders.length} Orders
                </Trans>
              )
            ) : null
          }
        />
      </Container>
    </Modal>
  )
}

export default CancelOrderModal
