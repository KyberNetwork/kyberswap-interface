import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'

import { NETWORKS_INFO } from 'constants/networks'
import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import RouteCell from 'pages/Bridge/BridgeTransferHistory/RouteCell'
import StatusBadge from 'pages/Bridge/BridgeTransferHistory/StatusBadge'
import TimeCell from 'pages/Bridge/BridgeTransferHistory/TimeCell'
import ActionButtons from 'pages/CrossChain/TransfersHistory/HistoryTable/ActionButons'
import {
  DetailTransaction,
  DetailTransactionStatus,
} from 'pages/CrossChain/TransfersHistory/HistoryTable/DetailTransaction'
import { CrossChainTransfer, CrossChainTransferStatus } from 'pages/CrossChain/useTransferHistory'

import { TableRow } from './Desktop'
import TokenReceiveCell from './TokenReceiveCell'

const TransactionItem = ({ data: transfer }: { data: CrossChainTransfer }) => {
  const [expand, setExpand] = useState(false)
  const theme = useTheme()
  const { srcTokenSymbol, dstTokenSymbol } = transfer

  const dstChainName = NETWORKS_INFO[Number(transfer.dstChainId) as ChainId].name

  const srcChainId = Number(transfer.srcChainId) as ChainId
  const dstChainId = Number(transfer.dstChainId) as ChainId

  const [detailTransactionStatuses, generalStatus] = useMemo(() => {
    let detailTransactionStatuses: DetailTransactionStatus[] = []
    let generalStatus: MultichainTransferStatus = MultichainTransferStatus.Success

    switch (transfer.status) {
      case CrossChainTransferStatus.SRC_GATEWAY_CALLED: {
        detailTransactionStatuses = [
          DetailTransactionStatus.Done,
          DetailTransactionStatus.Loading,
          DetailTransactionStatus.Waiting,
        ]
        generalStatus = MultichainTransferStatus.Processing
        break
      }
      case CrossChainTransferStatus.DEST_GATEWAY_APPROVED: {
        detailTransactionStatuses = [
          DetailTransactionStatus.Done,
          DetailTransactionStatus.Done,
          DetailTransactionStatus.Loading,
        ]
        generalStatus = MultichainTransferStatus.Processing
        break
      }
      case CrossChainTransferStatus.DEST_EXECUTED: {
        detailTransactionStatuses = [
          DetailTransactionStatus.Done,
          DetailTransactionStatus.Done,
          DetailTransactionStatus.Loading,
        ]
        generalStatus = MultichainTransferStatus.Processing
        break
      }
      case CrossChainTransferStatus.DEST_ERROR: {
        detailTransactionStatuses = [
          DetailTransactionStatus.Done,
          DetailTransactionStatus.Done,
          DetailTransactionStatus.Failed,
        ]
        generalStatus = MultichainTransferStatus.Failure
        break
      }
      case CrossChainTransferStatus.ERROR_FETCHING_STATUS: {
        detailTransactionStatuses = [
          DetailTransactionStatus.Failed,
          DetailTransactionStatus.Failed,
          DetailTransactionStatus.Failed,
        ]
        generalStatus = MultichainTransferStatus.Failure
        break
      }
      case CrossChainTransferStatus.EMPTY: {
        detailTransactionStatuses = [
          DetailTransactionStatus.Waiting,
          DetailTransactionStatus.Waiting,
          DetailTransactionStatus.Waiting,
        ]
        generalStatus = MultichainTransferStatus.Processing
        break
      }

      default: {
        detailTransactionStatuses = [
          DetailTransactionStatus.Waiting,
          DetailTransactionStatus.Waiting,
          DetailTransactionStatus.Waiting,
        ]
        generalStatus = MultichainTransferStatus.Processing
        break
      }
    }
    return [detailTransactionStatuses, generalStatus]
  }, [transfer.status])

  return (
    <>
      <TableRow
        style={{
          borderBottom: !expand ? `1px solid ${theme.border}` : 'none',
          paddingBottom: expand ? '0 !important' : undefined,
        }}
      >
        <TimeCell timestamp={transfer.createdAt * 1000} />
        <StatusBadge status={generalStatus} />
        <RouteCell fromChainID={Number(transfer.srcChainId)} toChainID={Number(transfer.dstChainId)} />
        <TokenReceiveCell transfer={transfer} />
        <ActionButtons transfer={transfer} expand={expand} setExpand={setExpand} />
      </TableRow>
      {expand && (
        <>
          <DetailTransaction
            status={detailTransactionStatuses[0]}
            description={t`Swap ${srcTokenSymbol} to axlUSDC`}
            chainId={srcChainId}
            txHash={transfer.srcTxHash}
          />
          <DetailTransaction
            status={detailTransactionStatuses[1]}
            description={t`Send axlUSDC to ${dstChainName}`}
            chainId={srcChainId}
            txHash={transfer.srcTxHash}
          />
          <DetailTransaction
            isLast={true}
            status={detailTransactionStatuses[2]}
            description={t`Swap axlUSDC to ${dstTokenSymbol}`}
            chainId={dstChainId}
            txHash={transfer.dstTxHash}
          />
        </>
      )}
    </>
  )
}

export default TransactionItem
