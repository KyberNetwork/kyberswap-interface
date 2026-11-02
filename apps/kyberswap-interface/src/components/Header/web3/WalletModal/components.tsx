import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import React from 'react'
import { ChevronLeft } from 'react-feather'

import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import Skeleton from 'components/Skeleton'
import { PRIVACY_POLICY_PATH, TERMS_OF_USE } from 'constants/index'
import { CloseIcon, ExternalLink } from 'theme'
import { cn } from 'utils/cn'

export const Shell = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col flex-nowrap p-0', className)} {...rest}>
    {children}
  </div>
)

export const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('relative flex flex-col gap-6 p-5', className)}>{children}</div>
)

export const Content = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-b-[20px]', className)}>{children}</div>
)

export const Header = ({
  title,
  onBack,
  onClose,
}: {
  title: React.ReactNode
  onBack?: () => void
  onClose: () => void
}) => (
  <RowBetween className="gap-2">
    {onBack && (
      <button type="button" aria-label={t`Back`} onClick={onBack} className="flex items-center hover:brightness-75">
        <ChevronLeft className="text-primary" />
      </button>
    )}
    <div className="flex flex-1 items-center gap-1 text-xl font-medium">{title}</div>
    <button type="button" aria-label={t`Close`} onClick={onClose} className="flex items-center">
      <CloseIcon />
    </button>
  </RowBetween>
)

type WalletModalShellProps = {
  title?: React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  onBack?: () => void
  onClose?: () => void
  onDismiss: () => void
}

export const WalletModalShell = ({
  title = <Trans>Connect your Wallet</Trans>,
  children,
  isOpen,
  onBack,
  onClose,
  onDismiss,
}: WalletModalShellProps) => (
  <Modal
    isOpen={isOpen}
    onDismiss={onDismiss}
    minHeight={false}
    maxHeight={90}
    maxWidth={600}
    bypassScrollLock
    bypassFocusLock
    zindex={99999}
  >
    <Shell>
      <Section>
        <Header title={title} onBack={onBack} onClose={onClose ?? onDismiss} />
        <div className="flex flex-col gap-4">{children}</div>
      </Section>
    </Shell>
  </Modal>
)

type TermsProps =
  | {
      checked: boolean
      onChange: (checked: boolean) => void
      className?: string
    }
  | {
      children: React.ReactNode
      onClick?: () => void
      className?: string
      style?: React.CSSProperties
    }

export const Terms = (props: TermsProps) => {
  const isControlled = 'checked' in props

  return (
    <div
      onClick={isControlled ? () => props.onChange(!props.checked) : props.onClick}
      style={isControlled ? undefined : props.style}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-2xl bg-buttonBlack/30 px-3 py-2 text-xs font-medium leading-4 accent-primary hover:bg-buttonBlack/50',
        props.className,
      )}
    >
      {isControlled ? (
        <>
          <input
            type="checkbox"
            checked={props.checked}
            onChange={() => {}}
            data-testid="accept-term"
            className="size-3.5 min-w-3.5 cursor-pointer"
          />
          <span className="text-subText">
            <Trans>Accept </Trans>{' '}
            <ExternalLink href={TERMS_OF_USE.file} onClick={e => e.stopPropagation()}>
              <Trans>KyberSwap&lsquo;s Terms of Use</Trans>
            </ExternalLink>{' '}
            <Trans>and</Trans>{' '}
            <ExternalLink href={PRIVACY_POLICY_PATH} onClick={e => e.stopPropagation()}>
              <Trans>Privacy Policy</Trans>
            </ExternalLink>
            {'. '}
            <span className="text-[10px]">
              <Trans>Last updated: {dayjs.utc(TERMS_OF_USE.publishedAt).format('DD MMM YYYY')}</Trans>
            </span>
          </span>
        </>
      ) : (
        props.children
      )}
    </div>
  )
}

export const Options = ({
  children,
  loading = false,
  className,
}: {
  children?: React.ReactNode
  loading?: boolean
  className?: string
}) => (
  <div aria-busy={loading} className={cn('grid grid-cols-2 items-center gap-4 max-sm:grid-cols-1', className)}>
    {loading
      ? Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={36} rounded containerClassName="flex h-9" />
        ))
      : children}
  </div>
)

export const Icon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-center',
      '[&>img]:size-5 [&>img]:rounded [&>span]:size-5 [&>span]:rounded',
      className,
    )}
  >
    {children}
  </div>
)

type OptionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  connected?: boolean
  isDisabled?: boolean
}

export const OptionButton = ({
  connected = false,
  isDisabled = false,
  className,
  children,
  ...props
}: OptionButtonProps) => (
  <button
    type="button"
    {...props}
    disabled={isDisabled}
    data-connected={!isDisabled && connected ? true : undefined}
    className={cn(
      'flex h-9 w-full items-center gap-2 overflow-hidden whitespace-nowrap rounded-full px-2.5 py-2 text-left text-sm font-medium',
      'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-border disabled:grayscale',
      !isDisabled && connected
        ? 'bg-primary text-darkText'
        : 'bg-transparent text-subText enabled:hover:bg-buttonBlack/40 enabled:hover:text-text',
      className,
    )}
  >
    {children}
  </button>
)

type WalletOptionProps = {
  id?: string
  name: string
  icon: string | undefined
  detected?: boolean
  connected?: boolean
  connecting?: boolean
  isDisabled?: boolean
  onClick?: () => void
}

export const WalletOption = ({
  id,
  name,
  icon,
  detected = false,
  connected = false,
  connecting = false,
  isDisabled = false,
  onClick,
}: WalletOptionProps) => (
  <OptionButton id={id} connected={connected} isDisabled={isDisabled} onClick={onClick} aria-busy={connecting}>
    <Icon>
      <img src={icon} alt="" />
    </Icon>
    <span className="min-w-0 truncate">{name}</span>
    {connecting && <Loader className="shrink-0 text-current" />}
    {detected && <span className="flex flex-1 justify-end text-xs font-normal">{t`Detected`}</span>}
  </OptionButton>
)
