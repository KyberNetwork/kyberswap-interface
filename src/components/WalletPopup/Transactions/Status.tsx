import { t } from '@lingui/macro'
import { memo } from 'react'
import { Flex } from 'rebass'

import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import { PrimaryText } from 'components/WalletPopup/Transactions/TransactionItem'
import useTheme from 'hooks/useTheme'
import { TransactionHistory } from 'pages/NotificationCenter/Portfolio/type'

function StatusIcon({ transaction }: { transaction: TransactionHistory }) {
  const { status } = transaction
  const success = status === 'success'
  const theme = useTheme()

  return (
    <Flex style={{ gap: '4px', minWidth: 'unset' }} alignItems={'center'}>
      <PrimaryText color={theme.text}>{success ? t`Completed` : t`Failed`}</PrimaryText>
      {success ? <CheckCircle size="12px" color={theme.primary} /> : <IconFailure size={15} color={theme.red} />}
    </Flex>
  )
}
export default memo(StatusIcon)
