import { adaptCopyAccountWalletInventoryResponse } from 'services/copyTrading/adapters/copyAccounts'
import type { WithdrawTokensPreview } from 'services/copyTrading/types/preparedActions'
import type { ResponseMeta } from 'services/copyTrading/types/primitives'
import { describe, expect, it, vi } from 'vitest'

import {
  hasCapitalIncreased,
  hasCopyTradingChainCoveredBlock,
  hasWithdrawalBalanceConverged,
  isSameTransactionHash,
  pollCopyTradingProjection,
} from 'pages/CopyTrading/modals/PreparedActionModal/postReceipt'

describe('post-receipt Copy Trading projection helpers', () => {
  it('polls until the direct read reflects the transaction', async () => {
    const fetch = vi.fn().mockResolvedValueOnce('stale').mockResolvedValueOnce('current')
    const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)

    await expect(
      pollCopyTradingProjection<string>({
        errorMessage: 'Still syncing.',
        fetch,
        isConverged: value => value === 'current',
        maxAttempts: 3,
        pollIntervalMs: 25,
        waitForNextAttempt,
      }),
    ).resolves.toBe('current')

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(waitForNextAttempt).toHaveBeenCalledOnce()
    expect(waitForNextAttempt).toHaveBeenCalledWith(25)
  })

  it('keeps transient read failures inside the bounded polling window', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({ ready: true })

    await expect(
      pollCopyTradingProjection<{ ready: boolean }>({
        errorMessage: 'Still syncing.',
        fetch,
        isConverged: value => value.ready,
        maxAttempts: 2,
        waitForNextAttempt: vi.fn().mockResolvedValue(undefined),
      }),
    ).resolves.toEqual({ ready: true })
  })

  it('fails recoverably when projection does not converge in time', async () => {
    await expect(
      pollCopyTradingProjection({
        errorMessage: 'Still syncing.',
        fetch: vi.fn().mockResolvedValue('stale'),
        isConverged: () => false,
        maxAttempts: 2,
        waitForNextAttempt: vi.fn().mockResolvedValue(undefined),
      }),
    ).rejects.toThrow('Still syncing.')
  })

  it('requires the selected chain read to cover the receipt block', () => {
    const meta: ResponseMeta = {
      asOfChains: [{ chainId: '8453', asOfBlockNumber: '101' }],
    }

    expect(hasCopyTradingChainCoveredBlock(meta, 8453, 101n)).toBe(true)
    expect(hasCopyTradingChainCoveredBlock(meta, 8453, 102n)).toBe(false)
    expect(hasCopyTradingChainCoveredBlock(meta, 1, 101n)).toBe(false)
    expect(hasCopyTradingChainCoveredBlock(meta, 8453)).toBe(false)
  })

  it('requires Capital In to increase from the pre-submit Copy snapshot', () => {
    expect(hasCapitalIncreased('101.25', '100')).toBe(true)
    expect(hasCapitalIncreased('100', '100')).toBe(false)
    expect(hasCapitalIncreased('99', '100')).toBe(false)
    expect(hasCapitalIncreased(undefined, '100')).toBe(false)
  })

  it('matches transaction hashes case-insensitively', () => {
    expect(isSameTransactionHash('0xABCD', '0xabcd')).toBe(true)
    expect(isSameTransactionHash(undefined, '0xabcd')).toBe(false)
  })
})

it('waits for the withdrawn balance scope using only wallet inventory', () => {
  const inventory = adaptCopyAccountWalletInventoryResponse({
    complete: true,
    data: [{ tokenAddress: '0x2222222222222222222222222222222222222222', balanceAsOfBlock: '99', amountDecimal: '0' }],
    pinnedStableBalance: {
      status: 'PINNED_STABLE_BALANCE_STATUS_PRESENT',
      balance: {
        tokenAddress: '0x1111111111111111111111111111111111111111',
        balanceAsOfBlock: '100',
        amountDecimal: '0',
      },
    },
  })
  const quote = '0x1111111111111111111111111111111111111111'
  const preparedTokens: NonNullable<WithdrawTokensPreview['tokens']> = [quote, inventory.data[0].tokenAddress].map(
    address => ({
      token: { address, decimals: 6 },
      balance: { status: 'METRIC_STATUS_CURRENT', valueRaw: '1000000' },
    }),
  )
  const stableSnapshot = [preparedTokens[0]]
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, stableSnapshot)).toBe(true)
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, preparedTokens)).toBe(false)
  inventory.data[0].balanceAsOfBlock = '100'
  inventory.data[0].amountDecimal = '1'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, preparedTokens)).toBe(false)
  inventory.data[0].amountDecimal = '0'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, preparedTokens)).toBe(true)
  expect(hasWithdrawalBalanceConverged({ ...inventory, data: [] }, 100n, quote, preparedTokens)).toBe(false)
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, [])).toBe(false)
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, [{}])).toBe(false)
  inventory.data.push({
    ...inventory.data[0],
    tokenAddress: '0x3333333333333333333333333333333333333333',
    balanceAsOfBlock: '99',
  })
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, preparedTokens)).toBe(true)
  expect(hasWithdrawalBalanceConverged(inventory, undefined, quote, stableSnapshot)).toBe(false)
  expect(hasWithdrawalBalanceConverged({ ...inventory, complete: false }, 100n, quote, stableSnapshot)).toBe(false)
  expect(hasWithdrawalBalanceConverged(inventory, 100n, '0xwrong', stableSnapshot)).toBe(false)
})

