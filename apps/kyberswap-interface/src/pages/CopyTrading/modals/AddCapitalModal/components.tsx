import { Token } from '@kyberswap/ks-sdk-core'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
import CapitalAmountInput from 'pages/CopyTrading/modals/CapitalAmount'
import { type CapitalPercentage } from 'pages/CopyTrading/modals/CapitalAmount/capital'

const CapitalSummaryRow = ({ label, value }: { label: string; value: string }) => (
  <HStack className="items-center justify-between gap-4">
    <span className="text-sm font-medium text-subText">{label}</span>
    <span className="text-base font-medium text-text">{value}</span>
  </HStack>
)

type AddCapitalFormProps = {
  amount: string
  amountError?: string
  amountIsValid: boolean
  availabilityMessage?: string
  currentAllocatedCapital: string
  isPreparing: boolean
  newAllocatedCapital: string
  onAmountChange: (amount: string) => void
  onExpectedChain: boolean
  onPercentageChange: (percentage: CapitalPercentage) => void
  onPrimaryAction: () => void
  presetsEnabled: boolean
  primaryActionLabel: string
  quoteCurrency?: Token
  selectedChainId: number
  walletBalanceLoading?: boolean
  walletBalanceText: string
  accountConnected: boolean
}

export const AddCapitalForm = ({
  accountConnected,
  amount,
  amountError,
  amountIsValid,
  availabilityMessage,
  currentAllocatedCapital,
  isPreparing,
  newAllocatedCapital,
  onAmountChange,
  onExpectedChain,
  onPercentageChange,
  onPrimaryAction,
  presetsEnabled,
  primaryActionLabel,
  quoteCurrency,
  selectedChainId,
  walletBalanceLoading,
  walletBalanceText,
}: AddCapitalFormProps) => {
  return (
    <Stack className="gap-4">
      <CapitalSummaryRow label="Currently allocated" value={currentAllocatedCapital} />

      <CapitalAmountInput
        amount={amount}
        amountError={amountError}
        inputId="copy-trading-add-capital"
        isPreparing={isPreparing}
        label="Add Capital"
        onAmountChange={onAmountChange}
        onPercentageChange={onPercentageChange}
        presetsEnabled={presetsEnabled}
        quoteCurrency={quoteCurrency}
        selectedChainId={selectedChainId}
        walletBalanceLoading={walletBalanceLoading}
        walletBalanceText={walletBalanceText}
      />

      <CapitalSummaryRow label="New allocated capital" value={newAllocatedCapital} />

      <p className="text-sm text-subText">
        Capital will deploy on the agent&apos;s next trade. No immediate swaps. Existing settings apply.
      </p>
      <ButtonPrimary
        type="button"
        disabled={isPreparing || (accountConnected && onExpectedChain && (!amountIsValid || !!availabilityMessage))}
        title={amountError || availabilityMessage}
        onClick={onPrimaryAction}
      >
        {isPreparing ? <Dots>{primaryActionLabel}</Dots> : primaryActionLabel}
      </ButtonPrimary>
    </Stack>
  )
}
