import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import CreateOrderConfirmModal from 'components/LimitOrder/CreateOrder/CreateOrderConfirmModal'
import type { useCreateLimitOrder } from 'components/LimitOrder/CreateOrder/useCreateLimitOrder'
import ProcessingOrderModal from 'components/LimitOrder/ProcessingOrder/ProcessingOrderModal'
import { DEFAULT_PROCESSING_ORDER, useProcessingOrder } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import { LimitOrderCreateContext, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
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
  const [processingOrder, setProcessingOrder] = useState(DEFAULT_PROCESSING_ORDER)

  const viewCreatedOrder = () => {
    const currencyPair =
      currencyIn && currencyOut ? `/${currencyId(currencyIn, chainId)}-to-${currencyId(currencyOut, chainId)}` : ''
    const search = new URLSearchParams({
      tab: LimitOrderTab.MY_ORDER,
      orderTab: LimitOrderStatus.ACTIVE,
    }).toString()

    navigate(`${APP_PATHS.LIMIT}/${NETWORKS_INFO[chainId].route}${currencyPair}?${search}`)
  }

  const processing = useProcessingOrder({
    processingOrder,
    setProcessingOrder,
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

      <ProcessingOrderModal
        chainId={chainId}
        currencyIn={currencyIn}
        processing={processing}
        onViewOrder={viewCreatedOrder}
      />
    </>
  )
}

export default CreateOrderFlow
