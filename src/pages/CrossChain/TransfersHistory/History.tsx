import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import NoData from 'pages/Bridge/BridgeTransferHistory/NoData'
import Pagination from 'pages/Bridge/BridgeTransferHistory/Pagination'

import useTransferHistory from '../../Bridge/BridgeTransferHistory/useTransferHistory'
import TransferHistoryTable from './HistoryTable'

type Props = {
  className?: string
}
const TransferHistory: React.FC<Props> = ({ className }) => {
  const { account } = useActiveWeb3React()
  const [shouldShowLoading, setShouldShowLoading] = useState(true)
  const response = useTransferHistory(account || '')
  const { isCompletelyEmpty, transfers } = response

  useEffect(() => {
    // This is to ensure loading is displayed at least 0.5s
    const existingTimeout = setTimeout(() => {
      setShouldShowLoading(false)
    }, 500)
    return () => {
      existingTimeout && clearTimeout(existingTimeout)
    }
  }, [])

  if (shouldShowLoading || isCompletelyEmpty) {
    return (
      <NoData
        isLoading={shouldShowLoading}
        isEmpty={isCompletelyEmpty}
        text={t`You haven't made any transactions yet`}
      />
    )
  }

  return (
    <div className={className}>
      <Flex flexDirection="column" style={{ flex: 1 }}>
        <TransferHistoryTable transfers={transfers} />
      </Flex>
      <Pagination {...response} />
    </div>
  )
}

export default styled(TransferHistory)`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: ${({ theme }) => rgba(theme.background, 0.3)};
  border-radius: 20px;
`
