import styled from 'styled-components'

import { SUMMARY } from 'components/Popups/TransactionPopup'
import { TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'

import Transaction from './Transaction'

export const TransactionState = styled.div<{ success?: boolean; isInGroup?: boolean }>`
  ${({ isInGroup }) => (isInGroup ? 'margin-left: 1rem;' : '')}
  align-items: center;
  text-decoration: none !important;
  border-radius: 0.5rem;
  padding: 0.25rem 0rem;
  font-weight: 500;
  font-size: 0.825rem;
`

export default function TransactionGroup({ transactions }: { transactions: TransactionDetails[] }) {
  const swapTx = transactions.find(transaction => transaction.type === TRANSACTION_TYPE.SWAP)

  const pending = !swapTx?.receipt
  const success = !pending && swapTx && (swapTx.receipt?.status === 1 || typeof swapTx.receipt?.status === 'undefined')
  const type = swapTx?.type
  const summary = swapTx?.summary
  const parsedSummary = type
    ? SUMMARY[type]?.[pending ? 'pending' : success ? 'success' : 'failure'](summary)
    : summary ?? 'Swap'

  return (
    <>
      <TransactionState>{parsedSummary}</TransactionState>
      {transactions.map((transaction, index) => (
        <Transaction key={transaction.hash} transaction={transaction} step={index + 1} />
      ))}
    </>
  )
}
