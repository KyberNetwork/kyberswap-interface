import { Trans } from '@lingui/macro'
import { type ComponentPropsWithRef, type ReactNode } from 'react'

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
  selectedCurrencyBalance,
}: BalanceRowProps) => {
  const showTopActions = (onMax || onHalf || !!amountShortcuts?.length) && balanceActionsEnabled
  const balance = customBalanceText ?? selectedCurrencyBalance?.toSignificant(10) ?? 0
  const hasInlineLabel = !!label && positionLabel === 'in'

  return (
    <div className="flex min-h-5 items-center justify-end gap-2 text-xs">
      {hasInlineLabel || showTopActions ? (
        <div className="flex flex-1 items-center gap-1">
          {hasInlineLabel && label}
          {showTopActions && !hasInlineLabel && !!amountShortcuts?.length && (
            <AmountShortcutChips shortcuts={amountShortcuts} />
          )}
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

      {showTopActions && hasInlineLabel && !!amountShortcuts?.length && (
        <AmountShortcutChips shortcuts={amountShortcuts} />
      )}
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
  disabledInput?: boolean
  error?: boolean
  estimatedUsd?: string
  maxLength?: number
  onFocus?: () => void
  onUserInput?: (value: string) => void
  value: string
}

export const AmountInputControls = ({
  disabledInput,
  error,
  estimatedUsd,
  maxLength,
  onFocus,
  onUserInput,
  value,
}: AmountInputControlsProps) => {
  return (
    <>
      <NumericalInput
        error={error}
        className="token-amount-input"
        data-testid="token-amount-input"
        value={value}
        disabled={disabledInput}
        maxLength={maxLength}
        onUserInput={onUserInput}
        onFocus={onFocus}
      />
      {estimatedUsd && <span className="text-sm font-medium text-border">~{estimatedUsd}</span>}
    </>
  )
}
