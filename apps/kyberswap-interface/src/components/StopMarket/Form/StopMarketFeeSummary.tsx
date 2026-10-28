import { ChainId, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { AlertTriangle, Info } from 'react-feather'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { HIGH_FEE_SHARE_PERCENT } from 'components/StopMarket/constants'
import { StopMarketFee } from 'components/StopMarket/types'
import { getStopMarketOrderTooSmall } from 'components/StopMarket/utils'
import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { NativeCurrencies } from 'constants/tokens'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  fee?: StopMarketFee
  isLoading?: boolean
  /** Why the fee could not be estimated; the order cannot be placed on these terms until it can. */
  errorMessage?: string
}

/** The most of an order a fee can be said to take. */
const MAX_FEE_SHARE_PERCENT = 100

const formatFeeShare = (percentage: number) => formatDisplayNumber(percentage, { significantDigits: 3 })

// The response is not validated, so the share is read as if the service might leave it out.
const getFeeShare = (fee: StopMarketFee): number | undefined => fee.protocol?.percentage

const formatFeeUsd = (usd: number) => `~${formatDisplayNumber(usd, { style: 'currency', significantDigits: 4 })}`

/**
 * The fee as its row shows it: the rate while the pair's tier applies, the dollar amount once the flat
 * minimum takes over — a rate above the published tier would only read as a mistake. Each falls back to
 * the other when the service leaves it out.
 */
export const getStopMarketFeeLabel = (fee: StopMarketFee): string | undefined => {
  const share = getFeeShare(fee)
  const rate = share === undefined ? undefined : `${formatFeeShare(share)}%`
  const usd = fee.protocolFeeUsd === undefined ? undefined : formatFeeUsd(fee.protocolFeeUsd)
  return fee.minProtocolFeeApplied ? usd ?? rate : rate ?? usd
}

const GENERIC_FEE_TOOLTIP = () => t`Covers the protocol fee plus the gas paid to execute on-chain.`

/**
 * The tooltip's first line, which only covers the case the order is in: the rate and what it comes to,
 * or — once the minimum applies — the tier rate and the minimum in the chain's coin and in dollars.
 */
export const getStopMarketFeeSummary = (fee: StopMarketFee, chainId?: ChainId): string | undefined => {
  if (!fee.minProtocolFeeApplied) {
    const share = getFeeShare(fee)
    const rate = share === undefined ? undefined : `${formatFeeShare(share)}%`
    const usd = fee.protocolFeeUsd === undefined ? undefined : formatFeeUsd(fee.protocolFeeUsd)
    return rate && usd ? `${rate} (${usd})` : rate ?? usd
  }

  const native = chainId === undefined ? undefined : NativeCurrencies[chainId]
  const minNative =
    native && fee.minProtocolFeeNative && /^\d+$/.test(fee.minProtocolFeeNative)
      ? `${CurrencyAmount.fromRawAmount(native, fee.minProtocolFeeNative).toSignificant(6)} ${native.symbol ?? ''}`
      : undefined
  const minUsdValue = fee.minProtocolFeeUsd ?? fee.protocolFeeUsd
  const minUsd = minUsdValue === undefined ? undefined : formatFeeUsd(minUsdValue)
  const minimum = minNative && minUsd ? `${minNative} (${minUsd})` : minNative ?? minUsd
  const tier = fee.protocol?.tierPercentage
  const tierRate = tier === undefined ? undefined : `${formatFeeShare(tier)}%`
  if (tierRate && minimum) return t`${tierRate}, min ${minimum}`
  if (minimum) return t`min ${minimum}`
  return tierRate
}

/**
 * What the fee row's tooltip says: the case the order is in, then what the fee is for — and, once the
 * minimum applies, why small orders pay it. Without a fee it says only what the fee is for.
 */
export const StopMarketFeeTooltip = ({ fee, chainId }: { fee?: StopMarketFee; chainId?: ChainId }) => {
  if (!fee) return <>{GENERIC_FEE_TOOLTIP()}</>
  const summary = getStopMarketFeeSummary(fee, chainId)

  return (
    <Stack className="gap-1" data-testid="stop-market-fee-tooltip">
      {summary && <span className="font-medium text-text">{summary}</span>}
      <span>
        {fee.minProtocolFeeApplied ? (
          <Trans>
            Covers the protocol fee plus the gas paid to execute on-chain. Execution costs the same regardless of order
            size, so small orders pay the minimum.
          </Trans>
        ) : (
          GENERIC_FEE_TOOLTIP()
        )}
      </span>
    </Stack>
  )
}

