import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ExternalLink as ExternalLinkIcon, Trash2 } from 'react-feather'
import { VaultSupportedAsset, VaultWithdrawRequest, VaultWithdrawRequestStatus } from 'services/vault'

import Loader from 'components/Loader'
import { useCancelWithdrawRequest } from 'pages/Earns/VaultDetail/hooks/useVaultWithdraw'
import {
  DetailLabel,
  DetailRow,
  DetailValue,
  RequestCard,
  RequestList,
  RequestStatusBadge,
} from 'pages/Earns/VaultDetail/styles'
import { WITHDRAW_STATUS_CLASS, getWithdrawStatusLabel } from 'pages/Earns/VaultDetail/withdrawRequestStatus'
import useCountdown from 'pages/Earns/hooks/useCountdown'
import {
  getWithdrawRequestCancellation,
  getWithdrawRequestExpiryAt,
  isOpenWithdrawRequest,
  safeBigInt,
} from 'pages/Earns/utils/vault'
import { ExternalLink } from 'theme/components'
import { shortenHash } from 'utils/address'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

/** The moment a request settled, in the form the rest of the vault dates things. */
const formatSettledAt = (iso: string | null) => {
  if (!iso) return null
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return null
  const at = new Date(ms)
  const date = at.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

const toAmount = (raw: string | null, decimals: number, symbol: string) =>
  `${formatDisplayNumber(formatUnits(safeBigInt(raw), decimals), { significantDigits: 6 })} ${symbol}`

const toUsd = (raw: string | null, decimals: number, price?: number) => {
  if (!price) return null
  const amount = Number(formatUnits(safeBigInt(raw), decimals))
  if (!Number.isFinite(amount) || amount <= 0) return null
  return formatDisplayNumber(amount * price, { style: 'currency', significantDigits: 4 })
}

type Outcome = {
  label: string
  value: string
  usd: string | null
  txHash: string | null
  settledAt: string | null
}

/**
 * What a request has to say for itself. Each way it can end names a different amount and a different
 * transaction: one paid out, one handed the shares back, one was replaced and did neither.
 */
const getOutcome = ({
  request,
  assetOut,
  shareToken,
  prices,
}: {
  request: VaultWithdrawRequest
  assetOut?: VaultSupportedAsset
  shareToken: { address?: string; symbol: string; decimals: number }
  prices: { [address: string]: number }
}): Outcome => {
  const priceOf = (address?: string) => (address ? prices[address.toLowerCase()] : undefined)

  /** Both sides are priced: a payout is in the vault's asset, a refund is back in its shares. */
  const asShares = (raw: string | null) => ({
    value: toAmount(raw, shareToken.decimals, shareToken.symbol),
    usd: toUsd(raw, shareToken.decimals, priceOf(shareToken.address)),
  })
  const asAsset = (raw: string | null) =>
    assetOut
      ? {
          value: toAmount(raw, assetOut.decimals, assetOut.symbol),
          usd: toUsd(raw, assetOut.decimals, priceOf(assetOut.assetAddress)),
        }
      : asShares(raw)

  switch (request.status) {
    case VaultWithdrawRequestStatus.COMPLETED:
      return {
        label: t`You received`,
        ...asAsset(request.receivedAssetsRaw),
        txHash: request.completionTxHash,
        settledAt: formatSettledAt(request.completedAt),
      }
    case VaultWithdrawRequestStatus.CANCELLED:
      return {
        label: t`Returned`,
        ...asShares(request.requestedSharesRaw),
        txHash: request.cancellationTxHash,
        settledAt: formatSettledAt(request.cancelledAt),
      }
    case VaultWithdrawRequestStatus.SUPERSEDED:
      // Replaced rather than settled: the shares moved to a newer request instead of being paid out
      // or handed back, so quoting an amount here would read as a payout of zero.
      return {
        label: t`Replaced by`,
        value: t`a newer request`,
        usd: null,
        txHash: request.requestTxHash,
        settledAt: formatSettledAt(request.completedAt ?? request.requestedAt),
      }
    case VaultWithdrawRequestStatus.EXPIRED:
      // The payout is gone; what the queue still holds is the escrowed shares.
      return {
        label: t`Reclaimable`,
        ...asShares(request.refundableSharesRaw),
        txHash: request.requestTxHash,
        settledAt: formatSettledAt(request.expiredAt),
      }
    default:
      return {
        label: isOpenWithdrawRequest(request) ? t`You receive` : t`Requested`,
        ...(request.pendingPayoutAssetsRaw
          ? asAsset(request.pendingPayoutAssetsRaw)
          : asShares(request.requestedSharesRaw)),
        txHash: request.requestTxHash,
        settledAt: isOpenWithdrawRequest(request) ? null : formatSettledAt(request.requestedAt),
      }
  }
}

const RequestItem = ({
  chainId,
  request,
  assetOut,
  shareToken,
  prices,
  isCancelling,
  onCancel,
}: {
  chainId: number
  request: VaultWithdrawRequest
  /** Metadata for the request's own output asset, which may no longer be one the vault offers. */
  assetOut?: VaultSupportedAsset
  shareToken: { address?: string; symbol: string; decimals: number }
  prices: { [address: string]: number }
  isCancelling: boolean
  onCancel: (request: VaultWithdrawRequest) => void
}) => {
  const isOpen = isOpenWithdrawRequest(request)
  const isExpired = request.status === VaultWithdrawRequestStatus.EXPIRED
  const expiryAt = getWithdrawRequestExpiryAt(request)
  // Counted to the deadline rather than to maturity: maturity only opens the request to a solver,
  // an hour in, and a countdown that lands there says "ready" while the wait has barely started.
  const { remaining, label: countdown } = useCountdown(isOpen && !isExpired ? expiryAt : undefined)
  const canCancel = isOpen && Boolean(getWithdrawRequestCancellation(request))
  const outcome = getOutcome({ request, assetOut, shareToken, prices })

  return (
    <RequestCard>
      <div className="flex items-start justify-between gap-2">
        <span className="text-base font-medium leading-6 text-text">
          {toAmount(request.requestedSharesRaw, shareToken.decimals, shareToken.symbol)}
        </span>

        {/* A request still in flight offers the one action there is; a settled one says when. */}
        {canCancel ? (
          <button
            type="button"
            aria-label={isExpired ? t`Cancel and reclaim` : t`Cancel request`}
            title={isExpired ? t`Cancel and reclaim` : t`Cancel request`}
            disabled={isCancelling}
            onClick={() => onCancel(request)}
            className="flex cursor-pointer items-center border-none bg-transparent p-0 text-subText hover:text-red disabled:cursor-not-allowed"
          >
            {isCancelling ? <Loader size="16px" /> : <Trash2 size={16} />}
          </button>
        ) : outcome.settledAt ? (
          <span className="shrink-0 text-sm leading-5 text-subText">{outcome.settledAt}</span>
        ) : null}
      </div>

      <DetailRow>
        <DetailLabel>{outcome.label}</DetailLabel>
        <DetailValue className="flex items-center justify-end gap-1.5">
          <span>{outcome.value}</span>
          {outcome.usd ? <span className="text-subText">~{outcome.usd}</span> : null}
        </DetailValue>
      </DetailRow>

      {isOpen && !isExpired ? (
        <DetailRow>
          <DetailLabel>{t`Processing Time`}</DetailLabel>
          <DetailValue>{remaining > 0 ? countdown : t`Awaiting solver`}</DetailValue>
        </DetailRow>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {outcome.txHash ? (
          <ExternalLink
            href={getEtherscanLink(chainId as ChainId, outcome.txHash, 'transaction')}
            className="flex items-center gap-1 text-sm leading-5 text-subText hover:text-primary"
          >
            {shortenHash(outcome.txHash, 4)}
            <ExternalLinkIcon size={14} />
          </ExternalLink>
        ) : (
          <span />
        )}
        <RequestStatusBadge className={WITHDRAW_STATUS_CLASS[request.status]}>
          {getWithdrawStatusLabel(request.status)}
        </RequestStatusBadge>
      </div>
    </RequestCard>
  )
}

/**
 * Every withdrawal this wallet has asked the queue for, running ones above settled ones. One list
 * rather than two: they are the same request at different points, and splitting them hid the end of
 * the story once a payout landed.
 */
const WithdrawRequestList = ({
  chainId,
  requests,
  assets,
  shareToken,
  prices,
  onCancelled,
}: {
  chainId: number
  requests: VaultWithdrawRequest[]
  /** Every supported asset, not just the withdrawable ones: a request can name an asset the vault
   *  has since closed. */
  assets: VaultSupportedAsset[]
  shareToken: { address?: string; symbol: string; decimals: number }
  /** Keyed on the lowercased address, for the dollar figure beside every amount. */
  prices: { [address: string]: number }
  onCancelled: () => void
}) => {
  const { cancelRequest, cancellingRequestId } = useCancelWithdrawRequest({
    chainId,
    shareSymbol: shareToken.symbol,
    shareDecimals: shareToken.decimals,
    onSubmitted: onCancelled,
  })

  if (!requests.length) return null

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.06em] text-subText">{t`Withdrawals progress`}</span>
      <RequestList>
        {requests.map(request => (
          <RequestItem
            key={request.requestId}
            chainId={chainId}
            request={request}
            assetOut={assets.find(asset => asset.assetAddress.toLowerCase() === request.assetOutAddress?.toLowerCase())}
            shareToken={shareToken}
            prices={prices}
            isCancelling={cancellingRequestId === request.requestId}
            onCancel={cancelRequest}
          />
        ))}
      </RequestList>
    </div>
  )
}

export default WithdrawRequestList
