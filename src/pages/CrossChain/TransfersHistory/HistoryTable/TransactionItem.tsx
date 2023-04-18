import { useState } from 'react'

import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import RouteCell from 'pages/Bridge/BridgeTransferHistory/RouteCell'
import StatusBadge from 'pages/Bridge/BridgeTransferHistory/StatusBadge'
import TimeCell from 'pages/Bridge/BridgeTransferHistory/TimeCell'
import ActionButtons from 'pages/CrossChain/TransfersHistory/HistoryTable/ActionButons'
import { DetailTransaction } from 'pages/CrossChain/TransfersHistory/HistoryTable/DetailTransaction'

import { TableRow } from './Desktop'
import TokenReceiveCell from './TokenReceiveCell'

const TransactionItem = ({ data: transfer }: { data: MultichainTransfer }) => {
  const [expand, setExpand] = useState(false)
  const theme = useTheme()
  const transactions = new Array(3).fill(123)
  return (
    <>
      <TableRow
        style={{
          borderBottom: !expand ? `1px solid ${theme.border}` : 'none',
          paddingBottom: expand ? '0 !important' : undefined,
        }}
      >
        <TimeCell timestamp={transfer.createdAt * 1000} />
        <StatusBadge status={transfer.status} />
        <RouteCell fromChainID={Number(transfer.srcChainId)} toChainID={Number(transfer.dstChainId)} />
        <TokenReceiveCell transfer={transfer} />
        <ActionButtons transfer={transfer} expand={expand} setExpand={setExpand} />
      </TableRow>
      {expand && transactions.map((txs, i) => <DetailTransaction key={txs} isLast={transactions.length - 1 === i} />)}
    </>
  )
}

export default TransactionItem
