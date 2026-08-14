import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { PositionSellPreview } from 'services/copyTrading/types/preparedActions'

import { ButtonLight } from 'components/Button'
import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatUsd } from 'pages/CopyTrading/helpers'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import {
  formatPreparedAmount,
  formatSlippage,
  formatWadPercent,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { cn } from 'utils/cn'

const SLIPPAGE_OPTIONS = [0.5, 1, 2]

export const PositionValue = ({ symbol, tradeId }: { symbol?: string; tradeId: string }) => (
  <>
    {symbol || 'Token'} · <ShortenedId value={tradeId} />
  </>
)

export const ManagePositionReview = ({
  isClose,
  position,
  preview,
}: {
  isClose: boolean
  position: PositionSummary
  preview?: PositionSellPreview
}) => {
  return (
    <Stack className="gap-4">
      <ReviewSection title={isClose ? 'Review full recovery' : 'Review pending sell recovery'}>
        <ReviewRow
          label="Position"
          value={
            <PositionValue symbol={preview?.baseToken?.symbol || position.token.symbol} tradeId={position.tradeId} />
          }
        />
        {!isClose && <ReviewRow label="Required sell ratio" value={formatWadPercent(preview?.sellRatioRaw)} />}
        {!isClose && <ReviewRow label="Pending obligations" value={preview?.unresolvedSkipCount} />}
        <ReviewRow label="Sell amount" value={formatPreparedAmount(preview?.sellBase, preview?.baseToken)} />
        <ReviewRow
          label="Minimum received"
          value={formatPreparedAmount(preview?.swapQuote?.minimumQuote, preview?.quoteToken)}
        />
        <ReviewRow label="Estimated cashback" value={formatPreparedAmount(preview?.cashback, preview?.baseToken)} />
        <ReviewRow label="Effective slippage" value={formatSlippage(preview?.swapQuote?.effectiveSlippageBps)} />
      </ReviewSection>
    </Stack>
  )
}

type ManagePositionFormProps = {
  actionColor: string
  isPreparing: boolean
  onPrimaryAction: () => void
  onSlippageChange: (slippage: number) => void
  position: PositionSummary
  primaryActionDisabled: boolean
  primaryActionLabel: string
  slippage: number
  unavailableMessage?: string
}

export const ManagePositionForm = ({
  actionColor,
  isPreparing,
  onPrimaryAction,
  onSlippageChange,
  position,
  primaryActionDisabled,
  primaryActionLabel,
  slippage,
  unavailableMessage,
}: ManagePositionFormProps) => {
  return (
    <Stack className="gap-4">
      <ReviewSection>
        <ReviewRow
          label="Position"
          value={<PositionValue symbol={position.token.symbol} tradeId={position.tradeId} />}
        />
        <ReviewRow label="Current value" value={formatUsd(position.valueUsd)} />
      </ReviewSection>

      <Stack className="gap-2">
        <span className="text-sm text-subText">Slippage tolerance</span>
        <HStack className="gap-2">
          {SLIPPAGE_OPTIONS.map(value => (
            <button
              key={value}
              type="button"
              disabled={isPreparing}
              onClick={() => onSlippageChange(value)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50',
                slippage === value
                  ? 'border-primary bg-primary-12 text-primary'
                  : 'border-darkBorder text-subText hover:text-text',
              )}
            >
              {formatSlippage(value * 100)}
            </button>
          ))}
        </HStack>
      </Stack>

      <ButtonLight
        type="button"
        color={actionColor}
        disabled={primaryActionDisabled}
        title={unavailableMessage}
        onClick={onPrimaryAction}
      >
        {isPreparing ? <Dots>{primaryActionLabel}</Dots> : primaryActionLabel}
      </ButtonLight>
    </Stack>
  )
}
