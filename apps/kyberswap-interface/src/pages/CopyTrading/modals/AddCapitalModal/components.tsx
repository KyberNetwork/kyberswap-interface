import { Token } from '@kyberswap/ks-sdk-core'
import type { AddCapitalPreview } from 'services/copyTrading/types/preparedActions'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { Stack } from 'components/Stack'
import CapitalAmountInput from 'pages/CopyTrading/modals/CapitalAmount'
import { type CapitalPercentage, type CapitalPreset } from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import { formatPreparedAmount } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

export const AddCapitalReview = ({
  confirmBalanceError,
  isLoading,
  preview,
}: {
  confirmBalanceError?: string
  isLoading: boolean
  preview?: AddCapitalPreview
}) => {
  const preparedToken = preview?.quoteToken
  const showSkeleton = isLoading && !preview

  return (
    <Stack className="gap-2">
      <ReviewSection title="Review Add Capital">
        <ReviewRow
          isLoading={showSkeleton}
          label="Capital to add"
          value={formatPreparedAmount(preview?.addedCapitalRaw, preparedToken)}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Current allocated capital"
          value={formatPreparedAmount(preview?.currentAllocatedCapital, preparedToken)}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="New allocated capital"
          value={formatPreparedAmount(preview?.newAllocatedCapital, preparedToken)}
        />
      </ReviewSection>
      {confirmBalanceError && (
        <span role="alert" className="text-xs text-red">
          {confirmBalanceError}
        </span>
      )}
    </Stack>
  )
}

type AddCapitalFormProps = {
  agentName?: string
  amount: string
  amountError?: string
  amountIsValid: boolean
  availabilityMessage?: string
  isPreparing: boolean
  onAmountChange: (amount: string) => void
  onExpectedChain: boolean
  onPercentageChange: (percentage: CapitalPercentage) => void
  onPrimaryAction: () => void
  presetAmounts?: CapitalPreset[]
  presetsEnabled: boolean
  primaryActionLabel: string
  quoteCurrency?: Token
  selectedChainId: number
  walletBalanceText: string
  accountConnected: boolean
}

export const AddCapitalForm = ({
  accountConnected,
  agentName,
  amount,
  amountError,
  amountIsValid,
  availabilityMessage,
  isPreparing,
  onAmountChange,
  onExpectedChain,
  onPercentageChange,
  onPrimaryAction,
  presetAmounts,
  presetsEnabled,
  primaryActionLabel,
  quoteCurrency,
  selectedChainId,
  walletBalanceText,
}: AddCapitalFormProps) => {
  return (
    <Stack className="gap-4">
      <CapitalAmountInput
        amount={amount}
        amountError={amountError}
        inputId="copy-trading-add-capital"
        isPreparing={isPreparing}
        label="Add Capital"
        onAmountChange={onAmountChange}
        onPercentageChange={onPercentageChange}
        presetAmounts={presetAmounts}
        presetsEnabled={presetsEnabled}
        quoteCurrency={quoteCurrency}
        selectedChainId={selectedChainId}
        walletBalanceText={walletBalanceText}
      />

      <p className="text-sm text-subText">
        Deposit more capital{agentName ? ' for ' + agentName : ''}. The API fixes the quote token and returns the
        current minimum before your wallet is asked to confirm.
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
