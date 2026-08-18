import { type ReactNode, useId, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, RotateCw } from 'react-feather'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import type { PreparedActionFlowState } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { ExternalLink } from 'theme'
import { ButtonText, CloseIcon } from 'theme/components'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'
import { getEtherscanLink } from 'utils/explorer'

type ReviewRowProps = {
  isLoading?: boolean
  label: ReactNode
  value: ReactNode
}

export const ReviewRow = ({ isLoading = false, label, value }: ReviewRowProps) => {
  const [skeletonWidth] = useState(() => 48 + Math.floor(Math.random() * 49))
  const labelTitle = typeof label === 'string' || typeof label === 'number' ? String(label) : undefined
  const valueTitle = !isLoading && (typeof value === 'string' || typeof value === 'number') ? String(value) : undefined

  return (
    <HStack className="min-w-0 items-start justify-between gap-4 text-sm">
      <span className="max-w-[45%] shrink-0 truncate text-subText" title={labelTitle}>
        {label}
      </span>
      <span className="w-0 flex-1 truncate text-right font-medium text-text" title={valueTitle}>
        {isLoading ? <Skeleton width={skeletonWidth} height={16} variant="darkSubtle" /> : value}
      </span>
    </HStack>
  )
}

export const ReviewSection = ({ children, title }: { children: ReactNode; title?: string }) => (
  <Stack className="min-w-0 gap-2 rounded-xl bg-white-04 px-4 py-3">
    {title && <span className="text-sm font-medium text-text">{title}</span>}
    {children}
  </Stack>
)

type PreparedActionSuccessActionsProps = {
  onClose: () => void
  onPrimaryAction: () => void
  primaryLabel: string
}

export const PreparedActionSuccessActions = ({
  onClose,
  onPrimaryAction,
  primaryLabel,
}: PreparedActionSuccessActionsProps) => (
  <HStack className="w-full gap-3">
    <ButtonOutlined type="button" className="flex-1" onClick={onClose}>
      Close
    </ButtonOutlined>
    <ButtonPrimary type="button" className="flex-1" onClick={onPrimaryAction}>
      {primaryLabel}
    </ButtonPrimary>
  </HStack>
)

type PreparedActionModalProps = {
  children: ReactNode
  confirmDisabled?: boolean
  confirmLabel: string
  confirmLoading?: boolean
  confirmVariant?: 'error' | 'primary' | 'warning'
  isOpen: boolean
  onBack?: () => void
  onConfirm: () => void
  onDismiss: () => void
  onRetry: () => void
  review: ReactNode
  state: PreparedActionFlowState
  successActions?: ReactNode
  successText?: ReactNode
  successTitle?: string
  title: ReactNode
  width?: number
}

const isProcessing = (state: PreparedActionFlowState) =>
  ['awaiting_signature', 'confirming', 'syncing'].includes(state.phase)

const getProcessingCopy = (state: PreparedActionFlowState) => {
  if (state.phase === 'awaiting_signature') {
    return {
      title: 'Confirm in your wallet',
      text: 'Review and confirm this transaction in your wallet to continue.',
    }
  }
  if (state.phase === 'confirming') {
    return { title: 'Transaction submitted', text: 'Your transaction is waiting for on-chain confirmation.' }
  }
  return {
    title: 'Transaction confirmed',
    text: 'Updating your latest Copy Trading data.',
  }
}

type RecoveryViewModel = {
  retryLabel: string
  showBackAction: boolean
  title?: string
}

const getRecoveryViewModel = (state: PreparedActionFlowState): RecoveryViewModel | undefined => {
  switch (state.phase) {
    case 'pending':
      return { retryLabel: 'Try again', showBackAction: false, title: 'Update in progress' }
    case 'unavailable':
      return { retryLabel: 'Try again', showBackAction: false, title: 'Action unavailable' }
    case 'expired':
      return { retryLabel: 'Try again', showBackAction: true, title: 'Review expired' }
    case 'error':
      return { retryLabel: 'Try again', showBackAction: true }
    case 'sync_error':
      return state.retryStage === 'receipt'
        ? { retryLabel: 'Check confirmation', showBackAction: false, title: 'Transaction submitted' }
        : { retryLabel: 'Refresh status', showBackAction: false, title: 'Transaction confirmed' }
    default:
      return undefined
  }
}

