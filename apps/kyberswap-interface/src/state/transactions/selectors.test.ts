import type { BackendTransaction } from 'services/crossChainTransactions'
import { expect, it } from 'vitest'

import type { LocalTransaction } from 'state/crossChainSwap/model'
import { countPendingTransactions } from 'state/transactions/selectors'
import { TRANSACTION_GROUP, TRANSACTION_TYPE, type TransactionDetails } from 'state/transactions/type'

const now = Date.now()
const local: TransactionDetails = {
  hash: '0xABC',
  chainId: 1,
  from: '0xwallet',
  addedTime: now,
  type: TRANSACTION_TYPE.SWAP,
  group: TRANSACTION_GROUP.SWAP,
}
const cross = {
  sourceTxHash: '0xabc',
  sourceChain: 1,
  targetChain: 8453,
  sender: '0xwallet',
  recipient: '0xrecipient',
  status: 'Processing',
  timestamp: now,
} as LocalTransaction

it('excludes cross-chain execution and matching source transactions from the header count', () => {
  expect(countPendingTransactions([local], [cross], '0xWALLET', 1)).toBe(0)
  expect(countPendingTransactions([local], [cross, { ...cross, sourceChain: 8453 }], '0xwallet', 1)).toBe(0)
  expect(
    countPendingTransactions([{ ...local, receipt: { status: 1, blockHash: 'block' } }], [cross], '0xwallet', 1),
  ).toBe(0)
  expect(countPendingTransactions([local], [{ ...cross, status: 'Success' }], '0xwallet', 1)).toBe(0)
  expect(countPendingTransactions([local, { ...local, hash: 'same-chain' }], [cross], '0xwallet', 1)).toBe(1)
})

it('counts only recent pending transactions for the active wallet and chain', () => {
  expect(countPendingTransactions([local], [], '0xWALLET', 1)).toBe(1)
  expect(countPendingTransactions([local], [{ ...cross, targetChain: 1 }], '0xwallet', 1)).toBe(1)
  expect(countPendingTransactions([local], [cross], '0xrecipient', 1)).toBe(0)
  expect(countPendingTransactions([local], [cross], '0xother', 1)).toBe(0)
  expect(countPendingTransactions([local], [cross], undefined, 1)).toBe(0)
  expect(countPendingTransactions([local], [], '0xwallet', 8453)).toBe(0)
  expect(countPendingTransactions([{ ...local, addedTime: now - 86_400_001 }], [], '0xwallet', 1, now)).toBe(0)
  expect(countPendingTransactions([{ ...local, receipt: { status: 1, blockHash: 'block' } }], [], '0xwallet', 1)).toBe(
    0,
  )
})

it('stops counting retained settlements and every terminal provider status', () => {
  for (const status of ['Success', 'Failed', 'Refunded'] as const) {
    expect(countPendingTransactions([], [{ ...cross, status }], '0xwallet', 1)).toBe(0)
  }
  const settlement = { verification: 'verified', status: 'success' } as BackendTransaction
  expect(countPendingTransactions([], [{ ...cross, settlement }], '0xwallet', 1)).toBe(0)
})
