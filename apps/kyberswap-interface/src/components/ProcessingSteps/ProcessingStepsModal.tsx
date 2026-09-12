import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { ReactNode, useEffect, useRef } from 'react'
import { AlertCircle, RotateCw } from 'react-feather'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import type { ProcessingController, ProcessingStepStatus } from 'components/ProcessingSteps/useProcessingSteps'
import { Center, HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { CloseIcon, ExternalLink } from 'theme/components'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'

type ProcessingStepsModalProps<Step extends string> = {
  processing: Pick<ProcessingController<Step>, 'state' | 'dismiss'> & { retryStep?: (step: Step) => void }
  chainId?: ChainId
  title: string
  /** Wording is the caller's: only it knows whether a step signs, deposits or fills. */
  getStepLabel: (step: Step, status: ProcessingStepStatus) => ReactNode
  /** Why the failed step failed. The step row itself only says which one it was. */
  errorMessage?: ReactNode
  /** Offered once every step has succeeded — somewhere to go with what was just created. */
  successAction?: { label: ReactNode; onClick: () => void }
  /** The flow is over: tear down whatever opened it. Fires on every exit, success included. */
  onClose?: () => void
  /** The user walked away rather than following the run to its end — for analytics only. */
  onUserDismiss?: () => void
}

const getStepStatus = <Step extends string>({
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

/** The step list itself. Mounted only while the run is on screen, so it subscribes to nothing at rest. */
const ProcessingStepsBody = <Step extends string>({
  processing,
  chainId,
  title,
  getStepLabel,
  errorMessage,
  successAction,
  onDismiss,
  onSuccessAction,
}: Omit<ProcessingStepsModalProps<Step>, 'onClose' | 'onUserDismiss'> & {
  onDismiss: () => void
  onSuccessAction: () => void
}) => {
  const { state, dismiss, retryStep } = processing
  const { account } = useActiveWeb3React()
  const previousAccount = useRef(account)

  const isComplete =
    !!state.steps.length && state.steps.every(step => state.completedSteps.includes(step)) && !state.errorStep

  // A different wallet is a different set of balances and allowances; the run on screen is not
  // about the account looking at it.
  useEffect(() => {
    const previous = previousAccount.current?.toLowerCase()
    if (previous && previous !== account?.toLowerCase()) dismiss()
    previousAccount.current = account
  }, [account, dismiss])

  return (
    <Stack className="w-full gap-5 p-5">
      <HStack className="items-center justify-between gap-4">
        <div className="text-xl font-medium text-text">{title}</div>
        <CloseIcon onClick={onDismiss} />
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
              <HStack key={step} className="min-h-8 w-full items-center gap-2">
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
                  {getStepLabel(step, status)}
                </span>
                {status === 'error' && state.canRetry && retryStep && (
                  <ButtonLight onClick={() => retryStep(step)} className="w-auto gap-1 px-2 py-1 text-xs">
                    <RotateCw size={14} />
                    {t`Retry`}
                  </ButtonLight>
                )}
              </HStack>
            )
          })}
        </Stack>

        {state.errorStep && errorMessage ? <div className="text-sm text-red">{errorMessage}</div> : null}

        {/* Offered as soon as there is a hash — a transaction that reverts is the case where
            someone most wants to look at it. */}
        {state.txHash && chainId && (
          <ExternalLink href={getEtherscanLink(chainId, state.txHash, 'transaction')} className="text-sm">
            <Trans>View transaction</Trans>
          </ExternalLink>
        )}

        {isComplete && (
          <HStack className="gap-3">
            <ButtonOutlined onClick={onDismiss} className="flex-1">
              <Trans>Close</Trans>
            </ButtonOutlined>
            {successAction && (
              <ButtonPrimary onClick={onSuccessAction} className="flex-1">
                {successAction.label}
              </ButtonPrimary>
            )}
          </HStack>
        )}
      </Stack>
    </Stack>
  )
}

/** Keeps a confirmation on screen while its steps run, so the work finishes in front of the user. */
const ProcessingStepsModal = <Step extends string>({
  processing,
  onClose,
  onUserDismiss,
  ...rest
}: ProcessingStepsModalProps<Step>) => {
  const { state, dismiss } = processing

  const handleDismiss = () => {
    dismiss()
    onUserDismiss?.()
    onClose?.()
  }

  const handleSuccessAction = () => {
    dismiss()
    onClose?.()
    rest.successAction?.onClick()
  }

  return (
    <Modal isOpen={state.show} onDismiss={handleDismiss} maxWidth={420} borderRadius={16}>
      <ProcessingStepsBody
        {...rest}
        processing={processing}
        onDismiss={handleDismiss}
        onSuccessAction={handleSuccessAction}
      />
    </Modal>
  )
}

export default ProcessingStepsModal
