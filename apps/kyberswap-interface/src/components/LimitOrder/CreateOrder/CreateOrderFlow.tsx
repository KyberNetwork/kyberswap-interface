import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import CreateOrderConfirmModal from 'components/LimitOrder/CreateOrder/CreateOrderConfirmModal'
import { useCreateLimitOrder } from 'components/LimitOrder/CreateOrder/hooks/useCreateLimitOrder'
import type { useLimitOrderExecution } from 'components/LimitOrder/CreateOrder/hooks/useLimitOrderExecution'
import ProcessingOrderModal from 'components/LimitOrder/ProcessingOrder/ProcessingOrderModal'
import { DEFAULT_PROCESSING_ORDER, useProcessingOrder } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import { LimitOrderCreateContext, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { currencyId } from 'utils/currencyId'

type CreateOrderExecution = ReturnType<typeof useLimitOrderExecution>

type CreateOrderFlowProps = {
  order: LimitOrderCreateContext
  searchParams: URLSearchParams
  isOpen: boolean
  onDismiss?: () => void
  execution: CreateOrderExecution
}

const CreateOrderFlow = ({ order, searchParams, isOpen, onDismiss, execution }: CreateOrderFlowProps) => {
  const navigate = useNavigate()
  const { currencyIn, currencyOut, chainId } = order
  const [processingOrder, setProcessingOrder] = useState(DEFAULT_PROCESSING_ORDER)

  const createOrder = useCreateLimitOrder({
    order,
    searchParams,
    estimateUSD: execution.estimateUSD,
    onError: execution.handleError,
    onSuccess: execution.resetForm,
  })

  const viewCreatedOrder = useCallback(() => {
    const currencyPair =
      currencyIn && currencyOut ? `/${currencyId(currencyIn, chainId)}-to-${currencyId(currencyOut, chainId)}` : ''
    const search = new URLSearchParams({
      tab: LimitOrderTab.MY_ORDER,
      orderTab: LimitOrderStatus.ACTIVE,
    }).toString()

    navigate(`${APP_PATHS.LIMIT}/${NETWORKS_INFO[chainId].route}${currencyPair}?${search}`)
  }, [chainId, currencyIn, currencyOut, navigate])

  const processing = useProcessingOrder({
    processingOrder,
    setProcessingOrder,
    ...execution.processing,
    onCreateOrder: createOrder.submitCreateOrderWithTracking,
    onError: execution.handleError,
    onStart: onDismiss,
  })

  return (
    <>
      <CreateOrderConfirmModal
        order={order}
        isOpen={isOpen}
        onDismiss={onDismiss}
        onSubmit={processing.start}
        warningMessage={execution.validation.warningMessage}
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
