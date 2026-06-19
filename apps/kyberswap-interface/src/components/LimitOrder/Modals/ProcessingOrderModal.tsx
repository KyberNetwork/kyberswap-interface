import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { AlertCircle, RefreshCw } from 'react-feather'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { Center, HStack, Stack } from 'components/Stack'
import type {
  ProcessingOrderController,
  ProcessingOrderState,
  ProcessingOrderStep,
  ProcessingOrderStepStatus,
} from 'components/LimitOrder/hooks/useProcessingOrder'
import { NativeCurrencies } from 'constants/tokens'
import { CloseIcon } from 'theme/components'
import { cn } from 'utils/cn'

const getStepStatus = (state: ProcessingOrderState, step: ProcessingOrderStep): ProcessingOrderStepStatus => {
  if (state.errorStep === step) return 'error'
  if (state.completedSteps.includes(step)) return 'success'
  if (state.currentStep === step) return 'active'
  return 'idle'
}

const StepIcon = ({ index, status }: { index: number; status: ProcessingOrderStepStatus }) => {
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
  step: ProcessingOrderStep
  status: ProcessingOrderStepStatus
  chainId: ChainId
  currencyIn: Currency | undefined
}) => {
  const nativeSymbol = NativeCurrencies[chainId].symbol
  const inputSymbol = currencyIn?.wrapped.symbol

  if (step === 'wrap') {
    if (status === 'active') return t`Wrapping ${nativeSymbol}`
    if (status === 'success') return t`Wrapped ${nativeSymbol}`
    return t`Wrap ${nativeSymbol}`
  }

  if (step === 'approve') {
    if (status === 'active') return t`Approving ${inputSymbol}`
    if (status === 'success') return t`Approved ${inputSymbol}`
    return t`Approve ${inputSymbol}`
  }

  if (status === 'active') return t`Signing order`
  if (status === 'success') return t`Order successfully listed`
  return t`Sign order`
}

const isOrderComplete = (state: ProcessingOrderState) =>
  state.show &&
  !!state.steps.length &&
  state.steps.every(step => state.completedSteps.includes(step)) &&
  !state.errorStep

const ProcessingStepRow = ({
  index,
  step,
  status,
  chainId,
  currencyIn,
  onRetryStep,
}: {
  index: number
  step: ProcessingOrderStep
  status: ProcessingOrderStepStatus
  chainId: ChainId
  currencyIn: Currency | undefined
  onRetryStep: (step: ProcessingOrderStep) => void
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
      {getStepLabel({ step, status, chainId, currencyIn })}
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

const ProcessingOrderModal = ({
  chainId,
  currencyIn,
  processing,
  onViewOrder,
}: {
  chainId: ChainId
  currencyIn: Currency | undefined
  processing: ProcessingOrderController
  onViewOrder: () => void
}) => {
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
            <HStack className="gap-3 pt-1">
              <ButtonOutlined onClick={dismiss} className="!h-10 flex-1 !p-0">
                <Trans>Close</Trans>
              </ButtonOutlined>
              <ButtonPrimary onClick={onViewOrder} className="!h-10 flex-1 !p-0">
                <Trans>View Order</Trans>
              </ButtonPrimary>
            </HStack>
          )}
        </Stack>
      </Stack>
    </Modal>
  )
}

export default ProcessingOrderModal
