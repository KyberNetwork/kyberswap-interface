import { ChainId, Token } from '@kyberswap/ks-sdk-core'

import { ButtonEmpty } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Loader from 'components/Loader'
import { HStack, Stack } from 'components/Stack'
import { CAPITAL_PERCENTAGES, type CapitalPercentage } from 'pages/CopyTrading/modals/CapitalAmount/capital'

type CapitalAmountInputProps = {
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
}: CapitalAmountInputProps) => (
  <Stack className="gap-2">
    <label className="text-sm font-medium text-text" htmlFor={inputId}>
      {label}
    </label>
    <CurrencyInputPanel
      value={amount}
      onUserInput={onAmountChange}
      error={!!amountError}
      currency={quoteCurrency}
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
      <p role="alert" className="px-1 text-xs text-red">
        {amountError}
      </p>
    )}
  </Stack>
)

export default CapitalAmountInput
