import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { ITEMS_PER_PAGE } from 'pages/Bridge/consts'
import TransactionItem from 'pages/CrossChain/TransfersHistory/HistoryTable/TransactionItem'

import { Props } from './index'

const commonCSS = css`
  width: 100%;
  padding: 0 16px;

  display: grid;
  grid-template-columns: 120px 150px 80px 150px 70px;
  justify-content: space-between;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    column-gap: 4px;
    grid-template-columns: 112px 100px 64px minmax(auto, 130px) 70px;
  `}
`

const TableHeader = styled.div`
  ${commonCSS}
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

export const TableRow = styled.div`
  ${commonCSS}
  height: 60px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  &:last-child {
    border-bottom: none;
  }
`

const Desktop: React.FC<Props> = ({ transfers }) => {
  const renderInvisibleRows = () => {
    // don't need invisible rows for upToExtraSmall screens
    if (transfers.length === ITEMS_PER_PAGE) {
      return null
    }

    return Array(ITEMS_PER_PAGE - transfers.length)
      .fill(0)
      .map((_, i) => {
        return (
          <TableRow
            key={i}
            style={{
              visibility: 'hidden',
            }}
          />
        )
      })
  }

  return (
    <Flex flexDirection="column" style={{ flex: 1 }}>
      <TableHeader>
        <TableColumnText>
          <Trans>CREATED</Trans>
        </TableColumnText>
        <TableColumnText>
          <Trans>STATUS</Trans>
        </TableColumnText>
        <TableColumnText>
          <Trans>ROUTE</Trans>
        </TableColumnText>
        <TableColumnText>
          <Trans>AMOUNT</Trans>
        </TableColumnText>
        <TableColumnText style={{ textAlign: 'right' }}>
          <Trans>ACTION</Trans>
        </TableColumnText>
      </TableHeader>
      {transfers.map(transfer => (
        <TransactionItem data={transfer} key={transfer.srcTxHash} />
      ))}
      {renderInvisibleRows()}
    </Flex>
  )
}

export default Desktop
