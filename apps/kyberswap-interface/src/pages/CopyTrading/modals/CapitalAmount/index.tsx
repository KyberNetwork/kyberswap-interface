import { ChainId, Token } from '@kyberswap/ks-sdk-core'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { HStack, Stack } from 'components/Stack'
import {
  CAPITAL_PERCENTAGES,
  type CapitalPercentage,
  type CapitalPreset,
} from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { cn } from 'utils/cn'

type CapitalAmountInputProps = {
  amount: string
  amountError?: string
  inputId: string
  isPreparing: boolean
  label: string
  onAmountChange: (amount: string) => void
  onPercentageChange: (percentage: CapitalPercentage) => void
  presetAmounts?: CapitalPreset[]
  presetsEnabled: boolean
  quoteCurrency?: Token
  selectedChainId: number
  walletBalanceText: string
}

const CapitalAmountInput = ({
  amount,
  amountError,
  inputId,
  isPreparing,
  label,
  onAmountChange,
  onPercentageChange,
  presetAmounts,
  presetsEnabled,
  quoteCurrency,
  selectedChainId,
  walletBalanceText,
}: CapitalAmountInputProps) => (
  <Stack className="gap-2">
    <span className="text-sm font-medium text-text">{label}</span>
    <CurrencyInputPanel
      value={amount}
      onUserInput={onAmountChange}
      error={!!amountError}
      currency={quoteCurrency}
      customBalanceText={walletBalanceText}
      customChainId={selectedChainId as ChainId}
      disableCurrencySelect
      disabledInput={isPreparing}
      id={inputId}
      dataTestId={inputId}
      onBalanceClick={() => onPercentageChange(100)}
      balanceActions={
        <HStack className="items-center gap-1">
          {CAPITAL_PERCENTAGES.map(percentage => {
            const preset = presetAmounts?.find(item => item.percentage === percentage)
            const selected = !!preset && amount === preset.amount

            return (
              <button
                key={percentage}
                type="button"
                disabled={isPreparing || !presetsEnabled}
                onClick={() => onPercentageChange(percentage)}
                className={cn(
                  'rounded-full bg-subText-20 px-2 py-0.5 text-xs font-medium text-subText hover:text-text',
                  selected && 'bg-background text-text',
                  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-subText',
                )}
              >
                {percentage}%
              </button>
            )
          })}
        </HStack>
      }
      positionMax="top"
    />
    {amountError && (
      <span role="alert" className="px-1 text-xs text-red">
        {amountError}
      </span>
    )}
  </Stack>
)

export default CapitalAmountInput
