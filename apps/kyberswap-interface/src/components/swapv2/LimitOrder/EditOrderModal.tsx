import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ethers } from 'ethers'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'
import styled from 'styled-components'

import Column from 'components/Column'
import Modal from 'components/Modal'
import { useEstimateFee, useProcessCancelOrder } from 'components/swapv2/LimitOrder/ListOrder/useRequestCancelOrder'
import CancelButtons from 'components/swapv2/LimitOrder/Modals/CancelButtons'
import { CancelStatus } from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import CancelStatusCountDown from 'components/swapv2/LimitOrder/Modals/CancelStatusCountDown'
import { useIsSupportSoftCancelOrder } from 'components/swapv2/LimitOrder/useFetchActiveAllOrders'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { TransactionFlowState } from 'types/TransactionFlowState'

import LimitOrderForm, { Label, LimitOrderFormHandle } from './LimitOrderForm'
import { calcInvert, calcPercentFilledOrder, calcRate, removeTrailingZero } from './helpers'
import { CancelOrderFunction, CancelOrderType, EditOrderInfo, LimitOrder, LimitOrderStatus, RateInfo } from './type'

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
  onSubmit,
  onDismiss,
  customChainId,
  order,
  note,
  isOpen,
  flowState,
  setFlowState,
}: {
  onSubmit: CancelOrderFunction
  onDismiss: () => void
  customChainId?: ChainId
  order: LimitOrder
  note: string
  isOpen: boolean
  flowState: TransactionFlowState
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
}) {
  const { chainId, account } = useActiveWeb3React()
  const [step, setStep] = useState(Steps.EDIT_ORDER)

  const { status, makingAmount, takingAmount, makerAsset, takerAsset, filledTakingAmount, expiredAt } = order
  const currencyIn = useCurrencyV2(makerAsset, customChainId) ?? undefined
  const currencyOut = useCurrencyV2(takerAsset, customChainId) ?? undefined
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

  const { onClickGaslessCancel, onClickHardCancel, expiredTime, cancelStatus, setCancelStatus } = useProcessCancelOrder(
    {
      isOpen,
      onDismiss,
      onSubmit,
      getOrders: () => (order ? [order] : []),
      isEdit: true,
    },
  )

  const isSupportSoftCancelOrder = useIsSupportSoftCancelOrder()
  const { orderSupportGasless: supportGasLessCancel, chainSupportGasless } = isSupportSoftCancelOrder(order)
  const [cancelType, setCancelType] = useState(CancelOrderType.GAS_LESS_CANCEL)
  useEffect(() => {
    setCancelType(supportGasLessCancel ? CancelOrderType.GAS_LESS_CANCEL : CancelOrderType.HARD_CANCEL)
  }, [supportGasLessCancel])

  const orders = useMemo(() => (order ? [order] : []), [order])

  const estimateGas = useEstimateFee({ orders })

  const theme = useTheme()
  const isReviewOrder = step === Steps.REVIEW_ORDER
  const onBack = () => {
    setStep(Steps.EDIT_ORDER)
    setFlowState(v => ({ ...v, showConfirm: false }))
  }
  const onNext = () => {
    setStep(Steps.REVIEW_ORDER)
    setFlowState(v => ({ ...v, showConfirm: true }))
  }

  const isWaiting = cancelStatus === CancelStatus.WAITING
  const showReview = isReviewOrder && isWaiting

  const ref = useRef<LimitOrderFormHandle>(null)
  const renderCancelButtons = () => {
    const hasChangeInfo = step === Steps.EDIT_ORDER ? ref.current?.hasChangedOrderInfo?.() : true
    const disabledGasLessCancel = !hasChangeInfo || !supportGasLessCancel || flowState.attemptingTxn
    const disabledHardCancel = !hasChangeInfo || flowState.attemptingTxn
    return (
      <>
        {isReviewOrder && (
          <CancelStatusCountDown
            expiredTime={expiredTime}
            cancelStatus={cancelStatus}
            setCancelStatus={setCancelStatus}
            flowState={flowState}
          />
        )}
        <CancelButtons
          cancelType={cancelType}
          setCancelType={setCancelType}
          confirmOnly={isReviewOrder}
          onSubmit={isReviewOrder ? undefined : onNext}
          isEdit
          estimateGas={estimateGas}
          cancelStatus={cancelStatus}
          onDismiss={onDismiss}
          onClickGaslessCancel={onClickGaslessCancel}
          onClickHardCancel={onClickHardCancel}
          order={order}
          buttonInfo={{
            orderSupportGasless: supportGasLessCancel,
            chainSupportGasless,
            disabledGasLessCancel,
            disabledHardCancel,
            cancelGaslessText: <Trans>Gasless Edit</Trans>,
            hardCancelGasless: <Trans>Hard Edit</Trans>,
            confirmBtnText: isReviewOrder ? <Trans>Place Order</Trans> : <Trans>Edit Order</Trans>,
            disabledConfirm: flowState.attemptingTxn || (disabledGasLessCancel && disabledHardCancel),
          }}
        />
      </>
    )
  }

  const editOrderInfo: EditOrderInfo = { isEdit: true, gasFee: estimateGas, cancelType, renderCancelButtons }
  return (
    <Modal isOpen={isOpen && !!currencyIn && !!currencyOut && !!defaultActiveMakingAmount} onDismiss={onDismiss}>
      <Wrapper>
        <Flex justifyContent={'space-between'} alignItems="center">
          {showReview ? <ChevronLeft style={{ cursor: 'pointer', color: theme.subText }} onClick={onBack} /> : <div />}
          <Text>{showReview ? <Trans>Review your order</Trans> : <Trans>Edit Order</Trans>}</Text>
          <X style={{ cursor: 'pointer', color: theme.subText }} onClick={onDismiss} />
        </Flex>

        <Column gap="10px">
          <StyledLabel>
            <Trans>
              Editing this order will automatically cancel your existing order and a new order will be created.
            </Trans>
          </StyledLabel>
          {status === LimitOrderStatus.PARTIALLY_FILLED && (
            <StyledLabel>
              <Trans>Your currently existing order is {filled}% filled.</Trans>
            </StyledLabel>
          )}
        </Column>

        {isWaiting && (
          <LimitOrderForm
            ref={ref}
            zIndexToolTip={Z_INDEXS.MODAL}
            flowState={flowState}
            setFlowState={setFlowState}
            currencyIn={currencyIn}
            currencyOut={currencyOut}
            defaultInputAmount={formatIn}
            defaultOutputAmount={formatOut}
            defaultActiveMakingAmount={defaultActiveMakingAmount}
            defaultRate={defaultRate}
            editOrderInfo={editOrderInfo}
            note={note}
            orderInfo={order}
            defaultExpire={defaultExpire}
          />
        )}
      </Wrapper>
    </Modal>
  )
}
