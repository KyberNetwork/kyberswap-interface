import { t } from '@lingui/macro'
import { memo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex } from 'rebass'

import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import { PrimaryText } from 'components/WalletPopup/Transactions/TransactionItem'
import useTheme from 'hooks/useTheme'
import { TransactionHistory } from 'pages/NotificationCenter/Portfolio/type'

function StatusIcon({ transaction }: { transaction: TransactionHistory }) {
  const { status } = transaction
  const success = status === 'success'

  const [isPendingState] = useState<boolean | null>(null)

  const theme = useTheme()

  const pendingText = t`Processing`
  const pendingIcon = <Repeat size={14} color={theme.warning} />
  return (
    <Flex style={{ gap: '4px', minWidth: 'unset' }} alignItems={'center'}>
      <PrimaryText color={theme.text}>{isPendingState ? pendingText : success ? t`Completed` : t`Failed`}</PrimaryText>
      {isPendingState ? (
        pendingIcon
      ) : success ? (
        <CheckCircle size="12px" color={theme.primary} />
      ) : (
        <IconFailure size={15} color={theme.red} />
      )}
    </Flex>
  )
}
export default memo(StatusIcon)
