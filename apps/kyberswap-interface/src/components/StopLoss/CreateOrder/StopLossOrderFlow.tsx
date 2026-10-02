import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { ProcessingOrderStep, getLimitOrderStepLabel } from 'components/LimitOrder/ProcessingOrder/steps'
import ProcessingStepsModal from 'components/ProcessingSteps/ProcessingStepsModal'
import {
  ProcessingStepStatus,
  useProcessingState,
  useProcessingSteps,
} from 'components/ProcessingSteps/useProcessingSteps'
import StopLossConfirmModal from 'components/StopLoss/CreateOrder/StopLossConfirmModal'
import { useCreateStopLossOrder } from 'components/StopLoss/CreateOrder/useCreateStopLossOrder'
import { StopLossWarning } from 'components/StopLoss/Form/useStopLossWarnings'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { currencyId } from 'utils/currencyId'

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
  const processingState = useProcessingState<ProcessingOrderStep>()

  const { fee, refreshFee, needsWrap } = createOrder

  // The fee decides the cap carried in the signed intent, so it is fetched as soon as review opens.
  useEffect(() => {
    if (isOpen) refreshFee()
  }, [isOpen, refreshFee])

  const { chainId } = createOrder.processing

  const processing = useProcessingSteps<ProcessingOrderStep>({
    ...processingState,
    approveStep: 'approve',
    actionStep: 'create',
    wrapStep: 'wrap',
    ...createOrder.processing,
    onStart: onDismiss,
  })

  const limitOrderStepLabel = getLimitOrderStepLabel({ chainId, currencyIn })
  // Only the signing step names the kind of order; wrap and approve read the same as a limit order.
  const getStepLabel = (step: ProcessingOrderStep, status: ProcessingStepStatus) => {
    if (step !== 'create') return limitOrderStepLabel(step, status)
    if (status === 'active') return t`Signing stop-loss`
    if (status === 'success') return t`Stop-loss order placed`
    return t`Sign stop-loss`
  }

  // Keeps the pair in the path, as Limit Order's "My Orders" does: a bare chain route falls back to
  // the chain's default pair and would swap out the tokens the user just placed an order on.
  const viewOrders = () => {
    const pair =
      currencyIn && currencyOut ? `/${currencyId(currencyIn, chainId)}-to-${currencyId(currencyOut, chainId)}` : ''
    navigate(`${APP_PATHS.STOP_LOSS}/${NETWORKS_INFO[chainId].route}${pair}`)
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

      <ProcessingStepsModal
        chainId={chainId}
        processing={processing}
        title={t`Processing Stop-Loss Order`}
        getStepLabel={getStepLabel}
        successAction={{ label: <Trans>View order</Trans>, onClick: viewOrders }}
      />
    </>
  )
}

export default StopLossOrderFlow