/** The fee takes a share of the order large enough to be worth pointing out. */
const isHighFeeShare = (fee: StopMarketFee) => {
  const share = getFeeShare(fee)
  return share !== undefined && share > HIGH_FEE_SHARE_PERCENT
}

/**
 * Which warning the fee earns. Under the flat minimum a large share also means gas spikes can leave the
 * order unexecuted, since the fee is fixed while the order is small.
 */
export const getStopMarketFeeWarningKind = (fee: StopMarketFee): 'none' | 'highShare' | 'highShareMinimum' => {
  if (!isHighFeeShare(fee)) return 'none'
  return fee.minProtocolFeeApplied ? 'highShareMinimum' : 'highShare'
}

/** The fee beside the expiry at the foot of a card, with the tooltip on its label saying what it is. */
export const StopMarketFeeValue = ({ fee, isLoading, chainId }: Props & { chainId: ChainId }) => {
  const label = fee ? getStopMarketFeeLabel(fee) : undefined

  return (
    <HStack className="min-w-0 items-center gap-1.5 text-sm" data-testid="stop-market-fee">
      {/* The icon sits outside the dashed text, so the underline runs under the label alone. */}
      <MouseoverTooltip placement="top" text={<StopMarketFeeTooltip fee={fee} chainId={chainId} />}>
        <HStack className="items-center gap-1 text-subText">
          <TextDashed fontSize={14} className="flex h-fit items-center text-subText">
            <Trans>Fee (incl. gas)</Trans>
          </TextDashed>
          <Info size={12} className="shrink-0" />
        </HStack>
      </MouseoverTooltip>
      {isLoading ? (
        <span className="flex h-5 items-center" data-testid="stop-market-fee-loading">
          <Skeleton height={12} width={80} borderRadius={6} />
        </span>
      ) : label === undefined ? (
        <span className="font-medium text-subText">--</span>
      ) : (
        <span className="font-medium text-text" data-testid="stop-market-fee-value">
          {label}
        </span>
      )}
    </HStack>
  )
}

const FeeWarning = ({ dataTestId, children }: { dataTestId: string; children: ReactNode }) => (
  <HStack
    className="animate-[fadeIn_0.2s_ease-out_both] items-start gap-1.5 text-xs font-medium text-warning motion-reduce:animate-none"
    data-testid={dataTestId}
  >
    <AlertTriangle size={14} className="mt-px shrink-0" />
    <span>{children}</span>
  </HStack>
)

/**
 * What the fee row cannot say on its own: why there is no fee to show, or — where `showShareWarning` asks
 * for it, which the review does — that the fee takes a large share of a small order. The share is only a
 * warning — the size is the user's call. What the fee covers is the tooltip's to say. An order too small
 * to carry the minimum fee is warned about the same way, with the share the service refused it at.
 */
export const StopMarketFeeNotes = ({
  fee,
  isLoading,
  errorMessage,
  showShareWarning = false,
}: Props & { showShareWarning?: boolean }) => {
  if (isLoading) return null
  const tooSmall = getStopMarketOrderTooSmall(errorMessage)
  if (tooSmall) {
    // Capped at the whole order: a share above it only says the fee swallows everything the order sells.
    const share =
      tooSmall.feeShare === undefined ? undefined : formatFeeShare(Math.min(tooSmall.feeShare, MAX_FEE_SHARE_PERCENT))
    return (
      <FeeWarning dataTestId="stop-market-fee-too-small">
        {share ? (
          <Trans>
            At this size the fee is {share}% of your order. Execution costs the same regardless of order size, and the
            order may not execute during unusual gas spikes.
          </Trans>
        ) : (
          <Trans>The fee is higher than your order amount. Increase the amount to continue.</Trans>
        )}
      </FeeWarning>
    )
  }
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
  if (!fee || !showShareWarning) return null
  const warningKind = getStopMarketFeeWarningKind(fee)
  if (warningKind === 'none') return null
  const share = formatFeeShare(getFeeShare(fee) ?? 0)

  return (
    <FeeWarning dataTestId="stop-market-min-fee-warning">
      {warningKind === 'highShareMinimum' ? (
        <Trans>
          At this size the fee is {share}% of your order. Execution costs the same regardless of order size, and the
          order may not execute during unusual gas spikes.
        </Trans>
      ) : (
        <Trans>
          At this size the fee is {share}% of your order. Execution costs the same regardless of order size.
        </Trans>
      )}
    </FeeWarning>
  )
}
