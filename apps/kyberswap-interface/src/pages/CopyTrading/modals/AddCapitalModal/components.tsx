import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { AddCapitalPreview } from 'services/copyTrading/types/preparedActions'

import { ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import { formatPreparedAmount } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { cn } from 'utils/cn'

export const CAPITAL_PERCENTAGES = [25, 50, 75, 100] as const
export type CapitalPercentage = (typeof CAPITAL_PERCENTAGES)[number]

export type CapitalPreset = {
  amount: string
  percentage: CapitalPercentage
}

export const AddCapitalReview = ({
  agentName,
  confirmBalanceError,
  copyRun,
  preview,
}: {
  agentName?: string
  confirmBalanceError?: string
  copyRun: CopyRunSummary
  preview?: AddCapitalPreview
}) => {
  const preparedToken = preview?.quoteToken

  return (
    <Stack className="gap-2">
      <ReviewSection title="Review capital allocation">
        <ReviewRow label="Agent" value={agentName || copyRun.agentSnapshot?.displayName || 'Copy Run'} />
        <ReviewRow label="Add capital" value={formatPreparedAmount(preview?.addedCapitalRaw, preparedToken)} />
        <ReviewRow label="Minimum" value={formatPreparedAmount(preview?.minimumAddCapitalRaw, preparedToken)} />
        <ReviewRow label="Wallet balance" value={formatPreparedAmount(preview?.walletQuoteBalance, preparedToken)} />
        <ReviewRow
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
      <Stack className="gap-2">
        <span className="text-sm font-medium text-text">Add Capital</span>
        <CurrencyInputPanel
          value={amount}
          onUserInput={onAmountChange}
          error={!!amountError}
          currency={quoteCurrency}
          customBalanceText={walletBalanceText}
          customChainId={selectedChainId as ChainId}
          disableCurrencySelect
          disabledInput={isPreparing}
          id="copy-trading-add-capital"
          dataTestId="copy-trading-add-capital"
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
