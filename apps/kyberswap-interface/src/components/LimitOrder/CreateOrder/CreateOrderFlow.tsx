import { Trans, t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'

import CreateOrderConfirmModal from 'components/LimitOrder/CreateOrder/CreateOrderConfirmModal'
import type { useCreateLimitOrder } from 'components/LimitOrder/CreateOrder/useCreateLimitOrder'
import { ProcessingOrderStep, getLimitOrderStepLabel } from 'components/LimitOrder/ProcessingOrder/steps'
import { LimitOrderCreateContext, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import ProcessingStepsModal from 'components/ProcessingSteps/ProcessingStepsModal'
import { useProcessingState, useProcessingSteps } from 'components/ProcessingSteps/useProcessingSteps'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { currencyId } from 'utils/currencyId'

type CreateOrderController = ReturnType<typeof useCreateLimitOrder>

type CreateOrderFlowProps = {
  order: LimitOrderCreateContext
  isOpen: boolean
  onDismiss?: () => void
  createOrder: CreateOrderController
}

const CreateOrderFlow = ({ order, isOpen, onDismiss, createOrder }: CreateOrderFlowProps) => {
  const navigate = useNavigate()
  const { currencyIn, currencyOut, chainId } = order
  const processingState = useProcessingState<ProcessingOrderStep>()

  const viewCreatedOrder = () => {
    const currencyPair =
      currencyIn && currencyOut ? `/${currencyId(currencyIn, chainId)}-to-${currencyId(currencyOut, chainId)}` : ''
    const search = new URLSearchParams({
      tab: LimitOrderTab.MY_ORDER,
      orderTab: LimitOrderStatus.ACTIVE,
    }).toString()

    navigate(`${APP_PATHS.LIMIT}/${NETWORKS_INFO[chainId].route}${currencyPair}?${search}`)
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