it('compares current amounts with the submitted snapshot and allows already-zero tokens', () => {
  const quote = '0x1111111111111111111111111111111111111111'
  const inventory = adaptCopyAccountWalletInventoryResponse({
    complete: true,
    pinnedStableBalance: {
      status: 'PINNED_STABLE_BALANCE_STATUS_PRESENT',
      balance: { tokenAddress: quote, balanceAsOfBlock: '100', amountDecimal: '1.000000' },
    },
  })
  const snapshot: NonNullable<WithdrawTokensPreview['tokens']> = [
    {
      token: { address: quote, decimals: 6 },
      balance: { status: 'METRIC_STATUS_CURRENT', valueRaw: '1000000' },
    },
  ]
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(false)
  const currentBalance = inventory.pinnedStableBalance?.balance
  const preparedBalance = snapshot[0].balance
  if (!currentBalance || !preparedBalance) throw new Error('Missing balance fixture')
  currentBalance.amountDecimal = '0.5'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(true)
  preparedBalance.valueRaw = '0'
  currentBalance.amountDecimal = '0'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(true)
  currentBalance.balanceAsOfBlock = '99'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(false)
})

it('uses matching inventory decimals when the submitted snapshot has no metadata', () => {
  const quote = '0x1111111111111111111111111111111111111111'
  const inventory = adaptCopyAccountWalletInventoryResponse({
    complete: true,
    pinnedStableBalance: {
      status: 'PINNED_STABLE_BALANCE_STATUS_PRESENT',
      balance: {
        tokenAddress: quote,
        balanceAsOfBlock: '100',
        amountDecimal: '0.5',
        token: { address: quote, decimals: 6 },
      },
    },
  })
  const snapshot: NonNullable<WithdrawTokensPreview['tokens']> = [
    {
      token: { address: quote },
      balance: { status: 'METRIC_STATUS_CURRENT', valueRaw: '1000000' },
    },
  ]
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(true)
  const balance = inventory.pinnedStableBalance?.balance
  if (!balance?.token) throw new Error('Missing balance fixture')
  balance.amountDecimal = '1'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(false)
  balance.amountDecimal = '0.5'
  balance.token.address = '0x2222222222222222222222222222222222222222'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(false)
  balance.token = undefined
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(false)
})

it('accepts an executable stale quote snapshot while requiring updated inventory evidence', () => {
  const quote = '0x1111111111111111111111111111111111111111'
  const inventory = adaptCopyAccountWalletInventoryResponse({
    complete: true,
    pinnedStableBalance: {
      status: 'PINNED_STABLE_BALANCE_STATUS_PRESENT',
      balance: { tokenAddress: quote, balanceAsOfBlock: '100', amountDecimal: '0.5' },
    },
  })
  const snapshot: NonNullable<WithdrawTokensPreview['tokens']> = [
    {
      token: { address: quote, decimals: 6 },
      balance: { status: 'METRIC_STATUS_STALE', valueRaw: '1000000' },
    },
  ]
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(true)
  const balance = inventory.pinnedStableBalance?.balance
  const previous = snapshot[0].balance
  if (!balance || !previous) throw new Error('Missing balance fixture')
  balance.amountDecimal = '1'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(false)
  balance.amountDecimal = '0.5'
  balance.balanceAsOfBlock = '99'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(false)
  balance.balanceAsOfBlock = '100'
  previous.status = 'METRIC_STATUS_UNAVAILABLE'
  expect(hasWithdrawalBalanceConverged(inventory, 100n, quote, snapshot)).toBe(false)
})
