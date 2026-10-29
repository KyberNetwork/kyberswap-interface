import { t } from '@lingui/macro'
import { VaultWithdrawRequestStatus } from 'services/vault'

/** Shared by the open list and the history below it, so one request reads the same in both. */
export const getWithdrawStatusLabel = (status: string): string => {
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

export const WITHDRAW_STATUS_CLASS: Record<string, string> = {
  [VaultWithdrawRequestStatus.REQUESTED]: 'bg-blue3/20 text-blue3',
  [VaultWithdrawRequestStatus.PENDING]: 'bg-warning-20 text-warning',
  [VaultWithdrawRequestStatus.EXPIRED]: 'bg-red-20 text-red',
  [VaultWithdrawRequestStatus.COMPLETED]: 'bg-primary-20 text-primary',
  [VaultWithdrawRequestStatus.SUPERSEDED]: 'bg-white-08 text-subText',
  [VaultWithdrawRequestStatus.CANCELLED]: 'bg-white-08 text-subText',
}
