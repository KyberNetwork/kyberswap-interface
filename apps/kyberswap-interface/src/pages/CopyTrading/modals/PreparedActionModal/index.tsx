import { type ReactNode } from 'react'
import { AlertCircle, CheckCircle, Clock, RotateCw } from 'react-feather'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import type { PreparedActionFlowState } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { ExternalLink } from 'theme'
import { ButtonText, CloseIcon } from 'theme/components'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'

export const ReviewRow = ({ label, value }: { label: ReactNode; value: ReactNode }) => {
  const labelTitle = typeof label === 'string' || typeof label === 'number' ? String(label) : undefined
  const valueTitle = typeof value === 'string' || typeof value === 'number' ? String(value) : undefined

  return (
    <HStack className="min-w-0 items-start justify-between gap-4 text-sm">
      <span className="max-w-[45%] shrink-0 truncate text-subText" title={labelTitle}>
        {label}
      </span>
      <span className="w-0 flex-1 truncate text-right font-medium text-text" title={valueTitle}>
        {value}
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
    return { title: 'Confirm in your wallet', text: 'Review and approve the exact prepared transaction.' }
  }
  if (state.phase === 'confirming') {
    return { title: 'Transaction submitted', text: 'Waiting for an on-chain confirmation.' }
  }
  return {
    title: 'Updating Copy Trading',
    text: 'Your transaction is confirmed. We’re refreshing the latest data.',
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
  successText,
  successTitle = 'Action completed',
  title,
  width = 460,
}: PreparedActionModalProps) => {
  const chainId = Number(state.action?.chainId)
  const scanLink = state.hash && chainId ? getEtherscanLink(chainId, state.hash, 'transaction') : undefined
  const processing = isProcessing(state)
  const processingCopy = getProcessingCopy(state)
  const isRecoverable = ['pending', 'unavailable', 'error', 'sync_error'].includes(state.phase)
  const receiptConfirmationPending = state.phase === 'sync_error' && state.retryStage === 'receipt'
  const retryLabel = receiptConfirmationPending
    ? 'Check confirmation'
    : state.phase === 'sync_error'
    ? 'Refresh status'
    : 'Try again'
  const ConfirmButton = confirmVariant === 'primary' ? ButtonPrimary : ButtonLight
  const confirmColor =
    confirmVariant === 'error' ? 'var(--ks-red)' : confirmVariant === 'warning' ? 'var(--ks-warning)' : undefined

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={processing || confirmLoading ? undefined : onDismiss}
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
              <ButtonText className="shrink-0" aria-label="Close" disabled={confirmLoading} onClick={onDismiss}>
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
                  <ButtonOutlined type="button" className="flex-1" disabled={confirmLoading} onClick={onBack}>
                    Back
                  </ButtonOutlined>
                )}
                <ConfirmButton
                  type="button"
                  className="flex-1"
                  color={confirmColor}
                  disabled={confirmLoading || confirmDisabled}
                  onClick={onConfirm}
                >
                  {confirmLoading ? <Dots>{confirmLabel}</Dots> : confirmLabel}
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

          {isRecoverable && (
            <Stack className="items-center gap-4 text-center">
              {state.phase === 'pending' ? (
                <Clock size={44} className="text-warning" />
              ) : (
                <AlertCircle
                  size={44}
                  className={cn(state.phase === 'sync_error' ? 'text-warning' : 'fill-red text-red')}
                />
              )}
              <Stack className="items-center gap-1">
                <span className="text-base font-medium text-text">
                  {state.phase === 'sync_error'
                    ? receiptConfirmationPending
                      ? 'Transaction submitted'
                      : 'Transaction confirmed'
                    : state.phase === 'pending'
                    ? 'State update pending'
                    : state.phase === 'unavailable'
                    ? 'Action unavailable'
                    : 'Unable to continue'}
                </span>
                <span className="max-w-[360px] text-sm text-subText">{state.error}</span>
              </Stack>
              {scanLink && (
                <ExternalLink href={scanLink} className="text-sm text-primary">
                  View on explorer ↗
                </ExternalLink>
              )}
              <HStack className="w-full gap-3">
                <ButtonLight type="button" className="flex-1" onClick={onDismiss}>
                  Close
                </ButtonLight>
                <ButtonPrimary type="button" className="flex-1" disabled={state.isPreparing} onClick={onRetry}>
                  {state.isPreparing ? (
                    <Dots>{retryLabel}</Dots>
                  ) : (
                    <HStack className="items-center justify-center gap-2">
                      <RotateCw size={15} />
                      {retryLabel}
                    </HStack>
                  )}
                </ButtonPrimary>
              </HStack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Modal>
  )
}

export default PreparedActionModal
