import { ChainId, Token } from '@kyberswap/ks-sdk-core'

import { ButtonEmpty } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import NumericalInput from 'components/NumericalInput'
import { HStack, Stack } from 'components/Stack'
import { CAPITAL_PERCENTAGES, type CapitalPercentage } from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { cn } from 'utils/cn'

type CapitalAmountInputProps = {
  mode?: 'default' | 'compact'
  amount: string
  amountError?: string
  inputId: string
  isPreparing: boolean
  label: string
  onAmountChange: (amount: string) => void
  onBalanceClick?: () => void
  onPercentageChange?: (percentage: CapitalPercentage) => void
  presetActions?: readonly { disabled?: boolean; label: string; onClick: () => void }[]
  presetsEnabled: boolean
  quoteCurrency?: Token
  selectedChainId: number
  walletBalanceLoading?: boolean
  walletBalanceText: string
}

const CapitalAmountInput = ({
  mode = 'default',
  amount,
  amountError,
  inputId,
  isPreparing,
  label,
  onAmountChange,
  onBalanceClick,
  onPercentageChange,
  presetActions,
  presetsEnabled,
  quoteCurrency,
  selectedChainId,
  walletBalanceLoading,
  walletBalanceText,
}: CapitalAmountInputProps) => {
  if (mode === 'compact') {
    const actions =
      presetActions ||
      CAPITAL_PERCENTAGES.map(percentage => ({
        label: `${percentage}%`,
        onClick: () => onPercentageChange?.(percentage),
        disabled: false,
      }))
    return (
      <Stack className="gap-2">
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <HStack
          className={cn(
            'min-h-14 items-center gap-2 rounded-2xl border bg-buttonBlack px-3 py-2',
            amountError ? 'border-warning' : 'border-transparent',
          )}
        >
          <span className="shrink-0">
            <CurrencyLogo currency={quoteCurrency} size="22px" />
          </span>
          <NumericalInput
            id={inputId}
            data-testid={inputId}
            value={amount}
            onUserInput={onAmountChange}
            disabled={isPreparing}
            aria-invalid={!!amountError}
            aria-describedby={amountError ? `${inputId}-error` : undefined}
            className="min-w-0 bg-transparent text-xl font-normal"
          />
          <HStack className="shrink-0 items-center gap-1">
            {actions.map(action => (
              <ButtonEmpty
                key={action.label}
                type="button"
                disabled={isPreparing || !presetsEnabled || action.disabled}
                onClick={action.onClick}
                padding="2px 8px"
                className="w-fit bg-subText-20 text-xs text-subText hover:text-text disabled:opacity-40 disabled:hover:text-subText"
              >
                {action.label}
              </ButtonEmpty>
            ))}
          </HStack>
        </HStack>
        {amountError && (
          <p id={`${inputId}-error`} role="alert" className="px-1 text-xs text-warning">
            {amountError}
          </p>
        )}
      </Stack>
    )
  }
  return (
    <Stack className="gap-2">
      <label className="text-sm font-medium text-text" htmlFor={inputId}>
        {label}
      </label>
      <CurrencyInputPanel
        value={amount}
        onUserInput={onAmountChange}
        error={!!amountError}
        errorStyle="warning-border"
        currency={quoteCurrency}
        hideTokenInfo
        customBalanceText={
          walletBalanceLoading ? (
            <Loader aria-label="Loading balance" className="text-subText" size="12px" />
          ) : (
            walletBalanceText
          )
        }
        customChainId={selectedChainId as ChainId}
        disableCurrencySelect
        disabledInput={isPreparing}
        id={inputId}
        dataTestId={inputId}
        onBalanceClick={onBalanceClick || (onPercentageChange ? () => onPercentageChange(100) : undefined)}
        balanceActions={
          <HStack className="items-center gap-1">
            {presetActions
              ? presetActions.map(action => (
                  <ButtonEmpty
                    key={action.label}
                    type="button"
                    disabled={isPreparing || !presetsEnabled || action.disabled}
                    onClick={action.onClick}
                    padding="2px 8px"
                    className="w-fit bg-subText-20 text-xs text-subText hover:text-text disabled:opacity-40 disabled:hover:text-subText"
                  >
                    {action.label}
                  </ButtonEmpty>
                ))
              : CAPITAL_PERCENTAGES.map(percentage => (
                  <ButtonEmpty
                    key={percentage}
                    type="button"
                    disabled={isPreparing || !presetsEnabled}
                    onClick={() => onPercentageChange?.(percentage)}
                    padding="2px 8px"
                    className="w-fit bg-subText-20 text-xs text-subText hover:text-text disabled:opacity-40 disabled:hover:text-subText"
                  >
                    {percentage}%
                  </ButtonEmpty>
                ))}
          </HStack>
        }
        positionMax="top"
      />
      {amountError && (
        <p role="alert" className="px-1 text-xs text-warning">
          {amountError}
        </p>
      )}
    </Stack>
  )
}

export default CapitalAmountInput
