import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ProcessingOrderStep, getLimitOrderStepLabel } from 'components/LimitOrder/ProcessingOrder/steps'
import ProcessingStepsModal from 'components/ProcessingSteps/ProcessingStepsModal'
import {
  ProcessingStepFailure,
  ProcessingStepStatus,
  useProcessingState,
  useProcessingSteps,
} from 'components/ProcessingSteps/useProcessingSteps'
import StopMarketConfirmModal from 'components/StopMarket/CreateOrder/StopMarketConfirmModal'
import { useCreateStopMarket } from 'components/StopMarket/CreateOrder/useCreateStopMarket'
import { StopMarketWarning } from 'components/StopMarket/Form/useStopMarketWarnings'
import { StopMarketFee } from 'components/StopMarket/types'
import { getStopMarketServiceErrorMessage } from 'components/StopMarket/utils'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { currencyId } from 'utils/currencyId'
import { friendlyError } from 'utils/errorMessage'

type Props = {
  isOpen: boolean
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount: string
  estimatedOutput: string
  estimatedUsdIn?: string
  triggerPrice: string
  triggerPercent?: number
  slippage: number
  expiredAt: number
  warnings?: StopMarketWarning[]
  /** The fee for these terms, as the form estimated it. Signing estimates again for the cap. */
  fee?: StopMarketFee
  isFeeLoading?: boolean
  feeError?: string
  onRetryFee?: () => void
  onDismiss: () => void
  createOrder: ReturnType<typeof useCreateStopMarket>
}

/**
 * Why a step failed, in words the user can act on. The service's own reason comes first — it names the
 * field it refused, such as a slippage below the fees or a balance already committed — and a refusal in
 * the wallet needs no explanation at all.
 */
const getStepErrorMessage = (failure: ProcessingStepFailure): string | undefined => {
  if (failure.reason === 'rejected' || failure.error === undefined) return undefined
  const serviceMessage = getStopMarketServiceErrorMessage(failure.error)
  if (serviceMessage) return serviceMessage
  if (failure.error instanceof Error || typeof failure.error === 'string') return friendlyError(failure.error)
  return t`Something went wrong. Please try again.`
}

type ProcessingParams = {
  currencyIn?: Currency
  currencyOut?: Currency
  /** An edit of an open order rather than a new one, which only changes the wording. */
  isEdit?: boolean
  createOrder: ReturnType<typeof useCreateStopMarket>
  /** The run has started, so the review gives way to it. */
  onStart: () => void
  /** The processing modal closed; `completed` once every step went through. */
  onClose?: (completed: boolean) => void
}

/**
 * The signing run behind a stop market order, with the modal that reports it: started from the creation
 * review, or straight from the edit modal.
 */
export const useStopMarketProcessing = ({
  currencyIn,
  currencyOut,
  isEdit,
  createOrder,
  onStart,
  onClose,
}: ProcessingParams) => {
  const navigate = useNavigate()
  const processingState = useProcessingState<ProcessingOrderStep>()
  // The modal shows it only while a step is marked failed, so a retry hides it and a new failure replaces it.
  const [stepError, setStepError] = useState<string | undefined>()
  // Held until the processing modal closes, so the success state stays on screen until the user leaves it.
  const [isCompleted, setIsCompleted] = useState(false)

  const { chainId } = createOrder.processing

  const processing = useProcessingSteps<ProcessingOrderStep>({
    ...processingState,
    approveStep: 'approve',
    actionStep: 'create',
    wrapStep: 'wrap',
    ...createOrder.processing,
    onStart,
    onStepFailed: (_step, failure) => setStepError(getStepErrorMessage(failure)),
    onComplete: () => setIsCompleted(true),
  })

  const limitOrderStepLabel = getLimitOrderStepLabel({ chainId, currencyIn })
  // Only the signing step names the kind of order; wrap and approve read the same as a limit order.
  const getStepLabel = (step: ProcessingOrderStep, status: ProcessingStepStatus) => {
    if (step !== 'create') return limitOrderStepLabel(step, status)
    if (isEdit) {
      if (status === 'active') return t`Signing update`
      if (status === 'success') return t`Order updated`
      return t`Sign update`
    }
    if (status === 'active') return t`Signing stop market order`
    if (status === 'success') return t`Stop market order placed`
    return t`Sign stop market order`
  }

  // Keeps the pair in the path, as Limit Order's "My Orders" does: a bare chain route falls back to
  // the chain's default pair and would swap out the tokens the user just placed an order on.
  const viewOrders = () => {
    const pair =
      currencyIn && currencyOut ? `/${currencyId(currencyIn, chainId)}-to-${currencyId(currencyOut, chainId)}` : ''
    navigate(`${APP_PATHS.STOP_MARKET}/${NETWORKS_INFO[chainId].route}${pair}`)
  }

  const processingModal = (
    <ProcessingStepsModal
      chainId={chainId}
      processing={processing}
      title={isEdit ? t`Updating Stop Market Order` : t`Processing Stop Market Order`}
      getStepLabel={getStepLabel}
      errorMessage={stepError}
      successAction={{ label: <Trans>View order</Trans>, onClick: viewOrders }}
      onClose={() => {
        onClose?.(isCompleted)
        setIsCompleted(false)
      }}
    />
  )

  return { start: processing.start, processingModal }
}

const StopMarketFlow = ({
  isOpen,
  currencyIn,
  currencyOut,
  inputAmount,
  estimatedOutput,
  estimatedUsdIn,
  triggerPrice,
  triggerPercent,
  slippage,
  expiredAt,
  warnings,
  fee,
  isFeeLoading,
  feeError,
  onRetryFee,
  onDismiss,
  createOrder,
}: Props) => {
  const { start, processingModal } = useStopMarketProcessing({
    currencyIn,
    currencyOut,
    createOrder,
    onStart: onDismiss,
  })
  const { needsWrap } = createOrder

  return (
    <>
      <StopMarketConfirmModal
        isOpen={isOpen}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputAmount={inputAmount}
        estimatedOutput={estimatedOutput}
        estimatedUsdIn={estimatedUsdIn}
        triggerPrice={triggerPrice}
        triggerPercent={triggerPercent}
        slippage={slippage}
        expiredAt={expiredAt}
        fee={fee}
        feeError={feeError}
        isFeeLoading={isFeeLoading}
        onRetryFee={onRetryFee}
        needsWrap={needsWrap}
        warnings={warnings}
        onDismiss={onDismiss}
        onSubmit={start}
      />

      {processingModal}
    </>
  )
}

export default StopMarketFlow
