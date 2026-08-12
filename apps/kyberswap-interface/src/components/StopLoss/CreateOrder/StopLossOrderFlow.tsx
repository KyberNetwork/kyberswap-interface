import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ProcessingOrderModal from 'components/LimitOrder/ProcessingOrder/ProcessingOrderModal'
import { DEFAULT_PROCESSING_ORDER, useProcessingOrder } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import StopLossConfirmModal from 'components/StopLoss/CreateOrder/StopLossConfirmModal'
import { useCreateStopLossOrder } from 'components/StopLoss/CreateOrder/useCreateStopLossOrder'
import { StopLossWarning } from 'components/StopLoss/Form/useStopLossWarnings'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'

type Props = {
  isOpen: boolean
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount: string
  estimatedOutput: string
  estimatedUsdIn?: string
  estimatedUsdOut?: string
  triggerPrice: string
  triggerPercent?: number
  slippage: number
  expiredAt: number
  notionalUsd?: number
  warnings?: StopLossWarning[]
  onDismiss: () => void
  onResetForm?: () => void
  createOrder: ReturnType<typeof useCreateStopLossOrder>
}

const StopLossOrderFlow = ({
  isOpen,
  currencyIn,
  currencyOut,
  inputAmount,
  estimatedOutput,
  estimatedUsdIn,
  estimatedUsdOut,
  triggerPrice,
  triggerPercent,
  slippage,
  expiredAt,
  notionalUsd,
  warnings,
  onDismiss,
  createOrder,
}: Props) => {
  const navigate = useNavigate()
  const [processingOrder, setProcessingOrder] = useState(DEFAULT_PROCESSING_ORDER)

  const { fee, refreshFee, needsWrap } = createOrder

  // The fee decides the cap carried in the signed intent, so it is fetched as soon as review opens.
  useEffect(() => {
    if (isOpen) refreshFee()
  }, [isOpen, refreshFee])

  const processing = useProcessingOrder({
    processingOrder,
    setProcessingOrder,
    ...createOrder.processing,
    onStart: onDismiss,
  })

  const viewOrders = () => {
    const chainId = createOrder.processing.chainId
    navigate(`${APP_PATHS.STOP_LOSS}/${NETWORKS_INFO[chainId].route}`)
  }

  return (
    <>
      <StopLossConfirmModal
        isOpen={isOpen}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputAmount={inputAmount}
        estimatedOutput={estimatedOutput}
        estimatedUsdIn={estimatedUsdIn}
        estimatedUsdOut={estimatedUsdOut}
        triggerPrice={triggerPrice}
        triggerPercent={triggerPercent}
        slippage={slippage}
        expiredAt={expiredAt}
        fee={fee}
        notionalUsd={notionalUsd}
        needsWrap={needsWrap}
        warnings={warnings}
        onDismiss={onDismiss}
        onSubmit={processing.start}
      />

      <ProcessingOrderModal
        chainId={createOrder.processing.chainId}
        currencyIn={currencyIn}
        processing={processing}
        onViewOrder={viewOrders}
        title={t`Processing Stop-Loss Order`}
        finalStepLabels={{
          idle: t`Sign stop-loss`,
          active: t`Signing stop-loss`,
          success: t`Stop-loss order placed`,
        }}
        viewOrderLabel={<Trans>View order</Trans>}
      />
    </>
  )
}

export default StopLossOrderFlow
