import { Trans, t } from '@lingui/macro'
import { AlertTriangle, Info } from 'react-feather'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { HIGH_FEE_SHARE_PERCENT } from 'components/StopMarket/constants'
import { StopMarketFee } from 'components/StopMarket/types'
import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  fee?: StopMarketFee
  isLoading?: boolean
  /** Why the fee could not be estimated; the order cannot be placed on these terms until it can. */
  errorMessage?: string
}

const formatFeeShare = (percentage: number) => formatDisplayNumber(percentage, { significantDigits: 3 })

// The response is not validated, so the share is read as if the service might leave it out.
const getFeeShare = (fee: StopMarketFee): number | undefined => fee.protocol?.percentage

/** The fee takes a share of the order large enough to be worth pointing out. */
const isHighFeeShare = (fee: StopMarketFee) => {
  const share = getFeeShare(fee)
  return share !== undefined && share > HIGH_FEE_SHARE_PERCENT
}

/**
 * The fee in dollars, beside the expiry at the foot of a card. Its share of the order is added only when
 * that share is the point — the flat minimum applies, or it is large — and when there is no dollar figure.
 */
export const StopMarketFeeValue = ({ fee, isLoading }: Props) => {
  const feeUsd = fee?.protocolFeeUsd
  const share = fee ? getFeeShare(fee) : undefined
  const showShare = !!fee && (fee.minProtocolFeeApplied || isHighFeeShare(fee) || feeUsd === undefined)

  return (
    <HStack className="min-w-0 items-center gap-1.5 text-sm" data-testid="stop-market-fee">
      <TextDashed fontSize={14} className="flex h-fit items-center text-subText">
        <MouseoverTooltip
          placement="top"
          text={t`Covers the protocol fee plus the gas KyberSwap pays to execute on-chain.`}
        >
          <Trans>Fee</Trans>
        </MouseoverTooltip>
      </TextDashed>
      {isLoading ? (
        <span className="flex h-5 items-center" data-testid="stop-market-fee-loading">
          <Skeleton height={12} width={80} borderRadius={6} />
        </span>
      ) : !fee || (share === undefined && feeUsd === undefined) ? (
        <span className="font-medium text-subText">--</span>
      ) : (
        <span className="font-medium text-text" data-testid="stop-market-fee-value">
          {showShare && share !== undefined && `${formatFeeShare(share)}%`}
          {feeUsd !== undefined && (
            <span className={showShare ? 'text-subText' : undefined}>
              {showShare && ' '}~{formatDisplayNumber(feeUsd, { style: 'currency', significantDigits: 4 })}
            </span>
          )}
        </span>
      )}
    </HStack>
  )
}

/**
 * What the fee row cannot say on its own: why there is no fee to show, or, for a small order, that the
 * flat minimum applies and, when it takes a large share, how large. The share is only a warning — the
 * size is the user's call.
 */
export const StopMarketFeeNotes = ({ fee, isLoading, errorMessage }: Props) => {
  if (isLoading) return null
  if (errorMessage)
    return (
      <HStack
        className="animate-[fadeIn_0.2s_ease-out_both] items-start gap-1.5 text-xs font-medium text-red motion-reduce:animate-none"
        data-testid="stop-market-fee-error"
      >
        <AlertTriangle size={14} className="mt-px shrink-0" />
        <span>{errorMessage}</span>
      </HStack>
    )
  if (!fee) return null
  const isHighShare = isHighFeeShare(fee)
  if (!fee.minProtocolFeeApplied && !isHighShare) return null
  const share = formatFeeShare(getFeeShare(fee) ?? 0)

  return (
    <Stack
      className="animate-[fadeIn_0.2s_ease-out_both] gap-2 text-xs font-medium motion-reduce:animate-none"
      data-testid="stop-market-fee-notes"
    >
      {fee.minProtocolFeeApplied && (
        <HStack className="items-start gap-1.5 text-blue" data-testid="stop-market-min-fee-note">
          <Info size={14} className="mt-px shrink-0" />
          <span>
            <Trans>
              Covers the protocol fee plus the gas KyberSwap pays to execute on-chain. Execution costs the same
              regardless of order size, so small orders pay the minimum.
            </Trans>
          </span>
        </HStack>
      )}
      {isHighShare && (
        <HStack className="items-start gap-1.5 text-warning" data-testid="stop-market-min-fee-warning">
          <AlertTriangle size={14} className="mt-px shrink-0" />
          <span>
            <Trans>
              At this size the fee is {share}% of your order. Execution costs the same regardless of order size.
            </Trans>
          </span>
        </HStack>
      )}
    </Stack>
  )
}
