import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { AlertCircle, RefreshCw, X } from 'react-feather'

import { ButtonLight } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import type {
  ProcessingOrderState,
  ProcessingOrderStep,
  ProcessingOrderStepStatus,
} from 'components/swapv2/LimitOrder/hooks/useProcessingOrder'
import { NativeCurrencies } from 'constants/tokens'
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
    <span className="flex size-[18px] items-center justify-center rounded-full bg-subText/20 text-xs font-medium text-subText">
      {index + 1}
    </span>
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

const ProcessingOrderModal = ({
  chainId,
  currencyIn,
  state,
  onDismiss,
  onRetryStep,
  onRunStep,
}: {
  chainId: ChainId
  currencyIn: Currency | undefined
  state: ProcessingOrderState
  onDismiss: () => void
  onRetryStep: (step: ProcessingOrderStep) => void
  onRunStep: (step: ProcessingOrderStep) => void
}) => {
  useEffect(() => {
    if (!state.show || !state.currentStep || state.errorStep) return
    onRunStep(state.currentStep)
  }, [onRunStep, state.currentStep, state.errorStep, state.show])

  return (
    <Modal isOpen={state.show} onDismiss={onDismiss} maxWidth={425} borderRadius={14}>
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-2xl font-medium text-text">{t`Processing Order`}</div>
          <X size={22} className="cursor-pointer text-text" onClick={onDismiss} />
        </div>

        <div className="flex flex-col gap-4">
          {state.steps.map((step, index) => {
            const status = getStepStatus(state, step)
            return (
              <div className="flex min-h-[24px] items-center justify-between gap-3" key={step}>
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-2 text-base font-medium',
                    status === 'idle' && 'text-subText opacity-60',
                    status === 'active' && 'text-text',
                    status === 'success' && 'text-primary',
                    status === 'error' && 'text-red',
                  )}
                >
                  <StepIcon index={index} status={status} />
                  <span className="truncate">{getStepLabel({ step, status, chainId, currencyIn })}</span>
                </div>

                {status === 'error' ? (
                  <ButtonLight
                    onClick={() => onRetryStep(step)}
                    width="auto"
                    className="h-8 shrink-0 gap-1 rounded-full px-4 py-0 text-primary"
                  >
                    <RefreshCw size={14} />
                    {t`Retry`}
                  </ButtonLight>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

export default ProcessingOrderModal
