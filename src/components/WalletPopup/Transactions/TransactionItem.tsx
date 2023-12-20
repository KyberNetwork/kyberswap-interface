import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { forwardRef } from 'react'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import Badge, { BadgeVariant } from 'components/Badge'
import Row from 'components/Row'
import ContractAddress from 'components/WalletPopup/Transactions/ContractAddress'
import { getTxsIcon } from 'components/WalletPopup/Transactions/Icon'
import Status from 'components/WalletPopup/Transactions/Status'
import useTheme from 'hooks/useTheme'
import { getAxelarScanUrl } from 'pages/CrossChain'
import { BalanceCell, getTxsAction } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Transactions'
import { TransactionHistory } from 'pages/NotificationCenter/Portfolio/type'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLinkIcon } from 'theme'
import { getEtherscanLink } from 'utils'

const ItemWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 14px 0px;
  width: 100%;
  gap: 10px;
  height: 100%;
  justify-content: space-between;
  display: flex;
  flex-direction: column;
  :last-child {
    border-bottom: none;
  }
`

const ColumGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
`

export const PrimaryText = styled(Text)`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

type Prop = {
  transaction: TransactionHistory
  style: CSSProperties
  isMinimal: boolean
}

export default forwardRef<HTMLDivElement, Prop>(function TransactionItem({ transaction, style, isMinimal }: Prop, ref) {
  const { contract = '', type } = getTxsAction(transaction)
  const { chain, blockTime, txHash, tag } = transaction
  const chainId = chain?.chainId
  const theme = useTheme()

  return (
    <ItemWrapper style={{ ...style, opacity: tag === 'SCAM' ? 0.4 : 1 }} ref={ref}>
      <Flex justifyContent="space-between" alignItems="flex-end">
        <Row gap="6px">
          {!isMinimal && (
            <Flex alignItems="center" color={theme.text}>
              {getTxsIcon(type)}{' '}
            </Flex>
          )}
          <Text color={theme.text} fontSize="14px">
            {type}{' '}
          </Text>
          <ExternalLinkIcon
            color={theme.subText}
            href={
              type === TRANSACTION_TYPE.CROSS_CHAIN_SWAP
                ? getAxelarScanUrl(txHash)
                : getEtherscanLink(chainId, txHash, 'transaction')
            }
          />
          {tag === 'SCAM' && (
            <Badge variant={BadgeVariant.WARNING} style={{ width: 'fit-content', fontSize: 12 }}>
              <Trans>Spam</Trans>
            </Badge>
          )}
        </Row>
        <Status transaction={transaction} />
      </Flex>

      <Flex justifyContent="space-between">
        <BalanceCell item={transaction} inWalletUI className="left-column" style={{ fontSize: '14px' }} />
        <ColumGroup className="right-column" style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
          <ContractAddress contract={contract} />
          <PrimaryText>{dayjs(blockTime * 1000).format('DD/MM/YYYY HH:mm:ss')}</PrimaryText>
        </ColumGroup>
      </Flex>
    </ItemWrapper>
  )
})
