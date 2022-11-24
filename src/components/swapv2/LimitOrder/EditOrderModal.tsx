import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Modal from 'components/Modal'
import { Z_INDEXS } from 'constants/styles'
import { useCurrencyV2 } from 'hooks/Tokens'
import { TransactionFlowState } from 'types'

import LimitOrderForm, { Label } from './LimitOrderForm'
import { calcInvert, calcPercentFilledOrder, calcRate, removeTrailingZero, uint256ToFraction } from './helpers'
import { LimitOrder, LimitOrderActions, LimitOrderStatus, RateInfo } from './type'

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
export default function UpdateOrderModal({
  onCancelOrder,
  onDismiss,
  order,
  note,
  isOpen,
  step,
  flowState,
  setFlowState,
  refreshListOrder,
}: {
  onCancelOrder: () => Promise<any>
  onDismiss: () => void
  swapState: TransactionFlowState
  order: LimitOrder
  note: string
  isOpen: boolean
  step: LimitOrderActions
  flowState: TransactionFlowState
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
  refreshListOrder: () => void
}) {
  const { status, makingAmount, takingAmount, makerAsset, takerAsset, filledTakingAmount, expiredAt } = order
  const currencyIn = useCurrencyV2(makerAsset) ?? undefined
  const currencyOut = useCurrencyV2(takerAsset) ?? undefined
  const inputAmount = uint256ToFraction(makingAmount).toFixed(currencyIn?.decimals ?? 16) // todo check xem sai số
  const outputAmount = uint256ToFraction(takingAmount).toFixed(currencyOut?.decimals ?? 16) // todo check xem sai số
  const formatIn = inputAmount ? removeTrailingZero(inputAmount) : inputAmount
  const formatOut = outputAmount ? removeTrailingZero(outputAmount) : outputAmount
  const defaultExpire = new Date(expiredAt * 1000)
  const rate = calcRate(formatIn, formatOut, currencyOut?.decimals ?? 18)
  const defaultRate: RateInfo = { rate, invertRate: calcInvert(rate), invert: false }
  // todo check exess decimal all
  const filled = calcPercentFilledOrder(filledTakingAmount, takingAmount)
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
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
          step={step}
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          action={LimitOrderActions.EDIT}
          defaultInputAmount={formatIn}
          defaultOutputAmount={formatOut}
          defaultRate={defaultRate}
          onDismissModalEdit={onDismiss}
          onCancelOrder={onCancelOrder}
          refreshListOrder={refreshListOrder}
          note={note}
          orderInfo={order}
          defaultExpire={defaultExpire}
        />
      </Wrapper>
    </Modal>
  )
}
