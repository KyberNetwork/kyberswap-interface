import { Trans } from '@lingui/macro'
import { ethers } from 'ethers'
import { useCallback, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'
import styled from 'styled-components'

import Modal from 'components/Modal'
import CancelButtons from 'components/swapv2/LimitOrder/Modals/CancelButtons'
import CancelCountDown from 'components/swapv2/LimitOrder/Modals/CancelCountDown'
import { CancelStatus } from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import ConfirmOrderModal from 'components/swapv2/LimitOrder/Modals/ConfirmOrderModal'
import { useIsSupportSoftCancelOrder } from 'components/swapv2/LimitOrder/useFetchActiveAllOrders'
import useSignOrder from 'components/swapv2/LimitOrder/useSignOrder'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useLimitActionHandlers } from 'state/limit/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'

import LimitOrderForm, { Label } from './LimitOrderForm'
import { calcInvert, calcPercentFilledOrder, calcRate, getErrorMessage, removeTrailingZero } from './helpers'
import { CancelOrderFunction, CancelOrderInfo, CancelOrderType, LimitOrder, LimitOrderStatus, RateInfo } from './type'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const StyledLabel = styled(Label)`
  margin-bottom: 0;
`

enum Steps {
  EDIT_ORDER,
  REVIEW_ORDER,
}
export default function EditOrderModal({
  onCancelOrder,
  onDismiss,
  order,
  note,
  isOpen,
  flowState,
  setFlowState,
  refreshListOrder,
}: {
  onCancelOrder: CancelOrderFunction
  onDismiss: () => void
  order: LimitOrder
  note: string
  isOpen: boolean
  flowState: TransactionFlowState
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
  refreshListOrder: () => void
}) {
  const { chainId, account } = useActiveWeb3React()
  const [step, setStep] = useState(Steps.EDIT_ORDER)

  const { status, makingAmount, takingAmount, makerAsset, takerAsset, filledTakingAmount, expiredAt } = order
  const currencyIn = useCurrencyV2(makerAsset) ?? undefined
  const currencyOut = useCurrencyV2(takerAsset) ?? undefined
  const inputAmount = currencyIn ? ethers.utils.formatUnits(makingAmount, currencyIn.decimals) : ''
  const outputAmount = currencyOut ? ethers.utils.formatUnits(takingAmount, currencyOut.decimals) : ''

  const formatIn = inputAmount ? removeTrailingZero(inputAmount) : inputAmount
  const formatOut = outputAmount ? removeTrailingZero(outputAmount) : outputAmount
  const defaultExpire = new Date(expiredAt * 1000)
  const rate = currencyOut ? calcRate(formatIn, formatOut, currencyOut.decimals) : ''
  const defaultRate: RateInfo = { rate, invertRate: calcInvert(rate), invert: false }
  const filled = currencyOut ? calcPercentFilledOrder(filledTakingAmount, takingAmount, currencyOut.decimals) : 0

  const { data: defaultActiveMakingAmount } = useGetTotalActiveMakingAmountQuery(
    { chainId, tokenAddress: currencyIn?.wrapped.address ?? '', account: account ?? '' },
    { skip: !currencyIn || !account },
  )

  const onNext = useCallback(() => {
    setStep(Steps.REVIEW_ORDER)
    setFlowState(v => ({ ...v, showConfirm: true }))
  }, [setFlowState])

  const { removeCurrentOrder, setCurrentOrder } = useLimitActionHandlers()
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>(CancelStatus.WAITING)
  const [expiredTime, setExpiredTime] = useState(0)

  const handleError = useCallback(
    (error: any) => {
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: getErrorMessage(error),
      }))
    },
    [setFlowState],
  )

  const signOrder = useSignOrder(setFlowState)
  const onSubmitEditOrder = async (cancelType?: CancelOrderType) => {
    try {
      if (!onCancelOrder || cancelType === undefined) return
      const data = await onCancelOrder(order ? [order] : [], cancelType)
      if (order) {
        const param = {
          orderId: order?.id,
          account,
          chainId,
          currencyIn,
          currencyOut,
          inputAmount,
          outputAmount,
          expiredAt,
        }
        const { signature, salt } = await signOrder(param)
        setCurrentOrder({ ...param, salt, signature })
      }
      setCancelStatus(cancelType === CancelOrderType.GAS_LESS_CANCEL ? CancelStatus.COUNTDOWN : CancelStatus.WAITING)
      const expired = data?.orders?.[0]?.operatorSignatureExpiredAt
      expired && setExpiredTime(expired)
      onNext()
    } catch (error) {
      order && removeCurrentOrder(order.id)
      handleError(error)
    }
  }

  const onClickGaslessCancel = () => onSubmitEditOrder(CancelOrderType.GAS_LESS_CANCEL)
  const onClickHardCancel = () => onSubmitEditOrder(CancelOrderType.HARD_CANCEL)
  const isSupportSoftCancelOrder = useIsSupportSoftCancelOrder()
  const supportCancelGasless = isSupportSoftCancelOrder(order)

  const cancelOrderInfo: CancelOrderInfo = {
    cancelStatus,
    onCancelOrder: onSubmitEditOrder,
    supportCancelGasless,
  }

  if (step === Steps.REVIEW_ORDER || flowState.attemptingTxn)
    return (
      <ConfirmOrderModal
        isEdit
        renderButtons={() => (
          <>
            <CancelCountDown
              expiredTime={expiredTime}
              cancelStatus={cancelStatus}
              setCancelStatus={setCancelStatus}
              flowState={flowState}
            />
            <CancelButtons
              isEdit
              supportCancelGasless={supportCancelGasless}
              loading={flowState.attemptingTxn}
              cancelStatus={cancelStatus}
              onOkay={() => {}}
              onClickGaslessCancel={onClickGaslessCancel}
              onClickHardCancel={onClickHardCancel}
            />
          </>
        )}
        flowState={flowState}
        onDismiss={onDismiss}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputAmount={inputAmount}
        outputAmount={outputAmount}
        expireAt={expiredAt}
        // rateInfo={rateInfo} // todo
        // marketPrice={tradeInfo}
        note={note}
        // warningMessage={warningMessage}
        // percentDiff={Number(deltaRate.rawPercent)}
      />
    )

  return (
    <Modal isOpen={isOpen && !!currencyIn && !!currencyOut && !!defaultActiveMakingAmount} onDismiss={onDismiss}>
      <Wrapper>
        <Flex justifyContent={'space-between'} alignItems="center">
          <Text>
            <Trans>Edit Order</Trans>
          </Text>
          <X style={{ cursor: 'pointer' }} onClick={onDismiss} />
        </Flex>
        <div>
          <StyledLabel>
            <Trans>
              Editing this order will automatically cancel your existing order and a new order will be created.
            </Trans>
          </StyledLabel>
          {status === LimitOrderStatus.PARTIALLY_FILLED && (
            <StyledLabel style={{ marginTop: '0.75rem' }}>
              <Trans>Your currently existing order is {filled}% filled.</Trans>
            </StyledLabel>
          )}
        </div>
        <LimitOrderForm
          zIndexToolTip={Z_INDEXS.MODAL}
          flowState={flowState}
          setFlowState={setFlowState}
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          isEdit
          defaultInputAmount={formatIn}
          defaultOutputAmount={formatOut}
          defaultActiveMakingAmount={defaultActiveMakingAmount}
          defaultRate={defaultRate}
          cancelOrderInfo={cancelOrderInfo}
          refreshListOrder={refreshListOrder}
          note={note}
          orderInfo={order}
          defaultExpire={defaultExpire}
        />
      </Wrapper>
    </Modal>
  )
}
