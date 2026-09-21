import { t } from '@lingui/macro'
import { VaultSupportedAsset, VaultWithdrawRequest, VaultWithdrawRequestStatus } from 'services/vault'

import Loader from 'components/Loader'
import { useCancelWithdrawRequest } from 'pages/Earns/VaultDetail/hooks/useVaultWithdraw'
import {
  CancelRequestButton,
  DetailLabel,
  DetailRow,
  DetailValue,
  RequestCard,
  RequestList,
  RequestStatusBadge,
} from 'pages/Earns/VaultDetail/styles'
import useCountdown from 'pages/Earns/hooks/useCountdown'
import {
  getWithdrawRequestCancellation,
  getWithdrawRequestExpiryAt,
  getWithdrawRequestMaturityAt,
  safeBigInt,
} from 'pages/Earns/utils/vault'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    [VaultWithdrawRequestStatus.REQUESTED]: t`Requested`,
    [VaultWithdrawRequestStatus.PENDING]: t`Pending`,
    [VaultWithdrawRequestStatus.EXPIRED]: t`Expired`,
    [VaultWithdrawRequestStatus.COMPLETED]: t`Completed`,
    [VaultWithdrawRequestStatus.SUPERSEDED]: t`Replaced`,
    [VaultWithdrawRequestStatus.CANCELLED]: t`Cancelled`,
  }
  return labels[status] ?? t`Unknown`
}

const STATUS_CLASS: Record<string, string> = {
  [VaultWithdrawRequestStatus.REQUESTED]: 'bg-blue3/20 text-blue3',
  [VaultWithdrawRequestStatus.PENDING]: 'bg-warning-20 text-warning',
  [VaultWithdrawRequestStatus.EXPIRED]: 'bg-red-20 text-red',
  [VaultWithdrawRequestStatus.COMPLETED]: 'bg-white-08 text-subText',
  [VaultWithdrawRequestStatus.SUPERSEDED]: 'bg-white-08 text-subText',
  [VaultWithdrawRequestStatus.CANCELLED]: 'bg-white-08 text-subText',
}

const RequestItem = ({
  request,
  assetOut,
  shareSymbol,
  shareDecimals,
  isCancelling,
  onCancel,
}: {
  request: VaultWithdrawRequest
  /** Metadata for the request's own output asset, which may no longer be one the vault offers. */
  assetOut?: VaultSupportedAsset
  shareSymbol: string
  shareDecimals: number
  isCancelling: boolean
  onCancel: (request: VaultWithdrawRequest) => void
}) => {
  const { remaining, label: countdown } = useCountdown(getWithdrawRequestMaturityAt(request))
  const isExpired = request.status === VaultWithdrawRequestStatus.EXPIRED
  const expiryAt = getWithdrawRequestExpiryAt(request)
  // An expired request has no payout left to quote; what it still holds is the escrowed shares.
  const payoutRaw = isExpired ? null : request.pendingPayoutAssetsRaw
  const canCancel = Boolean(getWithdrawRequestCancellation(request))

  return (
    <RequestCard>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-text">
          {formatDisplayNumber(formatUnits(safeBigInt(request.escrowedSharesRaw), shareDecimals), {
            significantDigits: 6,
          })}{' '}
          {shareSymbol}
        </span>
        <RequestStatusBadge className={STATUS_CLASS[request.status]}>
          {getStatusLabel(request.status)}
        </RequestStatusBadge>
      </div>

      <DetailRow>
        <DetailLabel>{isExpired ? t`Reclaimable` : t`You receive`}</DetailLabel>
        <DetailValue>
          {isExpired
            ? `${formatDisplayNumber(formatUnits(safeBigInt(request.refundableSharesRaw), shareDecimals), {
                significantDigits: 6,
              })} ${shareSymbol}`
            : payoutRaw && assetOut
            ? `${formatDisplayNumber(formatUnits(safeBigInt(payoutRaw), assetOut.decimals), {
                significantDigits: 6,
              })} ${assetOut.symbol}`
            : '--'}
        </DetailValue>
      </DetailRow>

      <DetailRow>
        <DetailLabel>{isExpired ? t`Expired on` : remaining > 0 ? t`Ready in` : t`Ready`}</DetailLabel>
        <DetailValue className={cn(isExpired && 'text-red')}>
          {isExpired
            ? expiryAt
              ? new Date(expiryAt * 1000).toLocaleDateString()
              : '--'
            : remaining > 0
            ? countdown
            : t`Awaiting solver`}
        </DetailValue>
      </DetailRow>

      {canCancel ? (
        <div className="flex justify-end">
          <CancelRequestButton disabled={isCancelling} onClick={() => onCancel(request)}>
            {isCancelling ? <Loader size="12px" /> : null}
            {isExpired ? t`Cancel & reclaim` : t`Cancel`}
          </CancelRequestButton>
        </div>
      ) : null}
    </RequestCard>
  )
}

const WithdrawRequestList = ({
  chainId,
  requests,
  assets,
  shareSymbol,
  shareDecimals,
  onCancelled,
}: {
  chainId: number
  requests: VaultWithdrawRequest[]
  /** Every supported asset, not just the withdrawable ones: a request can name an asset the vault
   *  has since closed. */
  assets: VaultSupportedAsset[]
  shareSymbol: string
  shareDecimals: number
  onCancelled: () => void
}) => {
  const { cancelRequest, cancellingRequestId } = useCancelWithdrawRequest({
    chainId,
    shareSymbol,
    shareDecimals,
    onSubmitted: onCancelled,
  })

  if (!requests.length) return null

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.06em] text-subText">{t`Pending withdrawals`}</span>
      <RequestList>
        {requests.map(request => (
          <RequestItem
            key={request.requestId}
            request={request}
            assetOut={assets.find(asset => asset.assetAddress.toLowerCase() === request.assetOutAddress?.toLowerCase())}
            shareSymbol={shareSymbol}
            shareDecimals={shareDecimals}
            isCancelling={cancellingRequestId === request.requestId}
            onCancel={cancelRequest}
          />
        ))}
      </RequestList>
    </div>
  )
}

export default WithdrawRequestList
