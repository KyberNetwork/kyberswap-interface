import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from 'react-use'
import { useGetStopMarketConfigQuery } from 'services/stopMarket'

import { ProcessingOrderStep, getLimitOrderStepLabel } from 'components/LimitOrder/ProcessingOrder/steps'
import ProcessingStepsModal from 'components/ProcessingSteps/ProcessingStepsModal'
import {
  ProcessingStepFailure,
  ProcessingStepStatus,
  useProcessingState,
  useProcessingSteps,
} from 'components/ProcessingSteps/useProcessingSteps'
import StopMarketConfirmModal, {
  StopMarketReviewSnapshot,
} from 'components/StopMarket/CreateOrder/StopMarketConfirmModal'
import { useCreateStopMarket } from 'components/StopMarket/CreateOrder/useCreateStopMarket'
import { getStopMarketServiceErrorMessage } from 'components/StopMarket/utils'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { currencyId } from 'utils/currencyId'
import { friendlyError } from 'utils/errorMessage'

/** Whether this device has placed a stop market order, and so has accepted the terms. */
const STOP_MARKET_TERMS_ACCEPTED_KEY = 'stop-market-terms-accepted'

type Props = {
  review: StopMarketReviewSnapshot
  onDismiss: () => void
  onOrderCreated: () => void
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
  /** Every step went through. */
  onComplete?: () => void
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
  onComplete,
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
    onComplete: () => {
      setIsCompleted(true)
      onComplete?.()
    },
  })

  // Closing a session or changing wallet unmounts its controller. Stop pending steps from advancing.
  useEffect(() => processing.dismiss, [processing.dismiss])

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

/** One review and its processing run. Only this session subscribes to the execution hooks. */
const StopMarketFlow = ({ review, onDismiss, onOrderCreated }: Props) => {
  const [isReviewOpen, setIsReviewOpen] = useState(true)
  const activeSession = useRef(true)
  useEffect(() => {
    activeSession.current = true
    return () => {
      activeSession.current = false
    }
  }, [])

  const createOrder = useCreateStopMarket({
    ...review,
    onResetForm: () => {
      // A submitted order may finish after dismissal; it must not reset the next form draft.
      if (activeSession.current) onOrderCreated()
    },
  })
  // Set once an order is placed, not when the box is ticked: a signature refused in the wallet places
  // nothing, so the next review asks again.
  const [hasAcceptedTerms, setHasAcceptedTerms] = useLocalStorage(STOP_MARKET_TERMS_ACCEPTED_KEY, false)
  const { start, processingModal } = useStopMarketProcessing({
    currencyIn: review.currencyIn,
    currencyOut: review.currencyOut,
    createOrder,
    onStart: () => setIsReviewOpen(false),
    onClose: onDismiss,
    onComplete: () => setHasAcceptedTerms(true),
  })

  return (
    <>
      <StopMarketConfirmModal
        {...review}
        isOpen={isReviewOpen}
        requiresTermsAcceptance={!hasAcceptedTerms}
        onDismiss={onDismiss}
        onSubmit={start}
      />

      {processingModal}
    </>
  )
}

type ReviewSession = {
  account: string
  chainId: ChainId
  snapshot: StopMarketReviewSnapshot
}

/** Owns the captured order and its lifetime; form validation never reads this snapshot. */
export const useStopMarketFlow = ({ onOrderCreated }: { onOrderCreated: () => void }) => {
  const { account, chainId } = useActiveWeb3React()
  // Keep the contract config warm while editing, without mounting an execution controller for the draft.
  useGetStopMarketConfigQuery(chainId)
  const [session, setSession] = useState<ReviewSession>()
  const isCurrentSession = !!session && session.account === account?.toLowerCase() && session.chainId === chainId

  useEffect(() => {
    if (session && !isCurrentSession) setSession(undefined)
  }, [session, isCurrentSession])

  const openReview = (snapshot: StopMarketReviewSnapshot) => {
    if (!account || session) return
    setSession({ account: account.toLowerCase(), chainId, snapshot })
  }

  return {
    openReview,
    // Hide an invalid session immediately; its unmount also cancels the processing controller.
    flow: isCurrentSession ? (
      <StopMarketFlow
        review={session.snapshot}
        onDismiss={() => setSession(undefined)}
        onOrderCreated={onOrderCreated}
      />
    ) : null,
  }
}
