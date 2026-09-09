import type { WithdrawTokensPreview } from 'services/copyTrading/types/preparedActions'
import { describe, expect, it } from 'vitest'

import {
  UINT256_MAX_RAW,
  getPreparedQuoteBalanceRaw,
  getWithdrawAmountError,
  getWithdrawRequestAmountRaw,
  getWithdrawalPrimaryAction,
  validateWithdrawAmountRaw,
  validateWithdrawPreview,
  validateWithdrawTokensPreview,
} from './utils'

describe('withdraw quote request', () => {
  it.each(['1', UINT256_MAX_RAW])('accepts canonical positive uint256 %s', amountRaw => {
    expect(validateWithdrawAmountRaw(amountRaw)).toBeUndefined()
  })

  it.each(['', '0', '-1', '+1', '01', '1.5', ' 1', `${UINT256_MAX_RAW}0`])('rejects invalid amount %s', amountRaw => {
    expect(validateWithdrawAmountRaw(amountRaw)).toBeTruthy()
  })

  it('uses uint256.max only after the Max preset is selected', () => {
    expect(getWithdrawRequestAmountRaw('42', false)).toBe('42')
    expect(getWithdrawRequestAmountRaw('42', true)).toBe(UINT256_MAX_RAW)
  })

  it('reads the pre-submit quote balance from the prepared action', () => {
    expect(getPreparedQuoteBalanceRaw({ quoteBalance: { valueRaw: '100' } })).toBe('100')
    expect(getPreparedQuoteBalanceRaw({ quoteBalance: { valueRaw: 'invalid' } })).toBeUndefined()
    expect(getPreparedQuoteBalanceRaw()).toBeUndefined()
  })

  it('validates the displayed amount against currency and Smart Wallet balance', () => {
    const input = { amount: '2', amountRaw: '2', hasQuoteCurrency: true, walletBalanceRaw: '1', withdrawAll: false }

    expect(getWithdrawAmountError({ ...input, amount: '' })).toBeUndefined()
    expect(getWithdrawAmountError({ ...input, hasQuoteCurrency: false })).toBe('Enter a valid quote-token amount.')
    expect(getWithdrawAmountError(input)).toBe('The Smart Wallet does not have enough quote-token balance.')
    expect(getWithdrawAmountError({ ...input, withdrawAll: true })).toBeUndefined()
  })

  it('requires a ready preview to remain bound to the exact request', () => {
    const preview = {
      recipientAddress: '0x1111111111111111111111111111111111111111',
      sweepAmountRaw: '42',
      quoteBalance: { valueRaw: '100', status: 'METRIC_STATUS_CURRENT' as const },
    }

    expect(
      validateWithdrawPreview({
        amountRaw: '42',
        ownerAddress: '0x1111111111111111111111111111111111111111',
        preview,
      }),
    ).toBeUndefined()
    expect(
      validateWithdrawPreview({
        amountRaw: '41',
        ownerAddress: '0x1111111111111111111111111111111111111111',
        preview,
      }),
    ).toBe('The prepared withdrawal amount does not match the requested amount.')
  })

  it('rejects exact withdrawals above the prepared Smart Wallet balance', () => {
    expect(
      validateWithdrawPreview({
        amountRaw: '101',
        ownerAddress: '0x1111111111111111111111111111111111111111',
        preview: {
          recipientAddress: '0x1111111111111111111111111111111111111111',
          sweepAmountRaw: '101',
          quoteBalance: { valueRaw: '100', status: 'METRIC_STATUS_CURRENT' },
        },
      }),
    ).toBe('The Smart Wallet quote balance is lower than the requested amount.')
  })

  it('rejects unavailable balance evidence and a changed quote token', () => {
    const base = {
      amountRaw: '42',
      expectedQuoteToken: { address: '0x2222222222222222222222222222222222222222', decimals: 6 },
      ownerAddress: '0x1111111111111111111111111111111111111111',
    }
    expect(
      validateWithdrawPreview({
        ...base,
        preview: {
          recipientAddress: base.ownerAddress,
          sweepAmountRaw: '42',
          quoteBalance: { valueRaw: '100', status: 'METRIC_STATUS_UNAVAILABLE' },
        },
      }),
    ).toBe('The prepared withdrawal is missing its quote-balance evidence.')
    expect(
      validateWithdrawPreview({
        ...base,
        preview: {
          recipientAddress: base.ownerAddress,
          sweepAmountRaw: '42',
          quoteBalance: { valueRaw: '100', status: 'METRIC_STATUS_CURRENT' },
          quoteToken: { address: '0x3333333333333333333333333333333333333333', decimals: 6 },
        },
      }),
    ).toBe('The prepared quote token does not match the selected balance.')
  })
})

