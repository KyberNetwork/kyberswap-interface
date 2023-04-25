import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { NetworkLogo } from 'components/Logo'
import { RowBetween } from 'components/Row'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import StatusBadge from 'pages/Bridge/BridgeTransferHistory/StatusBadge'
import TimeStatusCell from 'pages/Bridge/BridgeTransferHistory/TimeStatusCell'
import ActionButtons from 'pages/CrossChain/TransfersHistory/HistoryTable/ActionButons'
import { DetailTransaction } from 'pages/CrossChain/TransfersHistory/HistoryTable/DetailTransaction'
import { CrossChainTransfer } from 'pages/CrossChain/useTransferHistory'

import TokenReceiveCell from './TokenReceiveCell'
import { Props } from './index'

const TableHeader = styled.div`
  width: 100%;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 20px 20px 0 0;
`

const TableColumnText = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
`

const TableRowForMobile = styled.div`
  width: 100%;
  padding: 12px 16px;

  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  &:last-child {
    border-bottom: none;
  }
`

const ChainWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  font-weight: 400;
  font-size: 12px;
  line-height: 16px;

  color: ${({ theme }) => theme.subText};
`
const ChainDisplay: React.FC<{ chainId: ChainId }> = ({ chainId }) => {
  const chainInfo = NETWORKS_INFO_CONFIG[chainId]
  if (chainInfo) {
    return (
      <ChainWrapper>
        <NetworkLogo chainId={chainId} style={{ width: 18, height: 18 }} />
        <span>{chainInfo.name}</span>
      </ChainWrapper>
    )
  }

  return (
    <ChainWrapper>
      <InfoHelper
        placement="top"
        size={18}
        text={t`ChainId: ${chainId} not supported`}
        fontSize={12}
        style={{
          marginLeft: '0px',
        }}
      />
      <span>
        <Trans>Not supported</Trans>
      </span>
    </ChainWrapper>
  )
}

const TransactionItemMobile = ({ transfer }: { transfer: CrossChainTransfer }) => {
  const theme = useTheme()
  const [expand, setExpand] = useState(false)
  const transactions = new Array(3).fill(123)
  return (
    <>
      <TableRowForMobile style={{ border: expand ? 'none' : undefined, paddingBottom: expand ? 0 : undefined }}>
        <Flex
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <StatusBadge status={transfer.status} />
          <ActionButtons transfer={transfer} setExpand={setExpand} expand={expand} />
        </Flex>

        <RowBetween>
          <Flex
            sx={{
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '4px',
            }}
          >
            <ChainDisplay chainId={Number(transfer.srcChainId) as ChainId} />
            <ArrowDown width="8px" height="8px" color={theme.subText} style={{ marginLeft: 5 }} />
            <ChainDisplay chainId={Number(transfer.dstChainId) as ChainId} />
          </Flex>

          <Flex sx={{ flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
            <TokenReceiveCell transfer={transfer} />
            <TimeStatusCell timestamp={transfer.createdAt * 1000} />
          </Flex>
        </RowBetween>
      </TableRowForMobile>
      {expand && (
        <TableRowForMobile>
          {transactions.map(txs => (
            <DetailTransaction key={txs} isLast={false} />
          ))}
        </TableRowForMobile>
      )}
    </>
  )
}

const Mobile: React.FC<Props> = ({ transfers }) => {
  return (
    <Flex flexDirection="column" style={{ flex: 1 }}>
      <TableHeader>
        <TableColumnText>
          <Trans>ROUTE</Trans>
        </TableColumnText>

        <TableColumnText>
          <Trans>AMOUNT</Trans>
        </TableColumnText>
      </TableHeader>

      {transfers.map((transfer, i) => (
        <TransactionItemMobile transfer={transfer} key={i} />
      ))}
    </Flex>
  )
}

export default Mobile
