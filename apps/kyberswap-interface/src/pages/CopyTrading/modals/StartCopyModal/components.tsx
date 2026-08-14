import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { Info } from 'react-feather'
import type { PreparedToken, StartCopyPreview } from 'services/copyTrading/types/preparedActions'

import verifiedIcon from 'assets/images/copy-trading/verified.svg'
import { ButtonPrimary } from 'components/Button'
import Checkbox from 'components/CheckBox'
import CopyHelper from 'components/Copy'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Dots from 'components/Dots'
import InfoHelper from 'components/InfoHelper'
import { Center, HStack, Stack } from 'components/Stack'
import { getAgentInitials } from 'pages/CopyTrading/helpers'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import {
  formatPreparedAmount,
  formatWadPercent,
  getInputQuoteToken,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import {
  CAPITAL_PERCENTAGES,
  type CapitalPercentage,
  type CapitalPreset,
  type StartCopyTarget,
} from 'pages/CopyTrading/modals/StartCopyModal/startCopy'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'

type InputQuoteToken = NonNullable<ReturnType<typeof getInputQuoteToken>>

const ReviewLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <span className="inline-flex items-center gap-1">
    {label}
    <InfoHelper text={tooltip} margin={false} placement="top" size={13} />
  </span>
)

export const AgentHeader = ({ agent }: { agent: StartCopyTarget }) => {
  return (
    <HStack className="min-w-0 flex-1 items-center gap-3">
      <Center className="size-12 shrink-0 rounded-full bg-buttonGray text-base font-medium text-subText">
        {getAgentInitials(agent.displayName)}
      </Center>
      <Stack className="min-w-0 flex-1 gap-0.5">
        <HStack className="min-w-0 items-center gap-1.5">
          <h2 className="truncate text-lg font-medium text-text">{agent.displayName}</h2>
          {agent.isVerified && <img src={verifiedIcon} alt="Verified" className="size-5 shrink-0" />}
        </HStack>
        <HStack className="min-w-0 items-center gap-1.5 text-xs text-subText">
          <span>•</span>
          <span className="truncate">{agent.modelName}</span>
          <span>•</span>
          <span className="shrink-0">{shortenAddress(agent.chainId, agent.leaderAddress)}</span>
          <CopyHelper toCopy={agent.leaderAddress} margin="0" size={12} className="shrink-0 text-subText" />
        </HStack>
      </Stack>
    </HStack>
  )
}

type StartCopyReviewProps = {
  agreed: boolean
  confirmBalanceError?: string
  isAuthorizing: boolean
  onAgreementChange: (agreed: boolean) => void
  preparedToken?: PreparedToken
  quoteToken?: InputQuoteToken
  startPreview?: StartCopyPreview
  targetCapitalRaw?: string
}

export const StartCopyReview = ({
  agreed,
  confirmBalanceError,
  isAuthorizing,
  onAgreementChange,
  preparedToken,
  quoteToken,
  startPreview,
  targetCapitalRaw,
}: StartCopyReviewProps) => {
  return (
    <Stack className="gap-4">
      <ReviewSection title="Review Details">
        <ReviewRow
          label="Allocated Capital"
          value={formatPreparedAmount(
            startPreview?.requestedTargetRaw || targetCapitalRaw,
            preparedToken || quoteToken,
          )}
        />
        <ReviewRow
          label={
            <ReviewLabel
              label="Minimum Capital"
              tooltip="The minimum initial capital currently accepted by the Start Copy preparation."
            />
          }
          value={formatPreparedAmount(
            startPreview?.minimumInitialCapitalRaw || quoteToken?.minimumStartCopyCapitalRaw,
            preparedToken || quoteToken,
          )}
        />
        <ReviewRow
          label={
            <ReviewLabel
              label="Upfront Fee"
              tooltip="The fee policy advertised by the latest preparation. It is checked again before every transaction stage."
            />
          }
          value={
            startPreview ? formatWadPercent(startPreview.feePolicy?.advertisedUpfrontFeeRateRaw) : <Dots>Checking</Dots>
          }
        />
      </ReviewSection>

      <label className="flex cursor-pointer items-start gap-3 text-xs text-subText">
        <Checkbox
          borderStyle
          checked={agreed}
          disabled={isAuthorizing}
          onChange={event => onAgreementChange(event.target.checked)}
          className="mt-0.5 size-4 shrink-0"
        />
        <span>
          I understand the trading risks, fees, and execution mechanics of AI Copy Trading. Past performance does not
          guarantee future results.
        </span>
      </label>
      {confirmBalanceError && (
        <span role="alert" className="text-xs text-red">
          {confirmBalanceError}
        </span>
      )}
    </Stack>
  )
}

type StartCopyFormProps = {
  agent: StartCopyTarget
  amount: string
  amountError?: string
  availabilityMessage?: string
  isPreparing: boolean
  onAmountChange: (amount: string) => void
  onPercentageChange: (percentage: CapitalPercentage) => void
  onPrimaryAction: () => void
  presetAmounts?: CapitalPreset[]
  presetsEnabled: boolean
  primaryActionLabel: string
  quoteCurrency?: Token
  walletBalanceText: string
  amountIsValid: boolean
  onExpectedChain: boolean
  accountConnected: boolean
}

export const StartCopyForm = ({
  accountConnected,
  agent,
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
  walletBalanceText,
}: StartCopyFormProps) => {
  return (
    <Stack className="gap-4">
      <Stack className="gap-2">
        <span className="text-sm font-medium text-text">Allocate Capital</span>
        <CurrencyInputPanel
          value={amount}
          onUserInput={onAmountChange}
          error={!!amountError}
          currency={quoteCurrency}
          customBalanceText={walletBalanceText}
          customChainId={agent.chainId as ChainId}
          disableCurrencySelect
          disabledInput={isPreparing}
          id="copy-trading-start-capital"
          dataTestId="copy-trading-start-capital"
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

      <p className="text-sm leading-5 text-text">
        You will follow new trades from this moment. Your P&amp;L may differ from the agent&apos;s stats until open
        positions close.
      </p>

      <HStack className="items-start gap-2.5 rounded-xl bg-blue/[0.08] p-3 text-blue2">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span className="text-xs italic">
          Earlier subscribers get executed before later ones. Price may vary slightly across executions.
        </span>
      </HStack>

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
