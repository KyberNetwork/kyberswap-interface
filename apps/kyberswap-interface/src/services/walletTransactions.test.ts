import { describe, expect, it } from 'vitest'

import { mergeTransactionHistory } from 'components/SwapTransactions/history'
import { backendChainToChain } from 'state/crossChainSwap/model'

import { indexedTransactionPageFromWalletRows, walletTransactionToIndexed } from './walletTransactions'

const wallet = '0xcc39c8063d5e5a599b56db330424172c95732313'
const swap = {
  events: [
    {
      chainName: 'ethereum',
      rawAmount: '-0x1e8480',
      token: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      wallet,
    },
    {
      chainName: 'ethereum',
      rawAmount: '0x313856359a70e',
      token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      wallet,
    },
  ],
  extra: { client: 'kyberswap', txHash: '0xsame-chain' },
  fromChainName: 'ethereum',
  toChainName: 'ethereum',
  status: 'success',
  timestamp: '2026-10-27T06:46:59Z',
  txType: 'swap',
  wallet,
}

const requiredRow = (value: unknown) => {
  const row = walletTransactionToIndexed(value)
  if (!row) throw new Error('Expected a displayable swap')
  return row
}

describe('KD wallet transaction mapping', () => {
  it('resolves backend aliases, numeric IDs and non-EVM chains without accepting unknown names', () => {
    expect(['bsc', 'bera', '99901', 'solana', 'near', 'bitcoin', 'unknown'].map(backendChainToChain)).toEqual([
      56,
      80094,
      99901,
      'solana',
      'near',
      'bitcoin',
      undefined,
    ])
  })

  it('maps the same-chain swap contract with exact signed hex units and a single transaction hash', () => {
    const row = requiredRow(swap)
    expect(row).toMatchObject({
      fromAmount: '2000000',
      actualOutput: '865888548529934',
      sourceTxHash: '0xsame-chain',
      destTxHash: '0xsame-chain',
      quoteId: '',
      provider: 'kyberswap',
      historyType: 'swap',
      status: 'success',
    })
    const history = mergeTransactionHistory({ server: [row], local: [], sender: wallet.toUpperCase() })
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ sourceChain: 1, targetChain: 1, status: 'Success' })
  })

  it('includes an incoming cross-chain swap and keeps its actual source sender', () => {
    const row = requiredRow({
      ...swap,
      txType: 'cross_chain',
      fromChainName: 'solana',
      toChainName: 'base',
      events: [
        { chainName: 'base', token: '0xtoken', rawAmount: '0x358890884f564084', wallet },
        { chainName: 'solana', token: 'SOL', rawAmount: '-0x989680', wallet: 'SolanaSender' },
      ],
      extra: { sourceTxHash: 'SolanaHash', provider: 'lifi', quoteId: 'quote', inputUsd: '2.3', outputUsd: '2.29' },
    })
    expect(row).toMatchObject({ sender: 'SolanaSender', recipient: wallet, fromAmount: '10000000', inputUsd: 2.3 })
    expect(mergeTransactionHistory({ server: [row], local: [], sender: wallet })).toHaveLength(1)
    expect(mergeTransactionHistory({ server: [row], local: [], sender: 'SolanaSender' })).toHaveLength(1)
    expect(mergeTransactionHistory({ server: [row], local: [], sender: 'solanasender' })).toHaveLength(0)
  })

  it('keeps Elysium transactions in history when KD only provides chain names', () => {
    const row = requiredRow({
      ...swap,
      txType: 'cross_chain',
      fromChainName: 'arbitrum',
      toChainName: 'elysium',
      events: [
        { ...swap.events[0], chainName: 'arbitrum' },
        { ...swap.events[1], chainName: 'elysium' },
      ],
    })
    const history = mergeTransactionHistory({ server: [row], local: [], sender: wallet })
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ sourceChain: 42161, targetChain: 99901, status: 'Success' })
  })

  it('does not lose raw integer precision or synthesize output for pending transactions', () => {
    const row = requiredRow({
      ...swap,
      status: 'pending',
      events: [{ ...swap.events[0], rawAmount: '-99999999999999999999999999' }, swap.events[1]],
    })
    expect(row.fromAmount).toBe('99999999999999999999999999')
    expect(row.actualOutput).toBeNull()
    expect(row.completedAt).toBeNull()
    expect(row.status).toBe('in_progress')
  })

  it('advances by raw row count through malformed and unsupported rows', () => {
    const rows = [swap, ...Array.from({ length: 99 }, () => ({ ...swap, txType: 'approval' }))]
    expect(indexedTransactionPageFromWalletRows(rows, 100)).toMatchObject({
      nextCursor: '200',
      oldestTimestamp: Date.parse(swap.timestamp),
      transactions: [expect.objectContaining({ historyType: 'swap' })],
    })
    expect(indexedTransactionPageFromWalletRows([swap], 20).nextCursor).toBeNull()
    expect(indexedTransactionPageFromWalletRows([], 30).nextCursor).toBeNull()
    expect(
      walletTransactionToIndexed({ ...swap, events: [{ ...swap.events[0], rawAmount: 'invalid' }] }),
    ).toBeUndefined()
    const incomplete = requiredRow({ ...swap, events: [swap.events[0]] })
    expect(incomplete).toMatchObject({ fromToken: '', toToken: '', sender: '', historyWallet: wallet })
    expect(mergeTransactionHistory({ server: [incomplete], local: [], sender: wallet })).toHaveLength(1)
  })
})