const owner = '0x1111111111111111111111111111111111111111'
const token = { address: '0x2222222222222222222222222222222222222222' }
const preview: WithdrawTokensPreview = {
  selection: 'WITHDRAW_TOKEN_SELECTION_ALL_INDEXED_TOKENS',
  recipientAddress: owner,
  quoteToken: token,
  tokens: [{ token, balance: { status: 'METRIC_STATUS_CURRENT', valueRaw: '0' } }],
  totalCurrentValueUsd: { status: 'METRIC_STATUS_UNAVAILABLE' },
}

describe('All Tokens withdrawal', () => {
  it('allows all-zero balances and unavailable display enrichment', () => {
    expect(validateWithdrawTokensPreview(preview, owner)).toBeUndefined()
  })
  it('rejects incorrect recipients, selections and missing quote tokens', () => {
    expect(validateWithdrawTokensPreview({ ...preview, recipientAddress: token.address }, owner)).toBeTruthy()
    expect(validateWithdrawTokensPreview({ ...preview, selection: undefined }, owner)).toBeTruthy()
    expect(validateWithdrawTokensPreview({ ...preview, quoteToken: undefined }, owner)).toBeTruthy()
  })
  it('rejects empty, duplicate, and oversized inventory', () => {
    for (const tokens of [
      [],
      [
        { token, balance: { status: 'METRIC_STATUS_CURRENT' as const, valueRaw: '0' } },
        { token, balance: { status: 'METRIC_STATUS_CURRENT' as const, valueRaw: '0' } },
      ],
      Array(33).fill({ token, balance: { status: 'METRIC_STATUS_CURRENT' as const, valueRaw: '0' } }),
    ]) {
      expect(validateWithdrawTokensPreview({ ...preview, tokens }, owner)).toBeTruthy()
    }
  })
  it('does not authorize stale or missing raw balances', () => {
    for (const balance of [
      { status: 'METRIC_STATUS_STALE' as const, valueRaw: '1' },
      { status: 'METRIC_STATUS_CURRENT' as const },
      { status: 'METRIC_STATUS_CURRENT' as const, valueRaw: '-1' },
    ]) {
      expect(validateWithdrawTokensPreview({ ...preview, tokens: [{ token, balance }] }, owner)).toBeTruthy()
    }
  })
})

const ready = { accountConnected: true, onExpectedChain: true, isPreparing: false, executionBlocked: false }

describe('withdrawal primary action', () => {
  it('keeps wallet and network recovery available when preview fails', () => {
    const failed = { ...ready, previewError: 'Prepare failed', executionBlocked: true }
    expect(getWithdrawalPrimaryAction({ ...failed, accountConnected: false })).toMatchObject({
      label: 'Connect Wallet',
      disabled: false,
    })
    expect(getWithdrawalPrimaryAction({ ...failed, onExpectedChain: false })).toMatchObject({
      label: 'Switch Network',
      disabled: false,
    })
    expect(getWithdrawalPrimaryAction(failed)).toMatchObject({
      label: 'Withdraw Unavailable',
      disabled: true,
      title: 'Prepare failed',
    })
  })

  it('keeps Withdraw for invalid amounts and while preparing', () => {
    expect(getWithdrawalPrimaryAction({ ...ready, executionBlocked: true })).toMatchObject({
      label: 'Withdraw',
      disabled: true,
    })
    expect(getWithdrawalPrimaryAction({ ...ready, isPreparing: true })).toMatchObject({
      label: 'Withdraw',
      disabled: true,
    })
  })
})
