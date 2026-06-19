import { Trans, t } from '@lingui/macro'
import { AlertCircle, RefreshCw } from 'react-feather'

import { ButtonLight, ButtonOutlined } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { Center, HStack, Stack } from 'components/Stack'
import {
  TakeOrderProcessingState,
  TakeOrderStep,
  TakeOrderStepStatus,
} from 'components/swapv2/LimitOrder/hooks/useTakeLimitOrder'
import { CloseIcon } from 'theme/components'
import { cn } from 'utils/cn'

type ProcessingController = {
  state: TakeOrderProcessingState
  dismiss: () => void
  retryStep: (step: TakeOrderStep) => void
}

const getStepStatus = (state: TakeOrderProcessingState, step: TakeOrderStep): TakeOrderStepStatus => {
  if (state.errorStep === step) return 'error'
  if (state.completedSteps.includes(step)) return 'success'
  if (state.currentStep === step) return 'active'
  return 'idle'
}

const StepIcon = ({ index, status }: { index: number; status: TakeOrderStepStatus }) => {
  if (status === 'success') return <CheckCircle size="18" className="text-primary" />
  if (status === 'active') return <Loader size="18px" strokeWidth="2.5" />
  if (status === 'error') return <AlertCircle size={18} className="fill-red text-red" />
  return (
    <Center as="span" className="size-[18px] rounded-full bg-subText/20 text-xs font-medium text-subText">
      {index + 1}
    </Center>
  )
}

const getStepLabel = (step: TakeOrderStep, status: TakeOrderStepStatus) => {
  if (step === 'approve') {
    if (status === 'active') return t`Approving token`
    if (status === 'success') return t`Approved token`
    return t`Approve token`
  }

  if (status === 'active') return t`Filling order`
  if (status === 'success') return t`Order filled`
  return t`Fill order`
}

const isOrderComplete = (state: TakeOrderProcessingState) =>
  state.show &&
  !!state.steps.length &&
  state.steps.every(step => state.completedSteps.includes(step)) &&
  !state.errorStep

const ProcessingStepRow = ({
  index,
  step,
  status,
  onRetryStep,
}: {
  index: number
  step: TakeOrderStep
  status: TakeOrderStepStatus
  onRetryStep: (step: TakeOrderStep) => void
}) => (
  <HStack className="min-h-9 w-full items-center gap-2">
    <StepIcon index={index} status={status} />
    <span
      className={cn(
        'min-w-0 flex-1 truncate text-sm font-medium leading-5',
        status === 'idle' && 'text-subText opacity-60',
        status === 'active' && 'text-text',
        status === 'success' && 'text-primary',
        status === 'error' && 'text-red',
      )}
    >
      {getStepLabel(step, status)}
    </span>
    <HStack className="h-7 w-[76px] items-center justify-end">
      {status === 'error' && (
        <ButtonLight
          onClick={() => onRetryStep(step)}
          width="auto"
          className="!h-7 shrink-0 gap-1 rounded-full !px-3 !py-0 text-xs text-primary"
        >
          <RefreshCw size={13} />
          {t`Retry`}
        </ButtonLight>
      )}
    </HStack>
  </HStack>
)

const ProcessingTakeOrderModal = ({ processing }: { processing: ProcessingController }) => {
  const { state, dismiss, retryStep } = processing
  const orderComplete = isOrderComplete(state)
  const isProcessing = state.show && !!state.currentStep && !state.errorStep && !orderComplete
  const handleDismiss = isProcessing ? undefined : dismiss

  return (
    <Modal isOpen={state.show} onDismiss={handleDismiss} maxWidth={425} borderRadius={14}>
      <Stack className="w-full gap-5 p-5">
        <HStack className="items-center justify-between gap-4">
          <div className="text-xl font-medium text-text">{t`Processing Order`}</div>
          <CloseIcon
            size={22}
            className={cn('shrink-0 text-text', isProcessing && 'cursor-not-allowed opacity-40')}
            onClick={handleDismiss}
          />
        </HStack>

        <Stack className="gap-3">
          <Stack className="gap-2">
            {state.steps.map((step, index) => {
              const status = getStepStatus(state, step)
              return <ProcessingStepRow key={step} index={index} step={step} status={status} onRetryStep={retryStep} />
            })}
          </Stack>

          {orderComplete && (
            <ButtonOutlined onClick={dismiss} className="!h-10 !p-0">
              <Trans>Close</Trans>
            </ButtonOutlined>
          )}
        </Stack>
      </Stack>
    </Modal>
  )
}

export default ProcessingTakeOrderModal
