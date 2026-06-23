import { t } from '@lingui/macro'
import { memo } from 'react'
import { Repeat } from 'react-feather'

import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import WarningIcon from 'components/Icons/WarningIcon'
import { PrimaryText } from 'components/WalletPopup/Transactions/TransactionItem'
import { isTxsPendingTooLong as isShowPendingWarning } from 'components/WalletPopup/Transactions/helper'
import { TransactionDetails } from 'state/transactions/type'
import { getTransactionStatus } from 'utils/transaction'

function StatusIcon({ transaction }: { transaction: TransactionDetails }) {
  const { pending, success } = getTransactionStatus(transaction)
  const isPendingTooLong = isShowPendingWarning(transaction)

  const pendingText = isPendingTooLong ? t`Pending` : t`Processing`
  const pendingIcon = isPendingTooLong ? (
    <WarningIcon size={12} className="text-red" solid />
  ) : (
    <Repeat size={14} className="text-warning" />
  )
  return (
    <span className="flex min-w-[unset] items-center gap-1">
      <PrimaryText className="text-text">{pending ? pendingText : success ? t`Completed` : t`Failed`}</PrimaryText>
      {pending ? (
        pendingIcon
      ) : success ? (
        <CheckCircle size="12px" className="text-primary" />
      ) : (
        <IconFailure size={15} className="text-red" />
      )}
    </span>
  )
}
export default memo(StatusIcon)
