import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { AlertCircle, RotateCw } from 'react-feather'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import type { ProcessingOrderStep } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import type { TakeOrderStep } from 'components/LimitOrder/TakeOrder/useTakeLimitOrder'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { Center, HStack, Stack } from 'components/Stack'
import { NativeCurrencies } from 'constants/tokens'
import { CloseIcon } from 'theme/components'
import { cn } from 'utils/cn'

type OrderProcessingStep = ProcessingOrderStep | TakeOrderStep
type ProcessingStepStatus = 'idle' | 'active' | 'success' | 'error'

type ProcessingState<Step extends OrderProcessingStep> = {
  show: boolean
  steps: Step[]
  currentStep?: Step
  errorStep?: Step
  completedSteps: Step[]
}

type ProcessingController<Step extends OrderProcessingStep> = {
  state: ProcessingState<Step>
  dismiss: () => void
  retryStep?: (step: Step) => void
}

type ProcessingOrderModalProps<Step extends OrderProcessingStep> = {
  processing: ProcessingController<Step>
  chainId?: ChainId
  currencyIn?: Currency
  onViewOrder?: () => void
}

const getStepStatus = <Step extends OrderProcessingStep>({
  step,
  currentStep,
  errorStep,
  completedSteps,
}: {
  step: Step
  currentStep: Step | undefined
  errorStep: Step | undefined
  completedSteps: Step[]
}): ProcessingStepStatus => {
  if (errorStep === step) return 'error'
  if (completedSteps.includes(step)) return 'success'
  if (currentStep === step) return 'active'
  return 'idle'
}

const StepIcon = ({ index, status }: { index: number; status: ProcessingStepStatus }) => {
  if (status === 'success') return <CheckCircle size="18" className="text-primary" />
  if (status === 'active') return <Loader size="18px" strokeWidth="2.5" />
  if (status === 'error') return <AlertCircle size={18} className="fill-red text-red" />
  return (
    <Center as="span" className="size-[18px] rounded-full bg-subText/20 text-xs font-medium text-subText">
      {index + 1}
    </Center>
  )
}

const getStepLabel = ({
  step,
  status,
  chainId,
  currencyIn,
}: {
  step: OrderProcessingStep
  status: ProcessingStepStatus
  chainId: ChainId | undefined
  currencyIn: Currency | undefined
}) => {
  if (step === 'wrap') {
    const nativeSymbol = chainId ? NativeCurrencies[chainId].symbol : t`token`
    if (status === 'active') return t`Wrapping ${nativeSymbol}`
    if (status === 'success') return t`Wrapped ${nativeSymbol}`
    return t`Wrap ${nativeSymbol}`
  }

  if (step === 'approve') {
    const inputSymbol = currencyIn?.wrapped.symbol
    if (status === 'active') return inputSymbol ? t`Approving ${inputSymbol}` : t`Approving token`
    if (status === 'success') return inputSymbol ? t`Approved ${inputSymbol}` : t`Approved token`
    return inputSymbol ? t`Approve ${inputSymbol}` : t`Approve token`
  }

  if (step === 'create') {
    if (status === 'active') return t`Signing order`
    if (status === 'success') return t`Order successfully listed`
    return t`Sign order`
  }

  if (status === 'active') return t`Filling order`
  if (status === 'success') return t`Order filled`
  return t`Fill order`
}

const ProcessingStepRow = <Step extends OrderProcessingStep>({
  index,
  step,
  status,
  chainId,
  currencyIn,
  onRetryStep,
}: {
  index: number
  step: Step
  status: ProcessingStepStatus
  chainId: ChainId | undefined
  currencyIn: Currency | undefined
  onRetryStep?: (step: Step) => void
}) => (
  <HStack className="min-h-8 w-full items-center gap-2">
    <StepIcon index={index} status={status} />
    <span
      className={cn(
        'min-w-0 flex-1 truncate text-sm font-medium',
        status === 'idle' && 'text-subText opacity-60',
        status === 'active' && 'text-text',
        status === 'success' && 'text-primary',
        status === 'error' && 'text-red',
      )}
    >
      {getStepLabel({ step, status, chainId, currencyIn })}
    </span>
    {status === 'error' && (
      <ButtonLight onClick={() => onRetryStep?.(step)} width="auto" className="gap-1 px-2 py-1 text-xs">
        <RotateCw size={14} />
        {t`Retry`}
      </ButtonLight>
    )}
  </HStack>
)

const ProcessingOrderModal = <Step extends OrderProcessingStep>({
  processing,
  chainId,
  currencyIn,
  onViewOrder,
}: ProcessingOrderModalProps<Step>) => {
  const { state, dismiss, retryStep } = processing

  const orderComplete =
    state.show &&
    !!state.steps.length &&
    state.steps.every(step => state.completedSteps.includes(step)) &&
    !state.errorStep

  const isProcessing = state.show && !!state.currentStep && !state.errorStep && !orderComplete

  const handleDismiss = () => {
    if (!isProcessing) {
      dismiss()
    }
  }

  const handleViewOrder = () => {
    dismiss()
    onViewOrder?.()
  }

  return (
    <Modal isOpen={state.show} onDismiss={handleDismiss} maxWidth={425} borderRadius={14}>
      <Stack className="w-full gap-5 p-5">
        <HStack className="items-center justify-between gap-4">
          <div className="text-xl font-medium text-text">{t`Processing Order`}</div>
          <CloseIcon onClick={handleDismiss} />
        </HStack>

        <Stack className="gap-3">
          <Stack className="gap-2">
            {state.steps.map((step, index) => {
              const status = getStepStatus({
                step,
                currentStep: state.currentStep,
                errorStep: state.errorStep,
                completedSteps: state.completedSteps,
              })
              return (
                <ProcessingStepRow
                  key={step}
                  index={index}
                  step={step}
                  status={status}
                  chainId={chainId}
                  currencyIn={currencyIn}
                  onRetryStep={retryStep}
                />
              )
            })}
          </Stack>

          {orderComplete && (
            <HStack className="gap-3">
              <ButtonOutlined onClick={handleDismiss} className="flex-1">
                <Trans>Close</Trans>
              </ButtonOutlined>
              <ButtonPrimary onClick={handleViewOrder} className="flex-1">
                <Trans>My Orders</Trans>
              </ButtonPrimary>
            </HStack>
          )}
        </Stack>
      </Stack>
    </Modal>
  )
}

export default ProcessingOrderModal
