import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { NETWORKS_INFO } from 'constants/networks'
import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
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

export const useGetTransactionStatus = (status: CrossChainTransferStatus) => {
  return useMemo(() => {
    let detailTransactionStatuses: DetailTransactionStatus[] = []
    let generalStatus: MultichainTransferStatus = MultichainTransferStatus.Success

    switch (status) {
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
          DetailTransactionStatus.Done,
          DetailTransactionStatus.Done,
          DetailTransactionStatus.Done,
        ]
        generalStatus = MultichainTransferStatus.Success
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
    return [detailTransactionStatuses, generalStatus] as const
  }, [status])
}

const RowWrapper = styled.div`
  display: flex;
  flex-direction: column;

  border-bottom: 1px solid gray;
`

const TransactionItem = ({ data: transfer }: { data: CrossChainTransfer }) => {
  const [expand, setExpand] = useState(false)
  const { srcTokenSymbol, dstTokenSymbol } = transfer

  const dstChainName = NETWORKS_INFO[Number(transfer.dstChainId) as ChainId].name

  const srcChainId = Number(transfer.srcChainId) as ChainId
  const dstChainId = Number(transfer.dstChainId) as ChainId

  const [detailTransactionStatuses, generalStatus] = useGetTransactionStatus(transfer.status)

  return (
    <RowWrapper>
      <TableRow
        style={{
          borderBottom: 'none',
        }}
      >
        <TimeCell timestamp={transfer.createdAt * 1000} />
        <StatusBadge status={generalStatus} />
        <RouteCell fromChainID={Number(transfer.srcChainId)} toChainID={Number(transfer.dstChainId)} />
        <TokenReceiveCell transfer={transfer} />
        <ActionButtons transfer={transfer} expand={expand} setExpand={setExpand} />
      </TableRow>
      {expand && (
        <Flex
          sx={{
            flexDirection: 'column',
            paddingBottom: '12px',
          }}
        >
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
            status={detailTransactionStatuses[2]}
            description={t`Swap axlUSDC to ${dstTokenSymbol}`}
            chainId={dstChainId}
            txHash={transfer.dstTxHash}
          />
        </Flex>
      )}
    </RowWrapper>
  )
}

export default TransactionItem
