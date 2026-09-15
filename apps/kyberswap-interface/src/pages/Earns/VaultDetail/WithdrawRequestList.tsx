import { t } from '@lingui/macro'
import { VaultWithdrawRequest, VaultWithdrawRequestStatus } from 'services/vault'

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
import { getWithdrawRequestExpiryAt, getWithdrawRequestMaturityAt, safeBigInt } from 'pages/Earns/utils/vault'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

const getStatusLabel = (status: VaultWithdrawRequestStatus): string => {
  const labels: Record<VaultWithdrawRequestStatus, string> = {
    [VaultWithdrawRequestStatus.PENDING]: t`Requested`,
    [VaultWithdrawRequestStatus.MATURED]: t`Pending`,
    [VaultWithdrawRequestStatus.EXPIRED]: t`Expired`,
    [VaultWithdrawRequestStatus.SOLVED]: t`Completed`,
    [VaultWithdrawRequestStatus.CANCELLED]: t`Cancelled`,
  }
  return labels[status]
}

const STATUS_CLASS: Record<VaultWithdrawRequestStatus, string> = {
  [VaultWithdrawRequestStatus.PENDING]: 'bg-blue3/20 text-blue3',
  [VaultWithdrawRequestStatus.MATURED]: 'bg-warning-20 text-warning',
  [VaultWithdrawRequestStatus.EXPIRED]: 'bg-red-20 text-red',
  [VaultWithdrawRequestStatus.SOLVED]: 'bg-white-08 text-subText',
  [VaultWithdrawRequestStatus.CANCELLED]: 'bg-white-08 text-subText',
}

const RequestItem = ({
  request,
  shareSymbol,
  shareDecimals,
  isCancelling,
  onCancel,
}: {
  request: VaultWithdrawRequest
  shareSymbol: string
  shareDecimals: number
  isCancelling: boolean
  onCancel: (request: VaultWithdrawRequest) => void
}) => {
  const { remaining, label: countdown } = useCountdown(getWithdrawRequestMaturityAt(request))
  const isExpired = request.status === VaultWithdrawRequestStatus.EXPIRED

  return (
    <RequestCard>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-text">
          {formatDisplayNumber(formatUnits(safeBigInt(request.amountOfShares), shareDecimals), {
            significantDigits: 6,
          })}{' '}
          {shareSymbol}
        </span>
        <RequestStatusBadge className={STATUS_CLASS[request.status]}>
          {getStatusLabel(request.status)}
        </RequestStatusBadge>
      </div>

      <DetailRow>
        <DetailLabel>{t`You receive`}</DetailLabel>
        <DetailValue>
          {formatDisplayNumber(formatUnits(safeBigInt(request.amountOfAssets), request.assetOut.decimals), {
            significantDigits: 6,
          })}{' '}
          {request.assetOut.symbol}
        </DetailValue>
      </DetailRow>

      <DetailRow>
        <DetailLabel>{isExpired ? t`Expired on` : remaining > 0 ? t`Ready in` : t`Ready`}</DetailLabel>
        <DetailValue className={cn(isExpired && 'text-red')}>
          {isExpired
            ? new Date(getWithdrawRequestExpiryAt(request) * 1000).toLocaleDateString()
            : remaining > 0
            ? countdown
            : t`Awaiting solver`}
        </DetailValue>
      </DetailRow>

      <div className="flex justify-end">
        <CancelRequestButton disabled={isCancelling} onClick={() => onCancel(request)}>
          {isCancelling ? <Loader size="12px" /> : null}
          {isExpired ? t`Cancel & reclaim` : t`Cancel`}
        </CancelRequestButton>
      </div>
    </RequestCard>
  )
}

const WithdrawRequestList = ({
  chainId,
  requests,
  shareSymbol,
  shareDecimals,
  onCancelled,
}: {
  chainId: number
  requests: VaultWithdrawRequest[]
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
