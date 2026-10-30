import { Trans, t } from '@lingui/macro'

import CreateOrderConfirmModal from 'components/LimitOrder/CreateOrder/CreateOrderConfirmModal'
import type { useCreateLimitOrder } from 'components/LimitOrder/CreateOrder/useCreateLimitOrder'
import { ProcessingOrderStep, getLimitOrderStepLabel } from 'components/LimitOrder/ProcessingOrder/steps'
import { useOrderListNavigation } from 'components/LimitOrder/hooks/useOrderListNavigation'
import { LimitOrderCreateContext, LimitOrderStatus, OrderKind } from 'components/LimitOrder/types'
import ProcessingStepsModal from 'components/ProcessingSteps/ProcessingStepsModal'
import { useProcessingState, useProcessingSteps } from 'components/ProcessingSteps/useProcessingSteps'

type CreateOrderController = ReturnType<typeof useCreateLimitOrder>

type CreateOrderFlowProps = {
  order: LimitOrderCreateContext
  isOpen: boolean
  onDismiss?: () => void
  createOrder: CreateOrderController
}

const CreateOrderFlow = ({ order, isOpen, onDismiss, createOrder }: CreateOrderFlowProps) => {
  const navigateToOrders = useOrderListNavigation()
  const { currencyIn, currencyOut, chainId } = order
  const processingState = useProcessingState<ProcessingOrderStep>()

  const viewCreatedOrder = () => {
    navigateToOrders({
      kind: OrderKind.LIMIT,
      status: LimitOrderStatus.ACTIVE,
      chainId,
      currencyIn,
      currencyOut,
    })
  }

  const processing = useProcessingSteps<ProcessingOrderStep>({
    ...processingState,
    approveStep: 'approve',
    actionStep: 'create',
    wrapStep: 'wrap',
    ...createOrder.processing,
    onStart: () => {
      createOrder.processing.onStart?.()
      onDismiss?.()
    },
  })

  return (
    <>
      <CreateOrderConfirmModal
        order={order}
        isOpen={isOpen}
        needsWrap={createOrder.processing.steps.includes('wrap')}
        onDismiss={onDismiss}
        onSubmit={processing.start}
        warnings={createOrder.validation.warnings}
      />

      <ProcessingStepsModal
        chainId={chainId}
        processing={processing}
        title={t`Processing Order`}
        getStepLabel={getLimitOrderStepLabel({ chainId, currencyIn })}
        successAction={{ label: <Trans>My Orders</Trans>, onClick: viewCreatedOrder }}
      />
    </>
  )
}

export default CreateOrderFlow
