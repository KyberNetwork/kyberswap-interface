import { Trans } from '@lingui/macro'
import { type ComponentPropsWithRef, type ReactNode } from 'react'

import { ReactComponent as Lock } from 'assets/svg/ic_lock.svg'
import Wallet from 'components/Icons/Wallet'
import NumericalInput from 'components/NumericalInput'
import { cn } from 'utils/cn'

export const InputRow = ({ className, ...props }: ComponentPropsWithRef<'div'>) => (
  <div className={cn('flex flex-row flex-nowrap items-center gap-2', className)} {...props} />
)

const StyledBalanceMax = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={cn(
      'cursor-pointer rounded-full border-none bg-subText-20 px-2 py-0.5 text-xs font-medium text-subText hover:text-text focus-visible:text-text-60 focus-visible:outline-none',
      className,
    )}
  />
)

/** A quick amount offered above the input, e.g. a share of the balance. */
export type AmountShortcut = { label: ReactNode; onClick: () => void; active?: boolean; dataTestId?: string }

/** Quick amounts in the Max chip's style, the one matching the amount entered ringed. */
export const AmountShortcutChips = ({ shortcuts }: { shortcuts: AmountShortcut[] }) => (
  <>
    {shortcuts.map((shortcut, index) => (
      <StyledBalanceMax
        key={index}
        onClick={shortcut.onClick}
        data-testid={shortcut.dataTestId}
        aria-pressed={shortcut.active}
        className={cn(shortcut.active && 'text-text ring-1 ring-subText/60')}
      >
        {shortcut.label}
      </StyledBalanceMax>
    ))}
  </>
)

type BalanceRowProps = {
  balanceActionsEnabled: boolean
  amountShortcuts?: AmountShortcut[]
  customBalanceText?: string
  label?: ReactNode
  onHalf?: () => void
  onMax?: () => void
  positionLabel: 'in' | 'out'
  positionMax: 'inline' | 'top'
  selectedCurrencyBalance?: { toSignificant: (digits: number) => string }
}

export const BalanceRow = ({
  balanceActionsEnabled,
  amountShortcuts,
  customBalanceText,
  label,
  onHalf,
  onMax,
  positionLabel,
  positionMax,
  selectedCurrencyBalance,
}: BalanceRowProps) => {
  const showTopActions =
    (onMax || onHalf || !!amountShortcuts?.length) && positionMax === 'top' && balanceActionsEnabled
  const balance = customBalanceText ?? selectedCurrencyBalance?.toSignificant(10) ?? 0

  return (
    <div className="flex min-h-5 items-center justify-end gap-2 text-xs">
      {(label && positionLabel === 'in') || showTopActions ? (
        <div className="flex flex-1 items-center gap-1">
          {label && positionLabel === 'in' && label}
          {showTopActions && !amountShortcuts?.length && onMax && (
            <StyledBalanceMax onClick={onMax}>
              <Trans>Max</Trans>
            </StyledBalanceMax>
          )}
          {showTopActions && !amountShortcuts?.length && onHalf && (
            <StyledBalanceMax onClick={onHalf}>
              <Trans>Half</Trans>
            </StyledBalanceMax>
          )}
        </div>
      ) : null}

      {showTopActions && !!amountShortcuts?.length && <AmountShortcutChips shortcuts={amountShortcuts} />}
      <div onClick={onMax} className={cn('group flex items-center gap-1', onMax && 'cursor-pointer')}>
        <Wallet className="text-subText group-hover:text-text" />
        <span className="font-medium text-subText group-hover:text-text" data-testid="balance">
          {balance}
        </span>
      </div>
    </div>
  )
}

type AmountInputControlsProps = {
  balanceActionsEnabled: boolean
  readOnlyInput?: boolean
  disabledInput?: boolean
  error?: boolean
  estimatedUsd?: string
  lockIcon?: boolean
  maxLength?: number
  onFocus?: () => void
  onMax?: () => void
  onUserInput?: (value: string) => void
  positionMax: 'inline' | 'top'
  value: string
}

export const AmountInputControls = ({
  balanceActionsEnabled,
  readOnlyInput,
  disabledInput,
  error,
  estimatedUsd,
  lockIcon,
  maxLength,
  onFocus,
  onMax,
  onUserInput,
  positionMax,
  value,
}: AmountInputControlsProps) => {
  const showInlineMax = balanceActionsEnabled && onMax && positionMax === 'inline'

  return (
    <>
      <NumericalInput
        error={error}
        className="token-amount-input"
        data-testid="token-amount-input"
        value={value}
        disabled={disabledInput}
        readOnly={readOnlyInput}
        maxLength={maxLength}
        onUserInput={onUserInput}
        onFocus={onFocus}
      />
      {estimatedUsd ? (
        <span className="text-sm font-medium text-border">~{estimatedUsd}</span>
      ) : (
        showInlineMax && (
          <StyledBalanceMax onClick={onMax}>
            <Trans>MAX</Trans>
          </StyledBalanceMax>
        )
      )}
      {lockIcon && <Lock className="h-4 text-subText" />}
    </>
  )
}
