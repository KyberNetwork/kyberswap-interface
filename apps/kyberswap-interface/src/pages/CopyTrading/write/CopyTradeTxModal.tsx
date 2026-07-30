import type { ReactNode } from 'react'
import { CheckCircle, X } from 'react-feather'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import type { CopyTxStatus } from 'pages/CopyTrading/write/useCopyTradeTx'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'

type CopyTradeTxModalProps = {
  isOpen: boolean
  onDismiss: () => void
  status: CopyTxStatus
  title: ReactNode
  pendingText?: string
  successTitle?: string
  successText?: ReactNode
  children: ReactNode
  width?: string
  /** Release this modal's focus lock while a nested modal (e.g. token selector) is open. */
  bypassFocusLock?: boolean
}

const ModalShell = ({
  title,
  onDismiss,
  children,
  width,
  dismissable = true,
  bypassFocusLock = false,
}: {
  title: ReactNode
  onDismiss: () => void
  children: ReactNode
  width?: string
  dismissable?: boolean
  bypassFocusLock?: boolean
}) => (
  <Modal
    isOpen
    onDismiss={dismissable ? onDismiss : undefined}
    maxWidth={width || 460}
    width={width}
    borderRadius="12px"
    bypassFocusLock={bypassFocusLock}
  >
    <Stack className="w-full gap-4 p-6">
      <HStack className="items-start justify-between gap-3">
        {typeof title === 'string' ? <h2 className="text-lg font-medium text-text">{title}</h2> : title}
        {dismissable && (
          <button type="button" onClick={onDismiss} className="shrink-0 text-subText transition-colors hover:text-text">
            <X size={20} />
          </button>
        )}
      </HStack>
      {children}
    </Stack>
  </Modal>
)

export const CopyTradeTxModal = ({
  isOpen,
  onDismiss,
  status,
  title,
  pendingText,
  successTitle = 'Success',
  successText,
  children,
  width,
  bypassFocusLock,
}: CopyTradeTxModalProps) => {
  const { chainId } = useActiveWeb3React()

  if (!isOpen) return null

  const scanLink = status.hash ? getEtherscanLink(chainId, status.hash, 'transaction') : undefined
  const showStep = status.stepCount > 1

  if (status.state === 'pending') {
    return (
      <ModalShell title={title} onDismiss={onDismiss} width={width} dismissable={false}>
        <Stack className="items-center gap-4 py-6 text-center">
          <Loader size="48px" />
          <Stack className="gap-1">
            <span className="text-base font-medium text-text">{status.stepLabel || pendingText || 'Confirming…'}</span>
            {showStep && (
              <span className="text-sm text-subText">
                Step {status.stepIndex} of {status.stepCount}
              </span>
            )}
            <span className="text-sm text-subText">Confirm this transaction in your wallet.</span>
          </Stack>
        </Stack>
      </ModalShell>
    )
  }

  if (status.state === 'submitted' || status.state === 'confirmed') {
    const confirmed = status.state === 'confirmed'
    return (
      <ModalShell title={title} onDismiss={onDismiss} width={width}>
        <Stack className="items-center gap-4 py-4 text-center">
          <CheckCircle size={48} className={cn(confirmed ? 'text-primary' : 'text-warning')} />
          <Stack className="gap-1">
            <span className="text-base font-medium text-text">
              {confirmed
                ? successTitle
                : showStep
                ? `Step ${status.stepIndex} of ${status.stepCount} submitted`
                : 'Submitted'}
            </span>
            {confirmed && successText ? (
              <span className="text-sm text-subText">{successText}</span>
            ) : (
              <span className="text-sm text-subText">
                {confirmed ? 'Transaction confirmed.' : 'Waiting for on-chain confirmation…'}
              </span>
            )}
          </Stack>
          {scanLink && (
            <ExternalLink href={scanLink} className="text-sm text-primary">
              View on explorer ↗
            </ExternalLink>
          )}
          {confirmed && (
            <ButtonPrimary type="button" padding="10px 12px" onClick={onDismiss}>
              Done
            </ButtonPrimary>
          )}
        </Stack>
      </ModalShell>
    )
  }

  if (status.state === 'error') {
    return (
      <ModalShell title={title} onDismiss={onDismiss} width={width}>
        <Stack className="items-center gap-4 py-4 text-center">
          <X size={44} className="text-red" />
          <span className="text-sm text-subText">{status.error || 'Transaction failed.'}</span>
          <ButtonLight type="button" padding="10px 12px" onClick={onDismiss}>
            Close
          </ButtonLight>
        </Stack>
      </ModalShell>
    )
  }

  return (
    <ModalShell title={title} onDismiss={onDismiss} width={width} bypassFocusLock={bypassFocusLock}>
      {children}
    </ModalShell>
  )
}
