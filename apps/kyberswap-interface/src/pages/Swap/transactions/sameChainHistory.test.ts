import type { IndexedTransaction } from 'services/walletTransactions'
import { expect, it } from 'vitest'

import { mergeTransactionHistory } from 'pages/Swap/transactions/history'
import { sameChainTransactionToHistory } from 'pages/Swap/transactions/sameChainHistory'
import { TRANSACTION_GROUP, TRANSACTION_TYPE, type TransactionDetails } from 'state/transactions/type'

const tx: TransactionDetails = {
  chainId: 1,
  hash: '0xABC',
  from: '0xsender',
  to: '0xrouter',
  addedTime: 1000,
  group: TRANSACTION_GROUP.SWAP,
  type: TRANSACTION_TYPE.SWAP,
  extraInfo: {
    tokenAddressIn: '0x0000000000000000000000000000000000000001',
    tokenAddressOut: '0x0000000000000000000000000000000000000002',
    tokenSymbolIn: 'USDC',
    tokenSymbolOut: 'USDT',
    tokenAmountIn: '1',
    tokenAmountOut: '0.9',
    swap: {
      inputAmount: '1000001',
      outputAmount: '900001',
      inputDecimals: 6,
      outputDecimals: 6,
      recipient: '0xrecipient',
    },
    arbitrary: { inputAmount: '1.000001', inputDecimals: 6, outputDecimals: 6 },
  },
}

it('projects exact local amounts, tokens and receipt status without changing persisted records', () => {
  const original = JSON.stringify(tx)
  expect(sameChainTransactionToHistory(tx)).toMatchObject({
    inputAmount: '1000001',
    outputAmount: '900001',
    status: 'Processing',
    recipient: '0xrecipient',
    sourceToken: { symbol: 'USDC', decimals: 6 },
    targetToken: { symbol: 'USDT', decimals: 6 },
  })
  expect(sameChainTransactionToHistory({ ...tx, receipt: { status: 0, blockHash: 'block' } })?.status).toBe('Failed')
  expect(sameChainTransactionToHistory({ ...tx, receipt: { status: 1, blockHash: 'block' } })?.status).toBe('Success')
  expect(JSON.stringify(tx)).toBe(original)
})

it('restores legacy swaps and all chains but excludes approvals and unusable legacy amounts', () => {
  const legacy = { ...tx, extraInfo: { ...tx.extraInfo, swap: undefined } }
  expect(sameChainTransactionToHistory(legacy)).toMatchObject({
    inputAmount: '1000001',
    outputAmount: '900000',
    recipient: '',
  })
  expect(sameChainTransactionToHistory({ ...tx, type: TRANSACTION_TYPE.APPROVE })).toBeUndefined()
  expect(sameChainTransactionToHistory({ ...tx, chainId: 8453 })?.sourceChain).toBe(8453)
  expect(
    sameChainTransactionToHistory({ ...legacy, extraInfo: { ...legacy.extraInfo, tokenAmountOut: '<0.00001' } }),
  ).toBeUndefined()
})

it('dedupes API/local by canonical chain and hash, preserves local until settled, and scopes by sender or recipient', () => {
  const local = sameChainTransactionToHistory(tx)
  if (!local) throw new Error('Expected a local swap')
  const row: IndexedTransaction = {
    id: 'server',
    sourceTxHash: '0xabc',
    quoteId: '',
    fromChain: 'ethereum',
    toChain: 'ethereum',
    fromToken: 'token-in',
    toToken: 'token-out',
    fromAmount: '1000001',
    actualOutput: '910000',
    quotedOutput: '900001',
    quotedMinOutput: '890000',
    sender: tx.from,
    recipient: '0xrecipient',
    provider: 'kyberswap',
    destTxHash: '0xabc',
    status: 'success',
    verification: 'verified',
    inputUsd: null,
    outputUsd: null,
    timeEstimate: 0,
    createdAt: new Date(1000).toISOString(),
    completedAt: null,
    expiredAt: null,
    historyType: 'swap',
    historyWallet: tx.from,
  }
  const merge = (server = [row], sender = '0xSENDER') => mergeTransactionHistory({ server, local: [local], sender })
  expect(merge()).toHaveLength(1)
  expect(merge()[0]).toMatchObject({ usesBackendData: true, outputAmount: '910000' })
  expect(merge([{ ...row, status: 'in_progress', verification: 'pending' }])).toEqual([local])
  expect(merge([{ ...row, fromToken: '' }])).toEqual([local])
  expect(merge([{ ...row, fromChain: 'base', toChain: 'base' }])).toHaveLength(2)
  expect(merge([], '0xRECIPIENT')).toEqual([local])
  expect(merge([], '0xrouter')).toEqual([])
  expect(merge([], '0xother')).toEqual([])
})
