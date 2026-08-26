import { Token } from '@kyberswap/ks-sdk-core'

import { HStack, Stack } from 'components/Stack'
import CapitalAmountInput from 'pages/CopyTrading/modals/CapitalAmount'
import { type CapitalPercentage } from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { PreparedActionFormActions } from 'pages/CopyTrading/modals/PreparedActionModal'

const CapitalSummaryRow = ({ label, value }: { label: string; value: string }) => (
  <HStack className="items-center justify-between gap-4">
    <span className="text-sm font-medium text-subText">{label}</span>
    <span className="text-base font-medium text-text">{value}</span>
  </HStack>
)

type AddCapitalFormProps = {
  amount: string
  amountError?: string
  availabilityMessage?: string
  currentAllocatedCapital: string
  isPreparing: boolean
  newAllocatedCapital: string
  onAmountChange: (amount: string) => void
  onCancel: () => void
  onPercentageChange: (percentage: CapitalPercentage) => void
  onPrimaryAction: () => void
  presetsEnabled: boolean
  primaryActionDisabled: boolean
  primaryActionLabel: string
  quoteCurrency?: Token
  selectedChainId: number
  walletBalanceLoading?: boolean
  walletBalanceText: string
}

export const AddCapitalForm = ({
  amount,
  amountError,
  availabilityMessage,
  currentAllocatedCapital,
  isPreparing,
  newAllocatedCapital,
  onAmountChange,
  onCancel,
  onPercentageChange,
  onPrimaryAction,
  presetsEnabled,
  primaryActionDisabled,
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
        label="Amount to add"
        onAmountChange={onAmountChange}
        onPercentageChange={onPercentageChange}
        presetsEnabled={presetsEnabled}
        quoteCurrency={quoteCurrency}
        selectedChainId={selectedChainId}
        walletBalanceLoading={walletBalanceLoading}
        walletBalanceText={walletBalanceText}
      />

      <CapitalSummaryRow label="New Total" value={newAllocatedCapital} />

      <p className="text-sm text-subText">
        Capital will deploy on the agent&apos;s next trade. No immediate swaps. Existing settings apply.
      </p>
      <PreparedActionFormActions
        cancelDisabled={isPreparing}
        onCancel={onCancel}
        onPrimaryAction={onPrimaryAction}
        primaryActionDisabled={primaryActionDisabled}
        primaryActionLabel={primaryActionLabel}
        primaryActionLoading={isPreparing}
        primaryActionTitle={amountError || availabilityMessage}
      />
    </Stack>
  )
}
