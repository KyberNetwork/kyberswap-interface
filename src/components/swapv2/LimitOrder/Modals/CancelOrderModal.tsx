import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useMemo, useState } from 'react'
import { Check } from 'react-feather'
import { Text } from 'rebass'

import Logo from 'components/Logo'
import Modal from 'components/Modal'
import CancelButtons from 'components/swapv2/LimitOrder/Modals/CancelButtons'
import CancelCountDown from 'components/swapv2/LimitOrder/Modals/CancelCountDown'
import useFetchActiveAllOrders from 'components/swapv2/LimitOrder/useFetchActiveAllOrders'
import { useCurrencyV2 } from 'hooks/Tokens'
import { TransactionFlowState } from 'types/TransactionFlowState'

import { BaseTradeInfo, useBaseTradeInfoLimitOrder } from '../../../../hooks/useBaseTradeInfo'
import { calcPercentFilledOrder, formatAmountOrder } from '../helpers'
import { CancelOrderFunction, CancelOrderType, LimitOrder, LimitOrderStatus } from '../type'
import { Container, Header, Label, ListInfo, MarketInfo, Note, Rate, Value } from './styled'

export enum CancelStatus {
  WAITING,
  COUNTDOWN,
  TIMEOUT,
  CANCEL_DONE,
}

const styleLogo = { width: 20, height: 20 }
function ContentCancel({
  isCancelAll,
  order,
  marketPrice,
  onSubmit,
  onDismiss,
  flowState,
  isOpen,
}: {
  isCancelAll: boolean
  order: LimitOrder | undefined
  marketPrice: BaseTradeInfo | undefined
  onSubmit: CancelOrderFunction
  onDismiss: () => void
  flowState: TransactionFlowState
  isOpen: boolean
}) {
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
  const { orders = [], ordersSoftCancel = [], supportCancelGasless } = useFetchActiveAllOrders(false && !isCancelAll)
  const requestCancel = async (type: CancelOrderType) => {
    const gasLessCancel = type === CancelOrderType.GAS_LESS_CANCEL
    const data: any = await onSubmit(
      isCancelAll ? (gasLessCancel ? ordersSoftCancel : orders) : order ? [order] : [],
      type,
    ) // todo
    if (gasLessCancel) setCancelStatus(CancelStatus.COUNTDOWN)
    const expired = data?.orders?.[0]?.operatorSignatureExpiredAt
    expired && setExpiredTime(expired)
  }

  const onClickGaslessCancel = () => !isCountDown && requestCancel(CancelOrderType.GAS_LESS_CANCEL)
  const onClickHardCancel = () => requestCancel(CancelOrderType.HARD_CANCEL)

  const isCountDown = cancelStatus === CancelStatus.COUNTDOWN
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

  const totalOrder =
    ordersSoftCancel.length === orders.length || !supportCancelGasless
      ? t`all`
      : `${ordersSoftCancel.length}/${orders.length}`

  return (
    <Modal
      maxWidth={isCancelAll && !isCancelDone ? 600 : 480}
      isOpen={flowState.showConfirm && isOpen}
      onDismiss={onDismiss}
    >
      <Container>
        <Header title={isCancelAll ? t`Bulk Cancellation` : t`Cancel an order`} onDismiss={onDismiss} />
        {isCancelAll ? (
          renderContentCancelAll()
        ) : (
          <>
            <ListInfo listData={listData} />
            <MarketInfo marketPrice={marketPrice} symbolIn={makerAssetSymbol} symbolOut={takerAssetSymbol} />
          </>
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
        <CancelCountDown
          expiredTime={expiredTime}
          cancelStatus={cancelStatus}
          setCancelStatus={setCancelStatus}
          flowState={flowState}
        />
        {/** // todo */}
        <CancelButtons
          supportCancelGasless={supportCancelGasless}
          loading={flowState.attemptingTxn}
          cancelStatus={cancelStatus}
          onOkay={onDismiss}
          onClickGaslessCancel={onClickGaslessCancel}
          onClickHardCancel={onClickHardCancel}
          isCancelAll={isCancelAll}
          totalOrder={isCancelAll ? <Trans>Cancel (gasless) {totalOrder} orders</Trans> : null}
        />
      </Container>
    </Modal>
  )
}

export default function CancelOrderModal({
  onSubmit,
  onDismiss,
  flowState,
  order,
  isOpen,
  isCancelAll,
}: {
  onSubmit: CancelOrderFunction
  onDismiss: () => void
  flowState: TransactionFlowState
  order?: LimitOrder
  isOpen: boolean
  isCancelAll: boolean
}) {
  const currencyIn = useCurrencyV2(order?.makerAsset) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset) || undefined
  const { tradeInfo } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut)

  return (
    <ContentCancel
      isOpen={isOpen}
      onSubmit={onSubmit}
      onDismiss={onDismiss}
      marketPrice={tradeInfo}
      isCancelAll={isCancelAll}
      order={order}
      flowState={flowState}
    />
  )
}