const PreparedActionModal = ({
  children,
  confirmDisabled,
  confirmLabel,
  confirmLoading = false,
  confirmVariant = 'primary',
  isOpen,
  onBack,
  onConfirm,
  onDismiss,
  onRetry,
  review,
  state,
  successActions,
  successText = 'The transaction is confirmed on-chain. Copy Trading data will refresh in the background.',
  successTitle = 'Action completed',
  title,
  width = 460,
}: PreparedActionModalProps) => {
  const [expandedError, setExpandedError] = useState<string>()
  const errorDetailId = useId()
  const chainId = Number(state.action?.chainId)
  const scanLink = state.hash && chainId ? getEtherscanLink(chainId, state.hash, 'transaction') : undefined
  const processing = isProcessing(state)
  const processingCopy = getProcessingCopy(state)
  const recovery = getRecoveryViewModel(state)
  const reviewPreparing = state.phase === 'review' && state.isPreparing === true
  const interactionLocked = confirmLoading || reviewPreparing
  const recoveryError = state.error ? friendlyError(state.error) : undefined
  const hasErrorDetail = state.phase === 'error' && !!state.error && recoveryError !== state.error
  const showErrorDetail = hasErrorDetail && expandedError === state.error
  const RecoveryBackButton = recovery?.showBackAction ? ButtonOutlined : ButtonLight
  const RecoveryRetryButton = recovery?.showBackAction ? ButtonLight : ButtonPrimary
  const ConfirmButton = confirmVariant === 'primary' ? ButtonPrimary : ButtonLight

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={processing || interactionLocked ? undefined : onDismiss}
      maxWidth={width}
      width="calc(100vw - 32px)"
      borderRadius={16}
      className="!overflow-hidden"
    >
      <Stack className="max-h-[90vh] w-full p-5 max-sm:p-4">
        <Stack className="ks-scrollbar min-h-0 gap-5 overflow-y-auto">
          <HStack className="min-w-0 items-start justify-between gap-4">
            {typeof title === 'string' ? (
              <h2 className="min-w-0 flex-1 truncate text-xl font-medium leading-tight text-text" title={title}>
                {title}
              </h2>
            ) : (
              title
            )}
            {!processing && (
              <ButtonText className="shrink-0" aria-label="Close" disabled={interactionLocked} onClick={onDismiss}>
                <CloseIcon />
              </ButtonText>
            )}
          </HStack>

          {state.phase === 'idle' && children}

          {state.phase === 'review' && (
            <Stack className="gap-4">
              {review}
              {!!state.action?.warnings?.length && (
                <Stack className="gap-1 rounded-xl bg-warning-20 px-3 py-2 text-xs text-warning">
                  {state.action.warnings.map(warning => (
                    <span key={warning}>{warning.replace('PREPARED_ACTION_WARNING_', '').replaceAll('_', ' ')}</span>
                  ))}
                </Stack>
              )}
              <HStack className="gap-3">
                {onBack && (
                  <ButtonOutlined type="button" className="flex-1" disabled={interactionLocked} onClick={onBack}>
                    Back
                  </ButtonOutlined>
                )}
                <ConfirmButton
                  type="button"
                  className="flex-1"
                  color={
                    confirmVariant === 'error'
                      ? 'var(--ks-red)'
                      : confirmVariant === 'warning'
                      ? 'var(--ks-warning)'
                      : undefined
                  }
                  disabled={interactionLocked || confirmDisabled}
                  onClick={onConfirm}
                >
                  {interactionLocked ? <Dots>{confirmLabel}</Dots> : confirmLabel}
                </ConfirmButton>
              </HStack>
            </Stack>
          )}

          {processing && (
            <Stack className="items-center gap-4 text-center">
              <Loader size="48px" />
              <Stack className="items-center gap-1">
                <span className="text-base font-medium text-text">{processingCopy.title}</span>
                <span className="max-w-[340px] text-sm text-subText">{processingCopy.text}</span>
              </Stack>
              {scanLink && (
                <ExternalLink href={scanLink} className="text-sm text-primary">
                  View on explorer ↗
                </ExternalLink>
              )}
            </Stack>
          )}

          {state.phase === 'success' && (
            <Stack className="items-center gap-4 text-center">
              <CheckCircle size={48} className="text-primary" />
              <Stack className="items-center gap-1">
                <span className="text-base font-medium text-text">{successTitle}</span>
                {successText && <span className="max-w-[340px] text-sm text-subText">{successText}</span>}
              </Stack>
              {scanLink && (
                <ExternalLink href={scanLink} className="text-sm text-primary">
                  View on explorer ↗
                </ExternalLink>
              )}
              {successActions ?? (
                <ButtonPrimary type="button" onClick={onDismiss}>
                  Done
                </ButtonPrimary>
              )}
            </Stack>
          )}

          {recovery && (
            <Stack className="items-center gap-4 text-center">
              {state.phase === 'pending' ? (
                <Clock size={44} className="text-warning" />
              ) : (
                <AlertCircle
                  size={44}
                  className={cn(state.phase === 'sync_error' ? 'text-warning' : 'fill-red text-red')}
                />
              )}
              <Stack className="w-full items-center gap-1">
                {state.phase === 'error' ? (
                  <>
                    {recoveryError && (
                      <span className="max-w-[360px] text-base font-medium leading-6 text-red">{recoveryError}</span>
                    )}
                    {hasErrorDetail && (
                      <Stack className="w-full items-center gap-0">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:text-primary/80"
                          aria-controls={errorDetailId}
                          aria-expanded={showErrorDetail}
                          onClick={() =>
                            setExpandedError(current => (current === state.error ? undefined : state.error))
                          }
                        >
                          {showErrorDetail ? 'Show less' : 'Show more'}
                        </button>
                        <div
                          id={errorDetailId}
                          aria-hidden={!showErrorDetail}
                          className={cn(
                            'grid w-full transition-[grid-template-rows,opacity] duration-200 ease-in-out',
                            showErrorDetail ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                          )}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div className="pt-2">
                              <div className="max-h-[200px] w-full overflow-y-auto break-words rounded bg-buttonBlack/40 p-3 text-center text-[10px] leading-4 text-text">
                                {state.error}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Stack>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-base font-medium text-text">{recovery.title}</span>
                    {recoveryError && <span className="max-w-[360px] text-sm text-subText">{recoveryError}</span>}
                  </>
                )}
              </Stack>
              {scanLink && (
                <ExternalLink href={scanLink} className="text-sm text-primary">
                  View on explorer ↗
                </ExternalLink>
              )}
              <HStack className="w-full gap-3">
                <RecoveryBackButton
                  type="button"
                  className="flex-1"
                  onClick={recovery.showBackAction && onBack ? onBack : onDismiss}
                >
                  {recovery.showBackAction ? 'Back' : 'Close'}
                </RecoveryBackButton>
                <RecoveryRetryButton type="button" className="flex-1" disabled={state.isPreparing} onClick={onRetry}>
                  {state.isPreparing ? (
                    <Dots>{recovery.retryLabel}</Dots>
                  ) : (
                    <HStack className="items-center justify-center gap-2">
                      <RotateCw size={15} />
                      {recovery.retryLabel}
                    </HStack>
                  )}
                </RecoveryRetryButton>
              </HStack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Modal>
  )
}

export default PreparedActionModal
